#!/usr/bin/env bash

set -e

npm run test

mkdir -p "${XDG_CONFIG_HOME:-$HOME/.cache}/zsh-plugin-manager"
ln -sf test/zsh-plugin-manager.config.js "${XDG_CONFIG_HOME:-$HOME/.cache}/zsh-plugin-manager/config.js"

echo "Test if works with no uglify"
npm run build:nouglify
node bin/cli.js

echo "Test if works with uglify"
rm bin/dist.js
npm run build
node bin/cli.js

echo "Source file:"
cat ~/.local/share/zsh_plugins/plugins.zsh

echo "Plugin folder contents:"
ls -Al ~/.local/share/zsh_plugins/*
