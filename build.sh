#!/bin/bash

set -euxo pipefail

taskVersion=$(date "+%s")

build_task() {
task=$1

pushd Tasks/$task
  npm install
  tsc
  mocha tests/_suite.js
popd

jq .version.Patch=$taskVersion Tasks/$task/task.json > tmp
mv tmp Tasks/$task/task.json
}

build_task JMeterInstaller
build_task TaurusInstaller
build_task TaurusRunner

tfx extension publish -t $ADO_TOKEN --manifest-globs vss-extension.json --share-with algattikjmeter --rev-version
