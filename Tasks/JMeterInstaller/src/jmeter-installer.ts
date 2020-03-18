import tasks = require('azure-pipelines-task-lib/task');
import tools = require('azure-pipelines-tool-lib/tool');
import { ToolRunner } from 'azure-pipelines-task-lib/toolrunner';
import path = require('path');
import os = require('os');

const jmeterToolName = "jmeter";
const isWindows = os.type().match(/^Win/);
const cmdrunnerUrl = "http://search.maven.org/remotecontent?filepath=kg/apc/cmdrunner/2.2/cmdrunner-2.2.jar";
const pluginmgrUrl = "http://search.maven.org/remotecontent?filepath=kg/apc/jmeter-plugins-manager/1.3/jmeter-plugins-manager-1.3.jar";


export async function downloadJMeter(version: string, plugins?: string): Promise<string> {
    if (!/^(\d[\w.]*)$/.test(version)) {
        throw new Error(tasks.loc("InputVersionNotValidVersion", version));
    }

    let hasPlugins = plugins ? plugins.length : false;
    let fullToolName = hasPlugins ? `${jmeterToolName}+${plugins?.trim()}` : jmeterToolName;

    let cachedToolPath = tools.findLocalTool(fullToolName, version);
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

        // Plugins manager should be installed even when no plugins are installed, as
        // Taurus detects and automatically installs missing plugins from JMX files.
        installPluginsManager(jmeterDir);

        if (hasPlugins && plugins) {
            installPlugins(jmeterDir, plugins);
        }

        cachedToolPath = await tools.cacheDir(jmeterUnzippedPath, fullToolName, version);
    }

    let jmeterPath = findJMeterExecutable(cachedToolPath);
    if (!jmeterPath) {
        throw new Error(tasks.loc("JMeterNotFoundInFolder", cachedToolPath));
    }

    let jmeterHome = path.resolve(jmeterPath, '../..')

    tasks.setVariable('JMeterHome', jmeterHome);
    tasks.setVariable('JMeterPath', jmeterPath);
    tasks.setVariable('JMeterVersion', version);

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

async function installPluginsManager(jmeterDir: string) {

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
}

async function installPlugins(jmeterDir: string, plugins: string) {

    let pmCmd: ToolRunner = tasks.tool(`${jmeterDir}/bin/PluginsManagerCMD${getScriptExtension()}`);
    pmCmd.arg(["install", plugins]);
    let pmCmdRes = await pmCmd.exec();
    if (pmCmdRes != 0) {
        throw new Error(tasks.loc("JMeterPluginInstallFailed", cmdrunnerUrl));
    }
}

function getBatchfileExtension(): string {
    if (isWindows) {
        return ".bat";
    }
    return "";
}

function getScriptExtension(): string {
    if (isWindows) {
        return ".bat";
    }
    return ".sh";
}
