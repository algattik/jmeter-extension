import tasks = require('azure-pipelines-task-lib/task');
import tools = require('azure-pipelines-tool-lib/tool');
import { ToolRunner } from 'azure-pipelines-task-lib/toolrunner';
import path = require('path');
import os = require('os');
import fs = require('fs');

const uuidV4 = require('uuid/v4');
const taurusToolName = "taurus";
const isWindows = os.type().match(/^Win/);
const cmdrunnerUrl = "http://search.maven.org/remotecontent?filepath=kg/apc/cmdrunner/2.2/cmdrunner-2.2.jar";
const pluginmgrUrl = "http://search.maven.org/remotecontent?filepath=kg/apc/taurus-plugins-manager/1.3/taurus-plugins-manager-1.3.jar";


export async function downloadTaurus(version: string): Promise<string> {
    if (!/^(\d[\w.]*)$/.test(version)) {
        throw new Error(tasks.loc("InputVersionNotValidVersion", version));
    }

    let cachedToolPath = tools.findLocalTool(taurusToolName, version);
    if (!cachedToolPath) {
        let taurusDownloadUrl = getTaurusDownloadUrl(version);
        let taurusDownloadPath;

        try {
            taurusDownloadPath = await tools.downloadTool(taurusDownloadUrl);
        } catch (exception) {
            throw new Error(tasks.loc("TaurusDownloadFailed", taurusDownloadUrl, exception));
        }

        let taurusUnzippedPath = await tools.extractZip(taurusDownloadPath);

        let taurusDir = `${taurusUnzippedPath}/apache-taurus-${version}`;

        try {
            await tools.downloadTool(cmdrunnerUrl, `${taurusDir}/lib/cmdrunner-2.2.jar`);
        } catch (exception) {
            throw new Error(tasks.loc("TaurusDownloadFailed", cmdrunnerUrl, exception));
        }

        let pm = `${taurusDir}/lib/ext/taurus-plugins-manager-1.3.jar`;
        try {
            await tools.downloadTool(pluginmgrUrl, pm);
        } catch (exception) {
            throw new Error(tasks.loc("TaurusUtilityDownloadFailed", cmdrunnerUrl, exception));
        }

        let taurusTool: ToolRunner = tasks.tool("java");
        taurusTool.arg(["-cp", pm, "org.taurusplugins.repository.PluginManagerCMDInstaller"]);
        let res = await taurusTool.exec();
        if (res != 0) {
            throw new Error(tasks.loc("TaurusPluginManagerInstallFailed", cmdrunnerUrl));
        }

        let pmCmd: ToolRunner = tasks.tool(`${taurusDir}/bin/PluginsManagerCMD.sh`);
        pmCmd.arg(["install", "jpgc-fifo,jpgc-json=2.2"]);
        let pmCmdRes = await pmCmd.exec();
        if (pmCmdRes != 0) {
            throw new Error(tasks.loc("TaurusPluginInstallFailed", cmdrunnerUrl));
        }

        cachedToolPath = await tools.cacheDir(taurusUnzippedPath, taurusToolName, version);
    }

    let taurusPath = findTaurusExecutable(cachedToolPath);
    if (!taurusPath) {
        throw new Error(tasks.loc("TaurusNotFoundInFolder", cachedToolPath));
    }

    tasks.setVariable('taurusLocation', taurusPath);

    return taurusPath;
}

function getTaurusDownloadUrl(version: string): string {
    return `https://archive.apache.org/dist/taurus/binaries/apache-taurus-${version}.zip`;
}

function findTaurusExecutable(rootFolder: string): string {
    let taurusPath = path.join(rootFolder, "*/bin/" + taurusToolName + getBatchfileExtension());
    var allPaths = tasks.find(rootFolder);
    var matchingResultFiles = tasks.match(allPaths, taurusPath, rootFolder);
    return matchingResultFiles[0];
}

function getBatchfileExtension(): string {
    if (isWindows) {
        return ".bat";
    }

    return "";
}
