import crypto from 'crypto'
import path from 'path'

import execa from 'execa'
import glob from 'glob'
import jp from 'fs-jetpack'
import includes from 'lodash.includes'
import Listr from 'listr'
import mkdirp from 'mkdirp'
import xdg from 'xdg-basedir'

const cloneDir = path.join(xdg.data, 'zsh_plugins')
mkdirp(cloneDir)

let plugins = [
  'Tarrasch/zsh-colors',
  'zsh-users/zsh-syntax-highlighting',
  'zsh-users/zsh-history-substring-search',
  'zsh-users/zsh-completions',
  'mafredri/zsh-async',
  'sindresorhus/pure',
]

class Plugin {
  constructor(name) {
    this.name = name
    const sha1 = crypto.createHash('sha1')
    sha1.update(name)
    this.hash = sha1.digest('hex')
  }

  get clonePath() {
    return path.join(cloneDir, this.hash)
  }
}

const sourceables = []
const fpaths = []

const tasks = new Listr([
  {
    title: 'Getting Paths for Cloning',
    task() {
      plugins = plugins.map(plugin => new Plugin(plugin))
    },
  },
  {
    title: 'Cleaning up',
    task() {
      const legalNames = plugins.map(plugin => plugin.hash)
      legalNames.push('plugins.zsh')
      const list = jp.list(cloneDir)
      if (!list) {
        return
      }
      list
        .filter(name => !includes(legalNames, name))
        .forEach(name => jp.remove(path.join(cloneDir, name)))
    },
  },
  {
    title: 'Cloning Plugins',
    task() {
      return new Listr(plugins.map(plugin => {
        const { name, clonePath } = plugin
        return {
          title: `Cloning ${name}...`,
          task() {
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
          },
        }
      }), {
        concurrent: true,
      })
    },
  },
  {
    title: 'Getting zsh File ready',
    task() {
      return new Listr(plugins.map(plugin => { // eslint-disable-line
        return {
          title: `Getting ${plugin.name} ready...`,
          task() {
            const name = plugin.name.split('/')[1]
            const globs = [
              `${name}.plugin.zsh`,
              '*.plugin.zsh',
              'init.zsh',
              '*.zsh',
              '*.sh',
            ]
            fpaths.push(plugin.clonePath)
            for (let i = 0; i < globs.length; i++) {
              const list = glob.sync(path.join(plugin.clonePath, globs[i]))

              if (list.length !== 0) {
                sourceables.push(list[0])
                break
              }
            }
          },
        }
      }), {
        concurrent: true,
      })
    },
  },
  {
    title: `Writing ${path.join(cloneDir, 'plugins.zsh')}`,
    task() {
      return jp.writeAsync(
      path.join(cloneDir, 'plugins.zsh'),
      sourceables.map(s => `source ${s}`).join('\n') // eslint-disable-line
      + '\n'
      + fpaths.map(f => `fpath+=${f}`).join('\n'))
    },
  },
])

tasks.run().catch(err => {
  console.error(err) // eslint-disable-line no-console
  process.exit(1)
})
