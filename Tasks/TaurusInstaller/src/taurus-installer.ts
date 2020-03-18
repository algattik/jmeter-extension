import tasks = require('azure-pipelines-task-lib/task');
import { ToolRunner } from 'azure-pipelines-task-lib/toolrunner';


export async function installTaurus(version: string) {
    if (!/^(\d[\w.]*)$/.test(version)) {
        throw new Error(tasks.loc("InputVersionNotValidVersion", version));
    }

    let pipTool: ToolRunner = tasks.tool("pip3");
    pipTool.arg(["install", `bzt==${version}`]);
    let res = await pipTool.exec();
    if (res != 0) {
        throw new Error(tasks.loc("TaurusInstallFailed"));
    }
}
