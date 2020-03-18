import tasks = require('azure-pipelines-task-lib/task');
import { ToolRunner } from 'azure-pipelines-task-lib/toolrunner';


export async function runTaurus(version: string) {

    if (!/^(\d[\w.]*)$/.test(version)) {
        throw new Error(tasks.loc("InputVersionNotValidVersion", version));
    }

    let artifactsDir = "output";
    let reportDir = "report";
    let jmeterPath = "jmeter";
    let jmeterToolPath = "jmeter";
    let jmeterVersion = "5.1";
    let testReportFile = "TEST-XXXX.xml";

    let reportingConfig = {
        module: 'junit-xml',
        filename: testReportFile
    };
    let reporting = JSON.stringify(reportingConfig);

    let taurusTool: ToolRunner = tasks.tool("bzt");
    taurusTool.arg(["-o", `settings.artifacts-dir=${artifactsDir}`]);
    taurusTool.arg(["-o", `modules.jmeter.path=${jmeterPath}`]);
    taurusTool.arg(["-o", `modules.jmeter.version=${jmeterVersion}`]);
    taurusTool.arg(["-o", `reporting.-1=${reporting}`]);
    taurusTool.arg(["website-test.yml"]);
    let res = await taurusTool.exec();
    if (res != 0) {
        throw new Error(tasks.loc("TaurusRunFailed"));
    }

    let jmeterTool: ToolRunner = tasks.tool(jmeterToolPath);
    jmeterTool.arg(["-Jjmeter.save.saveservice.assertion_results_failure_message=false"]);
    jmeterTool.arg(["-g", `${artifactsDir}/kpi.jtl`]);
    jmeterTool.arg(["-o", reportDir]);
    jmeterTool.arg(["-q", `${artifactsDir}/jmeter-bzt.properties`]);

    let jmeterRes = await jmeterTool.exec();
    if (jmeterRes != 0) {
        throw new Error(tasks.loc("JMeterRunFailed"));
    }

}
