## About JMeter

Apache [JMeter](https://www.jmeter.io/)
is a highly versatible open-source highly versatile integration testing tool. It is often used as a load testing tool for web applications, but can also be used for functional testing and for testing other types of services, such as databases.

## About Taurus

[Taurus](https://gettaurus.org/) is an open-source automation test framework, that can be used in particular to automate JMeter executions. Taurus can take an existing JMeter plan and define load profile and assertions through simple configuration.

## About the JMeter extension

This extension provides the following components:
- A JMeterInstaller task that installs JMeter along with a flexible collection of plugins
- A TaurusInstaller task that installs Taurus on a Python 3.6+ environment
- A TaurusRunner task that can run JMeter or other test plans using Taurus and produces test results and reports

The JMeter tool installer task acquires a specified version of [JMeter](https://www.jmeter.io/) from the Internet or the tools cache and prepends it to the PATH of the Azure Pipelines Agent (hosted or private). This task can be used to change the version of JMeter used in subsequent tasks. Adding this task before the TaurusRunner in a build definition ensures you are using that task with the right JMeter version.

This extension is intended to run on **Windows**, **Linux** and **MacOS** agents.

## JMeter tool installer task

- Search for **JMeter tool installer** and click on **Add**

![Adding JMeter tool installer task](images/3_JMeter_tool_installer_search.PNG)

- In the **Version** input, select the exact version of JMeter you want to install on the build agent. e.g. if you want to install version 5.1, enter `5.1`

![Using JMeter tool installer task](images/4_JMeter_tool_installer_inputs.PNG)

## Taurus tool installer task

- Ensure you have Python 3.6+ installed. Search for **Use Python version** and click on **Add**

- Search for **Taurus tool installer** and click on **Add**

![Adding Taurus tool installer task](images/3_Taurus_tool_installer_search.PNG)

- In the **Version** input, select the exact version of Taurus you want to install on the build agent. e.g. if you want to install version 1.14.0, enter `1.14.0`

![Using Taurus tool installer task](images/4_Taurus_tool_installer_inputs.PNG)

## Taurus tool runner task

- Search for **Taurus tool runner** and click on **Add**

![Using Taurus tool runner task](images/4_Taurus_tool_runner_inputs.PNG)

* In the **Taurus Arguments** enter a space-separated list of files or websites to test. The following arguments can be passed:
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
  * A URL to test, for quick load testing.
  * Extra options and arguments to the `bzt` command line.

* Leave the **JMeter Home**,  **JMeter Path** and **JMeter Version** fields to their default value, to use the version of JMeter installed by the JMeter Installer task.

* The **Artifacts output directory** will contain a `report` directory with an HTML report, and a `TEST-Taurus.xml` file with a test report in JUnit format.

* Check the **Upload report** checkbox so that the JMeter report is automatically archived within the build logs.

## Advanced usage

### Real-time monitoring with Azure Application Insights

[Create an Azure Application Insights resource](https://docs.microsoft.com/en-us/azure/azure-monitor/app/create-new-resource) and copy the Instrumentation Key.
Run the commands below, replacing the key value with yours:

```
export INSTRUMENTATION_KEY=00000000-0000-0000-0000-000000000000
```

You can follow the run outcomes in the Application Insights resource in the Azure portal:

![Application Insights overview](../docs/images/azure-application-insights-overview.png)

You can see test data in real time in the Live Metrics view. Note that the view is available only while the test is running, so you may need to increase the test duration
in
[scripts/website-test.yml](scripts/website-test.yml) to see this view.

![Application Insights live metrics](../docs/images/azure-application-insights-live-metrics.png)

You can also dig into the logs (`requests` collection) and generate charts and dashboards:

![Application Insights table](../docs/images/azure-application-insights-table.png)

![Application Insights chart](../docs/images/azure-application-insights-chart.png)

### Using custom Java libraries

* In your code repository, create a file `kafka-clients-uber-jar.xml` with the following content:

```
<?xml version="1.0"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.example</groupId>
  <artifactId>kafka-clients-uber-jar</artifactId>
  <version>0.0.1</version>
  <dependencies>
    <dependency>
      <groupId>org.apache.kafka</groupId>
      <artifactId>kafka-clients</artifactId>
      <version>2.3.1</version>
    </dependency>
  </dependencies>
  <build>
    <plugins>
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-shade-plugin</artifactId>
        <version>3.2.2</version>
        <configuration>
          <createDependencyReducedPom>false</createDependencyReducedPom>
        </configuration>
        <executions>
          <execution>
            <phase>package</phase>
            <goals>
              <goal>shade</goal>
            </goals>
          </execution>
        </executions>
      </plugin>
    </plugins>
  </build>
</project>
```

This is a Maven POM file that only serves to collect the `org.apache.kafka:kafka-clients` Maven JAR and all its dependencies
into a single "shaded" JAR, that we will put in the classpath of our job run.

* In your pipeline, configure a [Maven task](https://docs.microsoft.com/en-us/azure/devops/pipelines/tasks/build/maven?view=azure-devops) to run the `package` goal on your `kafka-clients-uber-jar.xml` POM file.

* Create a JMeter test plan with custom code to connect to Kafka. The easiest way is to create a JSR223 Sampler and write Groovy
code.

* In your code repository, create a file `kafka-test.yml` with the following content:

```
execution:
- scenario:
    script: kafka-test.jmx
    properties:
      user.classpath: target/kafka-clients-uber-jar-0.0.1.jar
  concurrency: 5
  iterations: 2000
```

Ensure that the `user.classpath` points to the location where the Maven task builds the target JAR.

* In your pipeline, configure the JMeter Installer task, the Taurus Installer task, and the Taurus Runner task.