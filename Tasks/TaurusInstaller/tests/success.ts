import ma = require('azure-pipelines-task-lib/mock-answer');
import tmrm = require('azure-pipelines-task-lib/mock-run');
import mtr = require('azure-pipelines-task-lib/mock-toolrunner');
import path = require('path');

const userRequestedVersion = "1.14.0";
const expectedDownloadUrl =
    `https://archive.apache.org/dist/taurus/binaries/apache-taurus-${userRequestedVersion}.zip`;
const cmdrunnerUrl = "http://search.maven.org/remotecontent?filepath=kg/apc/cmdrunner/2.2/cmdrunner-2.2.jar";
const pluginmgrUrl = "http://search.maven.org/remotecontent?filepath=kg/apc/taurus-plugins-manager/1.3/taurus-plugins-manager-1.3.jar";
const fakeDownloadedPath = "/fake/path/to/downloaded/file";

let taskPath = path.join(__dirname, '..', 'src', 'index.js');
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tmr.setInput('taurusVersion', userRequestedVersion);


tmr.registerMock("azure-pipelines-tool-lib/tool", {
    findLocalTool: (toolName: string, versionSpec: string, arch?: string) => {
        if (toolName !== "taurus") {
            throw new Error(`Unexpected toolName ${toolName}.`);
        }
        if (versionSpec !== userRequestedVersion) {
            throw new Error(`Unexpected versionSpec ${versionSpec}.`);
        }
        return undefined;
    },
    downloadTool: (url: string, fileName?: string) => {
        switch (url) {
            case expectedDownloadUrl: {
                return Promise.resolve(fakeDownloadedPath);
            }
            case cmdrunnerUrl: {
                return Promise.resolve(fakeDownloadedPath);
            }
            case pluginmgrUrl: {
                return Promise.resolve(fakeDownloadedPath);
            }
            default: {
                throw new Error(`Unexpected download url ${url}.`);
            }
        }
    },
    extractZip: (file: string, destination?: string) => {
        if (file !== fakeDownloadedPath) {
            throw new Error(`Unexpected downloaded file path ${file}`);
        }
        return Promise.resolve("/fake/path/to/extracted/contents");
    },
    cacheDir: (sourceDir: string, tool: string, version: string, arch?: string) => {
        if (sourceDir !== "/fake/path/to/extracted/contents") {
            throw new Error(`Unexpected sourceDir ${sourceDir}.`);
        }
        if (tool !== "taurus") {
            throw new Error(`Unexpected tool ${tool}.`);
        }
        if (version !== userRequestedVersion) {
            throw new Error(`Unexpected version ${version}.`);
        }
        if (arch !== undefined) {
            throw new Error(`Unexpected arch ${arch}.`);
        }
        return Promise.resolve("/fake/path/to/cached/dir");
    },
    prependPath: (toolPath: string) => {
        if (toolPath !== "/fake/path/to/cached/dir/apache-taurus-1.14.0/bin") {
            throw new Error(`Unexpected toolPath ${toolPath}.`);
        }
        console.log(`prepending path ${toolPath}`);
    },
});

// Provide answers for task mock.
const mockAnswers: ma.TaskLibAnswers = {
    exist: {
        "/b/taurus": true,
    },
    find: {
        "/fake/path/to/cached/dir/taurus": [
            "/fake/path/to/cached/dir/taurus/apache-taurus-1.14.0/bin/taurus",
            "/fake/path/to/cached/dir/taurus/apache-taurus-1.14.0/bin/taurus.bat",
        ],
        "/fake/path/to/cached/dir": [
            "/fake/path/to/cached/dir/apache-taurus-1.14.0/bin/taurus",
            "/fake/path/to/cached/dir/apache-taurus-1.14.0/bin/taurus.bat",
        ],
    },
    which: {
        "taurus": "/fake/bin/taurus",
    },
    checkPath: {
        "/fake/bin/taurus": true,
    },
    exec: {
        '/fake/bin/taurus --version': {
            code: 0
        },
        'java -cp /fake/path/to/extracted/contents/apache-taurus-1.14.0/lib/ext/taurus-plugins-manager-1.3.jar org.taurusplugins.repository.PluginManagerCMDInstaller': {
            code: 0
        },
        '/fake/path/to/extracted/contents/apache-taurus-1.14.0/bin/PluginsManagerCMD.sh install jpgc-fifo,jpgc-json=2.2': {
            code: 0
        },
    }
} as ma.TaskLibAnswers;

tmr.setAnswers(mockAnswers);

tmr.registerMock('azure-pipelines-task-lib/toolrunner', require('azure-pipelines-task-lib/mock-toolrunner'));


tmr.registerMock("azure-pipelines-task-lib/toolrunner", mtr);

tmr.run();
