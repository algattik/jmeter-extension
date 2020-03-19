import tasks = require('azure-pipelines-task-lib/task');
import path = require('path');
import * as runner from './taurus-runner';

async function runTaurus() {
    let taurusConfig = tasks.getInput("taurusConfig", false) ?? '';
    let taurusArguments = tasks.getInput("taurusArguments", false) ?? '';
    let jmeterHome = tasks.getInput("jmeterHome", true) ?? '';
    let jmeterPath = tasks.getInput("jmeterPath", true) ?? '';
    let jmeterVersion = tasks.getInput("jmeterVersion", true) ?? '';
    let outputDir = tasks.getInput("outputDir", true) ?? '';
    let uploadReport = tasks.getBoolInput("uploadReport", true) ?? '';

    let taurusArgs = await runner.buildTaurusArgs(taurusConfig, taurusArguments);
    await runner.runTaurusTool( taurusArgs, jmeterHome, jmeterVersion, outputDir);
    let reportDir = await runner.generateJMeterReport(jmeterPath, outputDir);
    if (uploadReport) {
        await runner.uploadJMeterReport(reportDir);
    }
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
