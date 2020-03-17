import tasks = require('azure-pipelines-task-lib/task');
import tools = require('azure-pipelines-tool-lib/tool');
import path = require('path');
import os = require('os');
import fs = require('fs');

const uuidV4 = require('uuid/v4');
const jmeterToolName = "jmeter";
const isWindows = os.type().match(/^Win/);

export async function downloadJMeter(version: string): Promise<string> {
    if (!/^(\d[\w.]*)$/.test(version)) {
        throw new Error(tasks.loc("InputVersionNotValidVersion", version));
    }

    let cachedToolPath = tools.findLocalTool(jmeterToolName, version);
    if (!cachedToolPath) {
        let jmeterDownloadUrl = getJMeterDownloadUrl(version);
        let fileName = `${jmeterToolName}-${version}-${uuidV4()}.zip`;
        let jmeterDownloadPath;

        try {
            jmeterDownloadPath = await tools.downloadTool(jmeterDownloadUrl, fileName);
        } catch (exception) {
            throw new Error(tasks.loc("JMeterDownloadFailed", jmeterDownloadUrl, exception));
        }

        let jmeterUnzippedPath = await tools.extractZip(jmeterDownloadPath);
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
