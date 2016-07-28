#!/usr/bin/env sh

npm run test

echo "Test with no uglify"
npm run build:nouglify
chmod +x dist.js
node cli.js

echo "Test with uglify"
rm dist.js
npm run build
chmod +x dist.js
node cli.js

echo "Source file:"
cat ~/.local/share/zsh_plugins/plugins.zsh

echo "Plugin folder contents:"
ls -Al ~/.local/share/zsh_plugins/*
