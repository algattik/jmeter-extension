#!/bin/bash

set -euxo pipefail

taskVersion=$(date "+%s")

build_task() {
task=$1

pushd Tasks/$task
  npm install
  tsc
  INPUT_JMETERVERSION=5.1 mocha tests/_suite.js
popd

jq .version.Patch=$taskVersion Tasks/$task/task.json > tmp
mv tmp Tasks/$task/task.json
}

build_task JMeterInstaller
build_task TaurusInstaller

tfx extension publish -t $ADO_TOKEN --manifest-globs vss-extension.json --share-with algattikjmeter --rev-version
