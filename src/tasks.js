import path from 'path'
import jp from 'fs-jetpack'
import entries from 'lodash/entries'
import includes from 'lodash/includes'
import mkdirp from 'mkdirp'
import toml from 'toml'

import { paths, Plugin } from './index'

const { configFile, downloadDir, sourceFile } = paths

mkdirp(downloadDir)

const config = toml.parse(jp.read(configFile, 'utf8'))
const plugins = entries(config)
const targetEntries = new Array(plugins.length)

export const downloadTasks = plugins.map((p, i) => { // eslint-disable-line
  return {
    title: `Downloading ${p[1].github || p[1]}...`,
    async task() {
      plugins[i] = new Plugin(p)
      if (jp.exists(plugins[i].downloadPath)) {
        await plugins[i].update()
      } else {
        await plugins[i].download()
      }
      targetEntries[i] = await plugins[i].entry()
    },
  }
})


export async function writeTask() {
  await jp.writeAsync(
    sourceFile,
    `${targetEntries.join('\n')}`,
  )
}

export async function cleanupTask() {
  const legalNames = [...plugins.map(plugin => plugin.name), 'plugins.zsh']
  const list = jp.list(downloadDir)
  if (!list) {
    return
  }
  list
    .filter(name => !includes(legalNames, name))
    .forEach(name => jp.remove(path.join(downloadDir, name)))
}
