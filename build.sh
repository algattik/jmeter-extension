#!/bin/bash

set -euxo pipefail

pushd Tasks/JMeterInstaller
  npm install
  tsc
  INPUT_JMETERVERSION=5.1 mocha tests/_suite.js
popd

jq .version.Patch=$(date "+%s") Tasks/JMeterInstaller/task.json > tmp
mv tmp Tasks/JMeterInstaller/task.json

tfx extension publish -t $ADO_TOKEN --manifest-globs vss-extension.json --share-with algattikjmeter --rev-version
