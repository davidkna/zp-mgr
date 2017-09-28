import path from 'path'
import findup from 'findup-sync'
import fse from 'fs-extra'
import isString from 'lodash/isString'
import isFunction from 'lodash/isFunction'
import nodegit from 'nodegit'
import xdg from 'xdg-basedir'

export const paths = {
  downloadDir: path.join(xdg.data, 'zsh-goggles'),
  configFile: path.join(xdg.config, 'zsh-goggles', 'config.toml'),
  sourceFile: path.join(xdg.data, 'zsh-goggles', 'plugins.zsh'),
}

const defaultConfig = {
  standalone: true,
  source: true,
  fpath: true,
}

export class Plugin {
  constructor([name, config]) {
    this.name = name
    this.downloadPath = path.join(paths.downloadDir, name)

    this.config = {}
    Object.assign(this.config, defaultConfig)
    if (isString(config)) {
      this.config.github = config
      return
    }
    Object.assign(this.config, config)
  }

  get fpath() {
    const f = this.config.fpath
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
    const s = this.config.source
    if (s === false) {
      return undefined
    } else if (isString(s)) {
      return path.join(this.downloadPath, s)
    } else if (isFunction(s)) {
      return s(this.downloadPath)
    }
    const globs = [
      `${this.name}?(.plugin).?(z)sh`,
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

  async entry() {
    let result = ''
    if (this.sourceFile) {
      if (this.config.standalone) {
        result += await fse.read(this.sourceFile)
      } else {
        result += `source ${this.sourceFile}`
      }
    }
    if (this.fpath) {
      result += `\nfpath+=${this.fpath}`
    }
    return result
  }

  async download() {
    await nodegit.Clone(`https://github.com/${this.config.github}.git`, this.downloadPath)
  }

  async update() {
    const repo = await nodegit.Repository.open(this.downloadPath)
    await repo.fetchAll()
    await repo.mergeBranches('master', 'origin/master')
  }
}
