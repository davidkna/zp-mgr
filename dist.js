'use strict';

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _execa = require('execa');

var _execa2 = _interopRequireDefault(_execa);

var _glob = require('glob');

var _glob2 = _interopRequireDefault(_glob);

var _fsJetpack = require('fs-jetpack');

var _fsJetpack2 = _interopRequireDefault(_fsJetpack);

var _listr = require('listr');

var _listr2 = _interopRequireDefault(_listr);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _rimraf = require('rimraf');

var _rimraf2 = _interopRequireDefault(_rimraf);

var _xdgBasedir = require('xdg-basedir');

var _xdgBasedir2 = _interopRequireDefault(_xdgBasedir);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const cloneDir = _path2.default.join(_xdgBasedir2.default.data, 'zsh_plugins');
(0, _mkdirp2.default)(cloneDir);

let plugins = ['Tarrasch/zsh-colors', 'zsh-users/zsh-syntax-highlighting', 'zsh-users/zsh-history-substring-search', 'zsh-users/zsh-completions', 'mafredri/zsh-async', 'sindresorhus/pure'];

class Plugin {
  constructor(name) {
    this.name = name;
    const sha1 = _crypto2.default.createHash('sha1');
    sha1.update(name);
    this.hash = sha1.digest('hex');
  }

  get clonePath() {
    return _path2.default.join(cloneDir, this.hash);
  }
}

const sourceables = [];
const fpaths = [];

const tasks = new _listr2.default([{
  title: 'Getting Paths for Cloning',
  task() {
    plugins = plugins.map(plugin => new Plugin(plugin));
  }
}, {
  title: 'Cleaning up',
  task() {
    const legalNames = plugins.map(plugin => plugin.hash);
    legalNames.push('plugins.zsh');
    const list = _fsJetpack2.default.list(cloneDir);
    if (list === null) {
      return;
    }
    list.filter(name => !legalNames.includes(name)).forEach(name => (0, _rimraf2.default)(_path2.default.join(cloneDir, name)));
  }
}, {
  title: 'Cloning Plugins',
  task() {
    return new _listr2.default(plugins.map(plugin => {
      const { name, clonePath } = plugin;
      return {
        title: `Cloning ${ name }...`,
        task() {
          switch (_fsJetpack2.default.exists(clonePath)) {
            case false:
              return (0, _execa2.default)('git', ['clone', '--recursive', '--', `https://github.com/${ name }.git`, clonePath]);
            case 'dir':
              _execa2.default.sync('git', ['fetch', '--all'], { cwd: clonePath });
              return (0, _execa2.default)('git', ['reset', '--hard', 'origin/master'], { cwd: clonePath });
            default:
              throw new Error('Invalid clone target!');
          }
        }
      };
    }), {
      concurrent: true
    });
  }
}, {
  title: 'Getting zsh File ready',
  task() {
    return new _listr2.default(plugins.map(plugin => {
      // eslint-disable-line
      return {
        title: `Getting ${ plugin.name } ready...`,
        task() {
          const name = plugin.name.split('/')[1];
          const globs = [`${ name }.plugin.zsh`, '*.plugin.zsh', 'init.zsh', '*.zsh', '*.sh'];
          fpaths.push(plugin.clonePath);
          for (let i = 0; i < globs.length; i++) {
            const list = _glob2.default.sync(_path2.default.join(plugin.clonePath, globs[i]));

            if (list.length !== 0) {
              sourceables.push(list[0]);
              break;
            }
          }
        }
      };
    }), {
      concurrent: true
    });
  }
}, {
  title: `Writing ${ _path2.default.join(cloneDir, 'plugins.zsh') }`,
  task() {
    return _fsJetpack2.default.writeAsync(_path2.default.join(cloneDir, 'plugins.zsh'), sourceables.map(s => `source ${ s }`).join('\n') // eslint-disable-line
    + '\n' + fpaths.map(f => `fpath+=${ f }`).join('\n'));
  }
}]);

tasks.run().catch(err => {
  console.error(err); // eslint-disable-line no-console
});

