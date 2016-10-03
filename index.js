import path from 'path'

import execa from 'execa'
import findup from 'findup-sync'
import jp from 'fs-jetpack'
import includes from 'lodash.includes'
import Listr from 'listr'
import mkdirp from 'mkdirp'
import xdg from 'xdg-basedir'

const cloneDir = path.join(xdg.data, 'zsh_plugins')

mkdirp(cloneDir)

const plugins = require(path.join(xdg.config, 'zsh-plugin-manager', 'config.js')) // eslint-disable-line import/no-dynamic-require
const sourceables = new Array(plugins.length)
const fpaths = new Array(plugins.length)


class Plugin {
  constructor(name) {
    this.name = name
    this.uniqueName = name.split('/')[1]
    this.clonePath = path.join(cloneDir, this.uniqueName)
  }

  async download() {
    const { name, clonePath } = this
    switch (jp.exists(path.join(clonePath, '.git'))) {
      case false:
        if (jp.exists(clonePath)) {
          jp.remove(clonePath)
        }
        await execa('git', ['clone', '--recursive', '--', `https://github.com/${name}.git`, clonePath])
        break
      case 'dir':
        await execa('git', ['fetch', '--all'], { cwd: clonePath })
        await execa('git', ['reset', '--hard', 'origin/master', '--'], { cwd: clonePath })
        break
      default:
        throw new Error('Invalid clone target!')
    }
  }

  getFpath() {
    return this.clonePath
  }

  getSourceFile() {
    const actualName = this.name.split('/')[1]
    const globs = [
      `${actualName}?(.plugin).?(z)sh`,
      '*.plugin.zsh',
      'init.zsh',
      '*.zsh',
      '*.sh',
    ]

    return findup(globs, {
      cwd: this.clonePath,
      nocase: true,
    })
  }
}

const tasks = new Listr([
  {
    title: 'Downloading plugins…',
    task() {
      return new Listr(plugins.map((p, i) => { // eslint-disable-line
        return {
          title: `Downloading ${p}...`,
          async task() {
            if (typeof plugins[i] === 'string') {
              plugins[i] = new Plugin(p)
            }
            const plugin = plugins[i]
            await plugin.download()
            sourceables[i] = plugin.getSourceFile()
            fpaths[i] = plugin.getFpath()
          },
        }
      }), {
        concurrent: true,
      })
    },
  },
  {
    title: `Writing to ${path.join(cloneDir, 'plugins.zsh')}…`,
    async task() {
      const pluginFile = path.join(cloneDir, 'plugins.zsh')
      const src = sourceables
        .filter(s => s)
        .map(s => `source ${s}`).join('\n')
      const fp = fpaths
        .filter(f => f)
        .map(f => `fpath+=${f}`).join('\n')

      await jp.writeAsync(
        pluginFile,
        `${src}\n${fp}`
      )
    },
  },
  {
    title: 'Cleaning up old plugins…',
    async task() {
      const legalNames = [...plugins.map(plugin => plugin.uniqueName), 'plugins.zsh']
      const list = jp.list(cloneDir)
      if (!list) {
        return
      }
      list
        .filter(name => !includes(legalNames, name))
        .forEach(name => jp.remove(path.join(cloneDir, name)))
    },
  },
])

tasks.run()
