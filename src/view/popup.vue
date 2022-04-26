<template>
  <div class="main_app">
    <el-card>
      <el-row v-if="!runningPerformanceIsRunning&&!runUIRecordIsRunning">
        <el-row>
          <h6>网页性能测试</h6>
          <el-button v-if="!loadIsRunning" style="width: 100%" type="success" size="mini" @click="LoadPerformance">
            页面加载性能测试
          </el-button>
          <el-button v-else style="width: 100%" type=warning size="mini">
            页面加载性能测试执行中
          </el-button>
        </el-row>
      </el-row>
      <el-row v-if="!loadIsRunning&&!runUIRecordIsRunning">
        <el-button style="width: 100%" v-if="!runningPerformanceIsRunning" type="success" size="mini"
                   @click="RunningPerformance">开始性能收集
        </el-button>
        <el-button style="width: 100%" v-if="runningPerformanceIsRunning" type="danger" size="mini"
                   @click="RunningPerformanceResult">
          终止性能收集
        </el-button>
      </el-row>
      <el-row v-if="!runningPerformanceIsRunning&&!loadIsRunning">
        <h6>网页UI动作录制</h6>
        <el-row>
          <el-row v-if="!runUIRecordIsRunning">
            <el-row>
              <el-tooltip class="item" effect="dark" content="只支持不跳转页面web进行点击操作" placement="top">
                <el-button style="width: 100%" type="success" size="mini" @click="runUIRecord">开始动作录制</el-button>
              </el-tooltip>
            </el-row>
            <el-row v-if="UIRecordResult!==null">
              <el-row>
                <el-button style="width: 100%" type="warning" size="mini" @click="UIPlayBack">动作回放</el-button>
              </el-row>
              <el-row>
                <el-button style="width: 100%" type="danger" size="mini" @click="clearPlayBack">清空录制</el-button>
              </el-row>
            </el-row>
          </el-row>
          <el-row v-else>
            <el-button style="width: 100%" type="danger" size="mini" @click="StopRunUIRecord">暂停动作录制</el-button>
          </el-row>
        </el-row>
      </el-row>
    </el-card>
  </div>
</template>

<script>

