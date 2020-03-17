import tasks = require('azure-pipelines-task-lib/task');
import tools = require('azure-pipelines-tool-lib/tool');
import { ToolRunner } from 'azure-pipelines-task-lib/toolrunner';
import path = require('path');
import os = require('os');
import fs = require('fs');

const uuidV4 = require('uuid/v4');
const jmeterToolName = "jmeter";
const isWindows = os.type().match(/^Win/);
const cmdrunnerUrl = "http://search.maven.org/remotecontent?filepath=kg/apc/cmdrunner/2.2/cmdrunner-2.2.jar";
const pluginmgrUrl = "http://search.maven.org/remotecontent?filepath=kg/apc/jmeter-plugins-manager/1.3/jmeter-plugins-manager-1.3.jar";


export async function downloadJMeter(version: string): Promise<string> {
    if (!/^(\d[\w.]*)$/.test(version)) {
        throw new Error(tasks.loc("InputVersionNotValidVersion", version));
    }

    let cachedToolPath = tools.findLocalTool(jmeterToolName, version);
    if (!cachedToolPath) {
        let jmeterDownloadUrl = getJMeterDownloadUrl(version);
        let jmeterDownloadPath;

        try {
            jmeterDownloadPath = await tools.downloadTool(jmeterDownloadUrl);
        } catch (exception) {
            throw new Error(tasks.loc("JMeterDownloadFailed", jmeterDownloadUrl, exception));
        }

        let jmeterUnzippedPath = await tools.extractZip(jmeterDownloadPath);

        let jmeterDir = `${jmeterUnzippedPath}/apache-jmeter-${version}`;

        try {
            await tools.downloadTool(cmdrunnerUrl, `${jmeterDir}/lib/cmdrunner-2.2.jar`);
        } catch (exception) {
            throw new Error(tasks.loc("JMeterDownloadFailed", cmdrunnerUrl, exception));
        }

        let pm = `${jmeterDir}/lib/ext/jmeter-plugins-manager-1.3.jar`;
        try {
            await tools.downloadTool(pluginmgrUrl, pm);
        } catch (exception) {
            throw new Error(tasks.loc("JMeterUtilityDownloadFailed", cmdrunnerUrl, exception));
        }

        let jmeterTool: ToolRunner = tasks.tool("java");
        jmeterTool.arg(["-cp", pm, "org.jmeterplugins.repository.PluginManagerCMDInstaller"]);
        let res = await jmeterTool.exec();
        if (res != 0) {
            throw new Error(tasks.loc("JMeterPluginManagerInstallFailed", cmdrunnerUrl));
        }

        let pmCmd: ToolRunner = tasks.tool(`${jmeterDir}/bin/PluginsManagerCMD.sh`);
        pmCmd.arg(["install", "jpgc-fifo,jpgc-json=2.2"]);
        let pmCmdRes = await pmCmd.exec();
        if (pmCmdRes != 0) {
            throw new Error(tasks.loc("JMeterPluginInstallFailed", cmdrunnerUrl));
        }

        cachedToolPath = await tools.cacheDir(jmeterUnzippedPath, jmeterToolName, version);
    }

    let jmeterPath = findJMeterExecutable(cachedToolPath);
    if (!jmeterPath) {
        throw new Error(tasks.loc("JMeterNotFoundInFolder", cachedToolPath));
    }

    tasks.setVariable('jmeterLocation', jmeterPath);

    return jmeterPath;
}

function getJMeterDownloadUrl(version: string): string {
    return `https://archive.apache.org/dist/jmeter/binaries/apache-jmeter-${version}.zip`;
}

function findJMeterExecutable(rootFolder: string): string {
    let jmeterPath = path.join(rootFolder, "*/bin/" + jmeterToolName + getBatchfileExtension());
    var allPaths = tasks.find(rootFolder);
    var matchingResultFiles = tasks.match(allPaths, jmeterPath, rootFolder);
    return matchingResultFiles[0];
}

function getBatchfileExtension(): string {
    if (isWindows) {
        return ".bat";
    }

    return "";
}
