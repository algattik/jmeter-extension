import tasks = require('azure-pipelines-task-lib/task');
import tools = require('azure-pipelines-tool-lib/tool');
import { ToolRunner } from 'azure-pipelines-task-lib/toolrunner';
import path = require('path');
import * as installer from './taurus-installer';

async function configureTaurus() {
    let inputVersion = tasks.getInput("taurusVersion", true) ?? '';
    let taurusPath = await installer.downloadTaurus(inputVersion);
    let envPath = process.env['PATH'];

    // Prepend the tools path. Instructs the agent to prepend for future tasks
    if (envPath && !envPath.startsWith(path.dirname(taurusPath))) {
        tools.prependPath(path.dirname(taurusPath));
    }
}

async function verifyTaurus() {
    console.log(tasks.loc("VerifyTaurusInstallation"));
    let taurusPath = tasks.which("taurus", true);
    let taurusTool : ToolRunner = tasks.tool(taurusPath);
    taurusTool.arg("--version");
    return taurusTool.exec();
}

async function run() {
    tasks.setResourcePath(path.join(__dirname, '..', 'task.json'));

    try {
        await configureTaurus();
        await verifyTaurus();
        tasks.setResult(tasks.TaskResult.Succeeded, "");
    } catch (error) {
        tasks.setResult(tasks.TaskResult.Failed, error);
    }
}

run();
