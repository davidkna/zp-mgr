import crypto from 'crypto'
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

const plugins = require(path.join(xdg.config, 'zsh-plugin-manager', 'config.js'))
const sourceables = new Array(plugins.length)
const fpaths = new Array(plugins.length)


class Plugin {
  constructor(name) {
    this.name = name
    const sha1 = crypto.createHash('sha1')
    sha1.update(name)
    this.hash = sha1.digest('hex')
    this.clonePath = path.join(cloneDir, this.hash)
  }

  download() {
    const { name, clonePath } = this
    switch (jp.exists(path.join(clonePath, '.git'))) {
      case false:
        if (jp.exists(clonePath)) {
          jp.remove(clonePath)
        }
        return execa('git', ['clone', '--recursive', '--', `https://github.com/${name}.git`, clonePath])
      case 'dir':
        execa.sync('git', ['fetch', '--all'], { cwd: clonePath })
        return execa('git', ['reset', '--hard', 'origin/master', '--'], { cwd: clonePath })
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
          task() {
            if (typeof plugins[i] === 'string') {
              plugins[i] = new Plugin(p)
            }
            const plugin = plugins[i]
            return plugin
              .download()
              .then(() => {
                sourceables[i] = plugin.getSourceFile()
                fpaths[i] = plugin.getFpath()
              })
          },
        }
      }), {
        concurrent: true,
      })
    },
  },
  {
    title: `Writing to ${path.join(cloneDir, 'plugins.zsh')}…`,
    task() {
      const pluginFile = path.join(cloneDir, 'plugins.zsh')
      const src = sourceables
        .filter(s => s)
        .map(s => `source ${s}`).join('\n')
      const fp = fpaths
        .filter(f => f)
        .map(f => `fpath+=${f}`).join('\n')

      return jp.writeAsync(
        pluginFile,
        `${src}\n${fp}`
      )
    },
  },
  {
    title: 'Cleaning up old plugins…',
    task() {
      const legalNames = [...plugins.map(plugin => plugin.hash), 'plugins.zsh']
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

tasks.run().catch(err => {
  console.error(err) // eslint-disable-line no-console
  process.exit(1)
})
