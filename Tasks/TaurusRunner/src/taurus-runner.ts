import tasks = require('azure-pipelines-task-lib/task');
import path = require('path');
var zipper = require('zip-local');
import { ToolRunner } from 'azure-pipelines-task-lib/toolrunner';


export async function runTaurusTool(taurusArguments: string, jmeterHome: string, jmeterVersion: string, outputDir: string) {
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
}

export async function generateJMeterReport(jmeterPath: string, outputDir: string): Promise<string> {

    let reportDir = `${outputDir}/report`;

    let jmeterTool: ToolRunner = tasks.tool(jmeterPath);
    jmeterTool.arg(["-Jjmeter.save.saveservice.assertion_results_failure_message=false"]);
    jmeterTool.arg(["-g", `${outputDir}/kpi.jtl`]);
    jmeterTool.arg(["-o", `${outputDir}/report`]);
    jmeterTool.arg(["-q", `${outputDir}/jmeter-bzt.properties`]);

    let jmeterRes = await jmeterTool.exec();
    if (jmeterRes != 0) {
        throw new Error(tasks.loc("JMeterRunFailed"));
    }
    return reportDir;
}

export async function uploadJMeterReport(reportDir: string) {
    let zipFile = `artifactPath.zip`;
    zipper.sync.zip(reportDir).compress().save(zipFile);
    tasks.uploadFile(zipFile);
}