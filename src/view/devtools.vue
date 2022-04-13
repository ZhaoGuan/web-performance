<template>
  <div class="main_app">
    <h1>性能曲线图</h1>
    <el-row>
      <p style="text-align: left"><code>数据量: {{ fpsData.length }}</code></p>
    </el-row>
    <el-row v-if="chartData.length>0">
      <p style="text-align: left"><code>URL: {{ chartData[0].url }}</code></p>
    </el-row>
    <el-row>
      <div id="fps" style="width: 100%;height: 300px"></div>
      <div id="memory" style="width: 100%;height: 300px"></div>
    </el-row>
  </div>
</template>

<script>
import * as echarts from 'echarts';

export default {
  name: 'devtoolsView',
  data() {
    return {
      chartData: [],
      timeData: [],
      fpsData: [],
      jsHeapSizeLimit: [],
      totalJSHeapSize: [],
      usedJSHeapSize: []
    }
  },
  mounted() {
    chrome.storage.onChanged.addListener((changes) => {
      for (let [key, {newValue}] of Object.entries(changes)) {
        if (key === "totalRunningPerformance" && newValue !== null) {
          this.chartData = newValue
        }
      }
    });
    this.fpsChart()
    this.memoryChart()
  },
  watch: {
    chartData: {
      handler: function () {
        this.timeData = []
        this.fpsData = []
        this.jsHeapSizeLimit = []
        this.totalJSHeapSize = []
        this.usedJSHeapSize = []
        for (const index in this.chartData) {
          const temp = this.chartData[index]
          const date = new Date(temp.time)
          this.fpsData.push(temp.fps)
          this.timeData.push(date.getDate() +
              "/" + (date.getMonth() + 1) +
              "/" + date.getFullYear() +
              " " + date.getHours() +
              ":" + date.getMinutes() +
              ":" + date.getSeconds())
          this.jsHeapSizeLimit.push(temp.memory.jsHeapSizeLimit / 1024 / 1024)
          this.totalJSHeapSize.push(temp.memory.totalJSHeapSize / 1024 / 1024)
          this.usedJSHeapSize.push(temp.memory.usedJSHeapSize / 1024 / 1024)
        }
        this.fpsChart()
        this.memoryChart()
      },
      immediate: true,
      deep: true
    }
  },
  computed: {},
  methods: {
    fpsChart() {
      const chartDom = document.getElementById('fps');
      const myChart = echarts.init(chartDom);
      let option;

      option = {
        title: {
          text: 'FPS'
        },
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: ['FPS']
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        toolbox: {
          feature: {
            saveAsImage: {}
          }
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: this.timeData
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: 'FPS',
            data: this.fpsData,
            type: 'line',
            stack: 'Total',
          }
        ]
      };
      myChart.setOption(option);
    },
    memoryChart() {
      const chartDom = document.getElementById('memory');
      const myChart = echarts.init(chartDom);
      let option;
      option = {
        title: {
          text: 'Memory'
        },
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: ['JS Heap Size Limit', 'Total JS Heap Size', 'Used JS Heap Size']
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        toolbox: {
          feature: {
            saveAsImage: {}
          }
        },
        xAxis: {
          type: 'category',
          data: this.timeData
        },
        yAxis: {
          type: 'value',
          name: 'MB'
        },
        series: [
          {
            name: "JS Heap Size Limit",
            data: this.jsHeapSizeLimit,
            type: 'line',
            stack: 'Total',
          },
          {
            name: "Total JS Heap Size",
            data: this.totalJSHeapSize,
            type: 'line',
            stack: 'Total',
          },
          {
            name: "Used JS Heap Size",
            data: this.usedJSHeapSize,
            type: 'line',
            stack: 'Total',
          }
        ]
      };
      myChart.setOption(option);
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
}
</style>
