#!/usr/bin/env node
"use strict";function _interopRequireDefault(e){return e&&e.__esModule?e:{default:e}}var _listr=require("listr"),_listr2=_interopRequireDefault(_listr),_tasks=require("./tasks"),_index=require("./index"),sourceFile=_index.paths.sourceFile,tasks=new _listr2.default([{title:"Downloading plugins…",task(){return new _listr2.default(_tasks.downloadTasks,{concurrent:!0})}},{title:`Writing to ${sourceFile}…`,task:_tasks.writeTask},{title:"Cleaning up old plugins…",task:_tasks.cleanupTask}]);tasks.run();