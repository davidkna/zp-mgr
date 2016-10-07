import path from 'path'
import execa from 'execa'
import findup from 'findup-sync'
import isString from 'lodash/isString'
import isFunction from 'lodash/isFunction'
import xdg from 'xdg-basedir'

export const paths = {
  downloadDir: path.join(xdg.data, 'zsh-goggles'),
  configFile: path.join(xdg.config, 'zsh-goggles', 'config.js'),
  sourceFile: path.join(xdg.data, 'zsh-goggles', 'plugins.zsh'),
}

export class Plugin {
  constructor([name, config]) {
    this.name = name
    this.downloadPath = path.join(paths.downloadDir, name)
    if (isString(config)) {
      this.github = config
    } else {
      this.github = config.github
      this._sourceFile = config.source
      this._fpath = config.fpath
    }
  }
  get fpath() {
    const f = this._fpath
    if (f === false) {
      return undefined
    } else if (isString(f)) {
      return path.join(this.downloadPath, f)
    } else if (isFunction(f)) {
      return f(this.downloadPath)
    }
    return this.downloadPath
  }

  get sourceFile() {
    const s = this._sourceFile
    if (s === false) {
      return undefined
    } else if (isString(s)) {
      return path.join(this.downloadPath, s)
    } else if (isFunction(s)) {
      return s(this.downloadPath)
    }
    const globs = [
      `${this.uniqueName}?(.plugin).?(z)sh`,
      '*.plugin.zsh',
      'init.zsh',
      '*.zsh',
      '*.sh',
    ]

    return findup(globs, {
      cwd: this.downloadPath,
      nocase: true,
      maxdepth: 0,
    })
  }

  async download() {
    await execa('git', ['clone', '--recursive', '--', `https://github.com/${this.github}.git`, this.downloadPath])
  }

  async update() {
    await execa('git', ['fetch', '--all'], { cwd: this.downloadPath })
    await execa('git', ['reset', '--hard', 'origin/master', '--'], { cwd: this.downloadPath })
  }
}
