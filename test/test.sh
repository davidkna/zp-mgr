#!/usr/bin/env bash

set -e

npm run test

echo "Config file is at ${XDG_CONFIG_HOME:-$HOME/.config}/zsh-plugin-manager/config.js"

mkdir -p "${XDG_CONFIG_HOME:-$HOME/.config}/zsh-plugin-manager"
cp test/zsh-plugin-manager.config.js "${XDG_CONFIG_HOME:-$HOME/.config}/zsh-plugin-manager/config.js"

echo "Test if it works with no uglify"
npm run build:nouglify
node bin/cli.js

echo "Source file:"
cat ~/.local/share/zsh_plugins/plugins.zsh

echo "Test if it works with uglify"
rm bin/dist.js
npm run build
node bin/cli.js

echo "Source file:"
cat ~/.local/share/zsh_plugins/plugins.zsh

echo "Plugin folder contents:"
ls -Al ~/.local/share/zsh_plugins/*
