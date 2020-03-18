# Taurus tool runner


### Overview

The Taurus Tool Runner task runs the [Taurus](https://gettaurus.org/) utility, which can run
JMeter and produce JUnit-compatible test report which can be imported into Azure Pipelines.

### Contact Information

Please report a problem at [GitHub](https://github.com/algattik/jmeter-extension/issues) if you are facing problems in making this task work. You can also share feedback about the task like, what more functionality should be added to the task, what other tasks you would like to have, at the same place.

### Pre-requisites for the task

The task requires Python 3.6+ to be installed and in the PATH.

### Parameters of the task

* **Display name\*:** Provide a name to identify the task among others in your pipeline.

* **Version\*:** Specify the exact version of Taurus to install.
Example: 
    To install Taurus version 1.14.0, use 1.14.0
For getting more details about exact version, refer to [this link](https://pypi.org/project/bzt/#history)

* **Taurus Arguments\*:** Arguments passed to the `bzt` Taurus script. This should be a space-separated list of files or websites to test. Files can be one or more Taurus YAML definition files, JMeter files or website URLs. Can also contain
  * Taurus YAML definition file (recommended), which can reference a JMeter JMX file. Example:
```
execution:
- scenario:
    script: website-test.jmx
  concurrency: 5
  iterations: 10
  hold-for: 10s
  ramp-up: 2s
```
  * A JMeter JMX file. This is equivalent to the following YAML file:
```
execution:
- scenario:
    script: my-file.jmx
```
  * A URL to test.
  * Extra options and arguments to the `bzt` command line.

* **JMeter Home\*:** XXXX

* **JMeter Path\*:** XXXX

* **JMeter Version\*:** XXXX

* **Artifacts output directory\*:** XXXX

* **Upload report\*:** XXXX