export default {
  name: 'popupView',
  data() {
    return {
      isRunning: false,
      loadIsRunning: false,
      runningPerformanceIsRunning: false,
      runUIRecordIsRunning: false,
      UIRecordResult: null
    }
  },
  mounted() {
    chrome.storage.local.get(["loadIsRunning"], (result) => {
      this.loadIsRunning = !!result.loadIsRunning;
    })
    chrome.storage.local.get(["runningPerformanceIsRunning"], (result) => {
      this.runningPerformanceIsRunning = !!result.runningPerformanceIsRunning;
    })
    chrome.storage.local.get(["runUIRecord"], (result) => {
      this.runUIRecordIsRunning = !!result.runUIRecord;
    })
    chrome.storage.local.get(["UIRecordResult"], (result) => {
      console.log(result)
      this.UIRecordResult = result.UIRecordResult;
    })
    chrome.storage.onChanged.addListener((changes) => {
      for (let [key, {newValue}] of Object.entries(changes)) {
        if (key === "runningPerformance" && newValue === null) {
          chrome.storage.local.get(['totalRunningPerformance'], function (result) {
            const data = result.totalRunningPerformance
            const template =
                "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "    <meta charset=\"UTF-8\">\n" +
                "    <title>Web性能报告</title>\n" +
                "    <link rel=\"stylesheet\" href=\"https://unpkg.com/element-ui/lib/theme-chalk/index.css\"/>\n" +
                "</head>\n" +
                "<body>\n" +
                "<div id=\"app\">\n" +
                "    <h1>性能曲线图</h1>\n" +
                "    <el-row>\n" +
                "        <p style=\"text-align: left\"><code>数据量: {{ fpsData.length }}</code></p>\n" +
                "    </el-row>\n" +
                "    <el-row v-if=\"chartData.length>0\">\n" +
                "        <p style=\"text-align: left\"><code>URL: {{ chartData[0].url }}</code></p>\n" +
                "    </el-row>\n" +
                "    <el-row>\n" +
                "        <div id=\"fps\" style=\"width: 100%;height: 300px\"></div>\n" +
                "        <div id=\"memory\" style=\"width: 100%;height: 300px\"></div>\n" +
                "    </el-row>\n" +
                "</div>\n" +
                "</body>\n" +
                "<script src=\"https://cdn.jsdelivr.net/npm/vue@2.6.14/dist/vue.min.js\">" +
                // eslint-disable-next-line
                `<\/script>\n` +
                "<script src=\"https://cdn.jsdelivr.net/npm/element-ui@2.4.5/lib/element-ui.common.min.js\">" +
                // eslint-disable-next-line
                `<\/script>\n` +
                "<script src=\"https://cdn.jsdelivr.net/npm/echarts@5.3.2/dist/echarts.min.js\">" +
                // eslint-disable-next-line
                `<\/script>\n` +
                " <script>\n" +
                "    new Vue({\n" +
                "        el: \"#app\",\n" +
                "        data() {\n" +
                "            return {\n" +
                `                chartData: ${JSON.stringify(data)},\n` +
                "                timeData: [],\n" +
                "                fpsData: [],\n" +
                "                jsHeapSizeLimit: [],\n" +
                "                totalJSHeapSize: [],\n" +
                "                usedJSHeapSize: []\n" +
                "            }\n" +
                "        },\n" +
                "        mounted() {\n" +
                "            this.timeData = []\n" +
                "            this.fpsData = []\n" +
                "            this.jsHeapSizeLimit = []\n" +
                "            this.totalJSHeapSize = []\n" +
                "            this.usedJSHeapSize = []\n" +
                "            for (const index in this.chartData) {\n" +
                "                const temp = this.chartData[index]\n" +
                "                const date = new Date(temp.time)\n" +
                "                this.fpsData.push(temp.fps)\n" +
                "                this.timeData.push(date.getDate() +\n" +
                "                    \"/\" + (date.getMonth() + 1) +\n" +
                "                    \"/\" + date.getFullYear() +\n" +
                "                    \" \" + date.getHours() +\n" +
                "                    \":\" + date.getMinutes() +\n" +
                "                    \":\" + date.getSeconds())\n" +
                "                this.jsHeapSizeLimit.push(temp.memory.jsHeapSizeLimit / 1024 / 1024)\n" +
                "                this.totalJSHeapSize.push(temp.memory.totalJSHeapSize / 1024 / 1024)\n" +
                "                this.usedJSHeapSize.push(temp.memory.usedJSHeapSize / 1024 / 1024)\n" +
                "            }\n" +
                "            this.fpsChart()\n" +
                "            this.memoryChart()\n" +
                "        },\n" +
                "        watch: {},\n" +
                "        computed: {\n" +
                "        },\n" +
                "        methods: {\n" +
                "            fpsChart() {\n" +
                "                const chartDom = document.getElementById(\"fps\");\n" +
                "                const myChart = echarts.init(chartDom);\n" +
                "                let option;\n" +
                "                option = {\n" +
                "                    title: {\n" +
                "                        text: \"FPS\"\n" +
                "                    },\n" +
                "                    tooltip: {\n" +
                "                        trigger: \"axis\"\n" +
                "                    },\n" +
                "                    legend: {\n" +
                "                        data: [\"FPS\"]\n" +
                "                    },\n" +
                "                    grid: {\n" +
                "                        left: \"3%\",\n" +
                "                        right: \"4%\",\n" +
                "                        bottom: \"3%\",\n" +
                "                        containLabel: true\n" +
                "                    },\n" +
                "                    toolbox: {\n" +
                "                        feature: {\n" +
                "                            saveAsImage: {}\n" +
                "                        }\n" +
                "                    },\n" +
                "                    xAxis: {\n" +
                "                        type: \"category\",\n" +
                "                        boundaryGap: false,\n" +
                "                        data: this.timeData\n" +
                "                    },\n" +
                "                    yAxis: {\n" +
                "                        type: \"value\"\n" +
                "                    },\n" +
                "                    series: [\n" +
                "                        {\n" +
                "                            name: \"FPS\",\n" +
                "                            data: this.fpsData,\n" +
                "                            type: \"line\",\n" +
                "                            stack: \"Total\",\n" +
                "                        }\n" +
                "                    ]\n" +
                "                };\n" +
                "                myChart.setOption(option);\n" +
                "            },\n" +
                "            memoryChart() {\n" +
                "                const chartDom = document.getElementById(\"memory\");\n" +
                "                const myChart = echarts.init(chartDom);\n" +
                "                let option;\n" +
                "                option = {\n" +
                "                    title: {\n" +
                "                        text: \"Memory\"\n" +
                "                    },\n" +
                "                    tooltip: {\n" +
                "                        trigger: \"axis\"\n" +
                "                    },\n" +
                "                    legend: {\n" +
                "                        data: [\"JS Heap Size Limit\", \"Total JS Heap Size\", \"Used JS Heap Size\"]\n" +
                "                    },\n" +
                "                    grid: {\n" +
                "                        left: \"3%\",\n" +
                "                        right: \"4%\",\n" +
                "                        bottom: \"3%\",\n" +
                "                        containLabel: true\n" +
                "                    },\n" +
                "                    toolbox: {\n" +
                "                        feature: {\n" +
                "                            saveAsImage: {}\n" +
                "                        }\n" +
                "                    },\n" +
                "                    xAxis: {\n" +
                "                        type: \"category\",\n" +
                "                        data: this.timeData\n" +
                "                    },\n" +
                "                    yAxis: {\n" +
                "                        type: \"value\",\n" +
                "                        name: \"MB\"\n" +
                "                    },\n" +
                "                    series: [\n" +
                "                        {\n" +
                "                            name: \"JS Heap Size Limit\",\n" +
                "                            data: this.jsHeapSizeLimit,\n" +
                "                            type: \"line\",\n" +
                "                            stack: \"Total\",\n" +
                "                        },\n" +
                "                        {\n" +
                "                            name: \"Total JS Heap Size\",\n" +
                "                            data: this.totalJSHeapSize,\n" +
                "                            type: \"line\",\n" +
                "                            stack: \"Total\",\n" +
                "                        },\n" +
                "                        {\n" +
                "                            name: \"Used JS Heap Size\",\n" +
                "                            data: this.usedJSHeapSize,\n" +
                "                            type: \"line\",\n" +
                "                            stack: \"Total\",\n" +
                "                        }\n" +
                "                    ]\n" +
                "                };\n" +
                "                myChart.setOption(option);\n" +
                "            }\n" +
                "        }\n" +
                "    })\n" +
                // eslint-disable-next-line
                `<\/script>\n` +
                "<style>\n" +
                "    #app {\n" + "        font-family: \"Avenir\", Helvetica, Arial, sans-serif;\n" +
                "        -webkit-font-smoothing: antialiased;\n" +
                "        -moz-osx-font-smoothing: grayscale;\n" +
                "        text-align: center;\n" +
                "        color: #2c3e50;\n" +
                "    }\n" +
                "</style>\n" +
                "</html>"

            function downloadFileHelper(fileName, content) {
              const aTag = document.createElement('a');
              const blob = new Blob([content]);
              aTag.download = fileName;
              aTag.style = "display: none";
              aTag.href = URL.createObjectURL(blob);
              document.body.appendChild(aTag);
              aTag.click();

              setTimeout(function () {
                document.body.removeChild(aTag);
                window.URL.revokeObjectURL(blob);
              }, 100);
            }

            downloadFileHelper("RunningPerformanceResult.html", template)
            chrome.storage.local.set({totalRunningPerformance: null, runningPerformance: null});
          })
        }
        if (key === "loadIsRunning" && newValue !== null) {
          this.loadIsRunning = newValue
        }
        if (key === "runningPerformanceIsRunning" && newValue !== null) {
          this.runningPerformanceIsRunning = newValue
        }
        if (key === "UIRecordResult" && newValue !== null) {
          this.UIRecordResult = newValue
        }
        this.isRunning = (key === 'runningPerformance' || key === 'totalRunningPerformance') && newValue !== null
      }
    });
  },
  computed: {},
  methods: {
    LoadPerformance() {
      chrome.storage.local.set({loadIsRunning: true});
      chrome.tabs.query({active: true, currentWindow: true}, tab => {
        chrome.tabs.sendMessage(tab[0].id, {action: 'LoadPerformance'})
      });
      this.loadIsRunning = true
    },
    RunningPerformance() {
      chrome.storage.local.set({runningPerformanceIsRunning: true});
      chrome.tabs.query({active: true, currentWindow: true}, tab => {
        chrome.tabs.sendMessage(tab[0].id, {action: 'RunningPerformance'})
        alert("Start Running Performance")
      });
      this.runningPerformanceIsRunning = true
    },
    RunningPerformanceResult() {
      chrome.tabs.query({active: true, currentWindow: true}, tab => {
        chrome.tabs.sendMessage(tab[0].id, {action: 'StopRunningPerformance'})
        alert("Finish Running Performance")
      });
      this.isRunning = false
      chrome.storage.local.set({runningPerformanceIsRunning: false});
      this.runningPerformanceIsRunning = false
    },
    runUIRecord() {
      chrome.storage.local.set({runUIRecord: true});
      chrome.tabs.query({active: true, currentWindow: true}, tab => {
        chrome.tabs.sendMessage(tab[0].id, {action: 'runUIRecord', data: true})
        alert("Start UI Record")
      });
      this.runUIRecordIsRunning = true
    },
    StopRunUIRecord() {
      chrome.storage.local.set({runUIRecord: false});
      chrome.tabs.query({active: true, currentWindow: true}, tab => {
        chrome.tabs.sendMessage(tab[0].id, {action: 'runUIRecord', data: false})
        alert("Stop UI Record")
      });
      this.runUIRecordIsRunning = false
    },
    UIPlayBack() {
      chrome.tabs.query({active: true, currentWindow: true}, tab => {
        chrome.tabs.sendMessage(tab[0].id, {action: 'playBack', data: this.UIRecordResult})
        // alert("Start Play Back")
      });
    },
    clearPlayBack() {
      this.UIRecordResult = null
      chrome.storage.local.set({UIRecordResult: null});
    }
  }
}
</script>
<style>
.main_app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  /*margin-top: 60px;*/
}
</style>
