import tasks = require('azure-pipelines-task-lib/task');
import path = require('path');
import * as runner from './taurus-runner';

async function runTaurus() {
    let inputVersion = tasks.getInput("taurusVersion", true) ?? '';
    await runner.runTaurus(inputVersion);
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
