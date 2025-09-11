#!/bin/bash
npm outdated
npm audit
rm -rf node_modules package-lock.json
npm install
npm prune
npm audit fix
npm update
