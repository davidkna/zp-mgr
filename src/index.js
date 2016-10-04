import path from 'path'
import execa from 'execa'
import findup from 'findup-sync'
import xdg from 'xdg-basedir'

export const paths = {
  downloadDir: path.join(xdg.data, 'zsh-goggles'),
  configFile: path.join(xdg.config, 'zsh-goggles', 'config.js'),
  sourceFile: path.join(xdg.data, 'zsh-goggles', 'plugins.zsh'),
}

export class Plugin {
  constructor(name) {
    this.name = name
    this.uniqueName = name.replace(/^.*\//, '')
  }

  getDownloadPath() {
    return path.join(paths.downloadDir, this.uniqueName)
  }

  getFpath() {
    return this.getDownloadPath()
  }

  getSourceFile() {
    const globs = [
      `${this.uniqueName}?(.plugin).?(z)sh`,
      '*.plugin.zsh',
      'init.zsh',
      '*.zsh',
      '*.sh',
    ]

    return findup(globs, {
      cwd: this.getDownloadPath(),
      nocase: true,
      maxdepth: 0,
    })
  }

  async download() {
    await execa('git', ['clone', '--recursive', '--', `https://github.com/${this.name}.git`, this.getDownloadPath()])
  }

  async update() {
    await execa('git', ['fetch', '--all'], { cwd: this.getDownloadPath() })
    await execa('git', ['reset', '--hard', 'origin/master', '--'], { cwd: this.getDownloadPath() })
  }
}
