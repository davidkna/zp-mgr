import 'babel-polyfill'
import Listr from 'listr'
import updateNotifier from 'update-notifier'
import { downloadTasks, writeTask, cleanupTask } from './tasks'
import { paths } from './index'

const pkg = require('../package.json') // eslint-disable-line import/newline-after-import
updateNotifier({ pkg }).notify()

process.umask(process.umask() | 0o022)

const { sourceFile } = paths

const tasks = new Listr([
  {
    title: 'Downloading plugins…',
    task() {
      return new Listr(downloadTasks, {
        concurrent: true,
      })
    },
  },
  {
    title: `Writing to ${sourceFile}…`,
    task: writeTask,
  },
  {
    title: 'Cleaning up old plugins…',
    task: cleanupTask,
  },
])

tasks.run()
