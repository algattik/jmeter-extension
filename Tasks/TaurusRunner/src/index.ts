import tasks = require('azure-pipelines-task-lib/task');
import path = require('path');
import * as runner from './taurus-runner';

async function runTaurus() {
    let taurusArguments = tasks.getInput("taurusArguments", true) ?? '';
    let jmeterHome = tasks.getInput("jmeterHome", true) ?? '';
    let jmeterPath = tasks.getInput("jmeterPath", true) ??  '';
    let jmeterVersion = tasks.getInput("jmeterVersion", true) ??  '';
    let outputDir = tasks.getInput("outputDir", true) ??  '';

    await runner.runTaurus(taurusArguments, jmeterHome, jmeterPath, jmeterVersion, outputDir);
}

async function run() {
    tasks.setResourcePath(path.join(__dirname, '..', 'task.json'));

    try {
        await runTaurus();
        tasks.setResult(tasks.TaskResult.Succeeded, "");
    } catch (error) {
        tasks.setResult(tasks.TaskResult.Failed, error);
    }
}

run();
