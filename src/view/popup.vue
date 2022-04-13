<template>
  <div class="main_app">
    <el-card>
      <h6>网页性能测试</h6>
      <el-row>
        <el-button style="width: 100%" type="success" size="mini" @click="LoadPerformance">页面加载性能测试</el-button>
      </el-row>
      <el-row>
        <el-button style="width: 100%" v-if="!isRunning" type="success" size="mini" @click="RunningPerformance">开始性能收集
        </el-button>
        <el-button style="width: 100%" v-if="isRunning" type="danger" size="mini" @click="RunningPerformanceResult">
          终止性能收集
        </el-button>
      </el-row>
    </el-card>
  </div>
</template>

<script>

export default {
  name: 'popupView',
  data() {
    return {isRunning: false}
  },
  mounted() {
    chrome.runtime.onMessage.addListener((request) => {
          if (request.msg === "isRunning") {
            //  To do something
            this.isRunning = request.data
          }
        }
    );
    chrome.storage.onChanged.addListener((changes) => {
      for (let [key, {newValue}] of Object.entries(changes)) {
        if (key === 'Performance') {
          let state = newValue
          let message = []
          message.push('Performance Testing URL ', state.url)
          message.push('Performance Testing for ', state.loadCount + ' tests')
          message.push('average document load time (ms)', (state.documentLoadEventSum / state.loadCount))
          message.push('average page load time (ms)', (state.loadEventSum / state.loadCount))
          message.push('average page ready time (ms)', (state.domInteractiveSum / state.loadCount))
          if (state.lcp > 0) {
            message.push('average page LCP (ms)', (state.lcp / state.loadCount))
          }
          if (state.firstPaint > 0) {
            message.push('average page First Paint (ms)', (state.firstPaint / state.loadCount))
          }
          message.push('average page First Contentful Paint (ms)', (state.firstContentfulPaint / state.loadCount))
          message = message.join("\n") + "\n";

          // eslint-disable-next-line no-inner-declarations
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

          downloadFileHelper("LoadPerformanceResult.txt", message)
        }
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
                "<script src=\"https://unpkg.zhimg.com/vue/dist/vue.js\">" +
                // eslint-disable-next-line
                `<\/script>\n` +
                "<script src=\"https://unpkg.zhimg.com/element-ui/lib/index.js\">" +
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
        this.isRunning = (key === 'runningPerformance' || key === 'totalRunningPerformance') && newValue !== null
      }
    });
  },
  computed: {},
  methods: {
    LoadPerformance() {
      chrome.tabs.query({active: true, currentWindow: true}, tab => {
        chrome.tabs.sendMessage(tab[0].id, {action: 'LoadPerformance'})
      });
    },
    RunningPerformance() {
      chrome.storage.local.set({totalRunningPerformance: null, runningPerformance: null});
      chrome.tabs.query({active: true, currentWindow: true}, tab => {
        chrome.tabs.sendMessage(tab[0].id, {action: 'RunningPerformance'})
        alert("Start Running Performance")
      });
    },
    RunningPerformanceResult() {
      chrome.tabs.query({active: true, currentWindow: true}, tab => {
        chrome.tabs.sendMessage(tab[0].id, {action: 'StopRunningPerformance'})
        alert("Finish Running Performance")
        this.isRunning = false
      });
    },
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
