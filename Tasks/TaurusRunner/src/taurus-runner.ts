import tasks = require('azure-pipelines-task-lib/task');
import path = require('path');
import { ToolRunner } from 'azure-pipelines-task-lib/toolrunner';


export async function runTaurus(taurusArguments: string, jmeterHome: string, jmeterPath: string, jmeterVersion: string, outputDir: string) {

    if (!/^(\d[\w.]*)$/.test(jmeterVersion)) {
        throw new Error(tasks.loc("InputVersionNotValidVersion", jmeterVersion));
    }

    let reportingConfig = {
        module: 'junit-xml',
        filename: path.join(outputDir, "TEST-Taurus.xml")
    };
    let reporting = JSON.stringify(reportingConfig);

    let taurusTool: ToolRunner = tasks.tool("bzt");
    taurusTool.arg(["-o", `settings.artifacts-dir=${outputDir}`]);
    taurusTool.arg(["-o", `modules.jmeter.path=${jmeterHome}`]);
    taurusTool.arg(["-o", `modules.jmeter.version=${jmeterVersion}`]);
    taurusTool.arg(["-o", `reporting.-1=${reporting}`]);
    taurusTool.line(taurusArguments);
    let res = await taurusTool.exec();
    if (res != 0) {
        throw new Error(tasks.loc("TaurusRunFailed"));
    }

    let jmeterTool: ToolRunner = tasks.tool(jmeterPath);
    jmeterTool.arg(["-Jjmeter.save.saveservice.assertion_results_failure_message=false"]);
    jmeterTool.arg(["-g", `${outputDir}/kpi.jtl`]);
    jmeterTool.arg(["-o", `${outputDir}/report`]);
    jmeterTool.arg(["-q", `${outputDir}/jmeter-bzt.properties`]);

    let jmeterRes = await jmeterTool.exec();
    if (jmeterRes != 0) {
        throw new Error(tasks.loc("JMeterRunFailed"));
    }

}
