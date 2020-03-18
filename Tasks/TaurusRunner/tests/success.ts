import ma = require('azure-pipelines-task-lib/mock-answer');
import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

const userRequestedVersion = "1.14.0";

let taskPath = path.join(__dirname, '..', 'src', 'index.js');
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tmr.setInput('taurusVersion', userRequestedVersion);

// Provide answers for task mock.
const mockAnswers: ma.TaskLibAnswers = {
    which: {
        "bzt": "/fake/bin/bzt",
    },
    checkPath: {
        "/fake/bin/bzt": true,
    },
    exec: {
        'bzt -o settings.artifacts-dir=output -o modules.jmeter.path=jmeter -o modules.jmeter.version=5.1 -o reporting.-1={"module":"junit-xml","filename":"TEST-XXXX.xml"} website-test.yml': {
            code: 0
        },
        'jmeter/bin/jmeter -Jjmeter.save.saveservice.assertion_results_failure_message=false -g output/kpi.jtl -o report -q output/jmeter-bzt.properties': {
            code: 0
        },
    }
} as ma.TaskLibAnswers;

tmr.setAnswers(mockAnswers);

tmr.run();
