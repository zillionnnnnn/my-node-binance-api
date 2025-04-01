#!/bin/bash

npm pack . --silent
mv node-binance-api*.tgz ./tests/package-test/
cd ./tests/package-test
npm init -y > /dev/null
npm install node-binance-api*.tgz
node test-esm.mjs
return_code=$?
node test-cjs.cjs
cjs_return_code=$?
rm -rf node_modules node-binance-api*.tgz package-lock.json package.json

if [ $return_code -eq 0 ] && [ $cjs_return_code -eq 0 ]; then
  echo "Package test successful"
  exit 0
else
  echo "Package test failed"
  exit 1
fi