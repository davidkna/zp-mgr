import path from 'path'
import jp from 'fs-jetpack'
import includes from 'lodash.includes'
import mkdirp from 'mkdirp'

import { paths, Plugin } from './index'

const { configFile, downloadDir, sourceFile } = paths

mkdirp(downloadDir)

const plugins = require(configFile) // eslint-disable-line import/no-dynamic-require
const sourceables = new Array(plugins.length)
const fpaths = new Array(plugins.length)

export const downloadTasks = plugins.map((p, i) => { // eslint-disable-line
  return {
    title: `Downloading ${p}...`,
    async task() {
      if (typeof plugins[i] === 'string') {
        plugins[i] = new Plugin(p)
      }
      const plugin = plugins[i]
      if (jp.exists(plugin.getDownloadPath())) {
        await plugin.update()
      } else {
        await plugin.download()
      }
      sourceables[i] = plugin.getSourceFile()
      fpaths[i] = plugin.getFpath()
    },
  }
})


export async function writeTask() {
  const src = sourceables
    .filter(s => s)
    .map(s => `source ${s}`).join('\n')
  const fp = fpaths
    .filter(f => f)
    .map(f => `fpath+=${f}`).join('\n')

  await jp.writeAsync(
    sourceFile,
    `${src}\n${fp}`
  )
}

export async function cleanupTask() {
  const legalNames = [...plugins.map(plugin => plugin.uniqueName), 'plugins.zsh']
  const list = jp.list(downloadDir)
  if (!list) {
    return
  }
  list
    .filter(name => !includes(legalNames, name))
    .forEach(name => jp.remove(path.join(downloadDir, name)))
}
