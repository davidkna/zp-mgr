import Listr from 'listr'
import { downloadTasks, writeTask, cleanupTask } from './tasks'
import { paths } from './index'

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
