//https://github.com/GoogleChrome/web-vitals
// 因为使用npm所以通过 pop.js 引入
import {getLCP, getFID, getCLS, getFCP, getTTFB, sideex} from './popup';

getCLS(console.log);
getFID(console.log);
getLCP(console.log);
getFCP(console.log);
getTTFB(console.log);

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

function webReload() {
    // const time = new Date()
    // chrome.storage.local.set({reload: time.getTime(), url: location.href});
    location.reload();
}

function LoadPerformanceTest() {
    var maxReloads = 10;
    var state;
    try {
        state = JSON.parse(localStorage.getItem('performanceTesting')) || {};
    } catch (e) {
        state = {};
    }
    state.url = location.href
    state.domInteractiveSum = state.domInteractiveSum || 0;
    state.loadEventSum = state.loadEventSum || 0;
    state.documentLoadEventSum = state.documentLoadEventSum || 0;
    state.loadCount = state.loadCount || 0;
    state.lcp = state.lcp || 0;
    state.firstPaint = state.firstPaint || 0;
    state.firstContentfulPaint = state.firstContentfulPaint || 0;

    window.onload = function () {
        state.loadEventSum += (performance.timing.loadEventStart - performance.timing.requestStart);
        state.domInteractiveSum += (performance.timing.domInteractive - performance.timing.requestStart);
        state.documentLoadEventSum += (performance.timing.responseEnd - performance.timing.requestStart);
        // try {
        //     const po = new PerformanceObserver((entryList) => {
        //         const entries = entryList.getEntries();
        //         const lastEntry = entries[entries.length - 1]; // 优先取 renderTime，如果没有则取 loadTime
        //         let lcp = lastEntry.renderTime || lastEntry.loadTime;
        //         state.lcp += lcp
        //         console.log(`Largest Contentful Paint ${lcp}`)
        //     });
        //     po.observe({type: 'largest-contentful-paint'});
        //     // eslint-disable-next-line no-empty
        // } catch (e) {
        // }
        let performanceEntries = performance.getEntriesByType('paint') || [];
        performanceEntries.forEach((entry) => {
            if (entry.name === 'first-Paint') {
                state.firstPaint += entry.startTime;
            } else if (entry.name === 'first-contentful-paint') {
                state.firstContentfulPaint += entry.startTime;
            }
        });
        state.loadCount++;
        if (localStorage.getItem("LoadPerformanceTest") === 'true') {
            if (state.loadCount < maxReloads) {
                setTimeout(function () {
                    webReload()
                }, 1);
            } else {
                let message = []
                message.push('Performance Testing URL ' + state.url)
                message.push('Performance Testing for ' + state.loadCount + ' tests')
                message.push('average document load time (ms)' + (state.documentLoadEventSum / state.loadCount))
                message.push('average page load time (ms)' + (state.loadEventSum / state.loadCount))
                message.push('average page ready time (ms)' + (state.domInteractiveSum / state.loadCount))
                if (state.lcp > 0) {
                    message.push('average page LCP (ms)' + (state.lcp / state.loadCount))
                }
                if (state.firstPaint > 0) {
                    message.push('average page First Paint (ms)' + (state.firstPaint / state.loadCount))
                }
                message.push('average page First Contentful Paint (ms)' + (state.firstContentfulPaint / state.loadCount))
                message = message.join("\n") + "\n";
                downloadFileHelper("LoadPerformanceResult.txt", message)
                localStorage.setItem('LoadPerformanceTest', 'false')
                localStorage.setItem('loadIsRunning', 'false')
                state = {}
            }

            localStorage.setItem('performanceTesting', JSON.stringify(state));
        }
    }
}

LoadPerformanceTest();


// FPS检测
(() => {
    const limit = 3;                        // 出现低FPS的连续次数上限
    const below = 20;                       // 可容忍的最低FPS
    let count = 0;
    let lastTime = performance.now();
    let frame = 0;
    let lastFameTime = performance.now();
    let fps = 0;
    const loop = () => {
        frame += 1;
        const now = performance.now();
        const fs = (now - lastFameTime);
        lastFameTime = now;

        // 1000毫秒的 FPS (不需要也是可以的，看你选择)
        fps = Math.round(1000 / fs);
        // console.log(`FPS ${fps}`)
        if (now > 1000 + lastTime) {
            // 1s 时间段的FPS
            fps = Math.round((frame * 1000) / (now - lastTime));
            const nowTime = new Date().getTime();
            const memoryInfo = performance.memory
            const memoryInfoData = {
                jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit,
                totalJSHeapSize: memoryInfo.totalJSHeapSize,
                usedJSHeapSize: memoryInfo.usedJSHeapSize
            }
            if (localStorage.getItem('RunningPerformanceTest') === 'true') {
                const performanceData = {
                    time: nowTime,
                    fps: fps,
                    memory: memoryInfoData
                }
                localStorage.setItem("runningPerformance", JSON.stringify(performanceData))
            }
            frame = 0;
            lastTime = now;
        }
        if (fps < below) {
            count += 1;
            if (count >= limit) {
                console.log('网页卡顿', `连续${count}次FPS低于${below}，当前FPS为${fps}`);
                // BUS.trigger('fps-low');    // 关闭一些JS动画
            }
        } else {
            count = 0;
        }
        window.requestAnimationFrame(loop);
    };
    loop();
})();

// 重写 localStorage setItem
var originalSetItem = localStorage.setItem;
localStorage.setItem = function (key, newValue) {
    var setItemEvent = new Event("setItemEvent");
    setItemEvent.newValue = newValue;
    setItemEvent.key = key
    window.dispatchEvent(setItemEvent);
    originalSetItem.apply(this, arguments);
}
// 监听setItem
window.addEventListener("setItemEvent", function (event) {
    const key = event.key
    const newValue = JSON.parse(event.newValue)
    newValue.url = location.href
    if (key === 'runningPerformance') {
        try {
            chrome.storage.local.get(['totalRunningPerformance'], function (result) {
                const data = result.totalRunningPerformance || []
                data.push(newValue)
                chrome.storage.local.set({
                    totalRunningPerformance: data,
                    runningPerformance: newValue,
                });
            })
        } catch (e) {
            const data = []
            data.push(newValue)
            chrome.storage.local.set({
                totalRunningPerformance: data,
                runningPerformance: newValue,
            });
        }
    }
    if (key === "loadIsRunning" && newValue === false) {
        chrome.storage.local.set({loadIsRunning: false});
    }
});

window.onclose = function () {
    localStorage.setItem('RunningPerformanceTest', 'false');
    chrome.storage.local.get(['totalRunningPerformance'], function () {
        chrome.storage.local.set({
            totalRunningPerformance: null,
            runningPerformance: null,
            runningPerformanceUrl: null
        });
    })
}

var run = run || (() => {
    chrome.runtime.onMessage.addListener(request => {
        // 启动性能测试
        if (request.action === 'LoadPerformance') {
            // 清空数据
            localStorage.setItem('performanceTesting', JSON.stringify({}));
            // 设置执行
            localStorage.setItem('LoadPerformanceTest', 'true')
            localStorage.setItem('loadIsRunning', 'true')
            // 重新载入页面
            webReload()
        }
        // 执行运行中性能
        if (request.action === 'RunningPerformance') {
            localStorage.setItem('RunningPerformanceTest', 'true');
        }
        // 关闭运行中性能
        if (request.action === 'StopRunningPerformance') {
            localStorage.setItem('RunningPerformanceTest', 'false');
            chrome.storage.local.get(['totalRunningPerformance'], function (result) {
                const data = result.totalRunningPerformance
                chrome.storage.local.set({
                    totalRunningPerformance: data,
                    runningPerformance: null,
                    runningPerformanceUrl: null
                });
            })
        }
        // 开启UI录制
        if (request.action === '') {

        }
    })
})();

var getLcp = getLcp || (() => {
    // 原内容 https://web.dev/lcp/
    // Create a variable to hold the latest LCP value (since it can change).
    let lcp;
    // Create the PerformanceObserver instance.
    const po = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];

        // Update `lcp` to the latest value, using `renderTime` if it's available,
        // otherwise using `loadTime`. (Note: `renderTime` may not be available if
        // the element is an image and it's loaded cross-origin without the
        // `Timing-Allow-Origin` header.)
        lcp = lastEntry.renderTime || lastEntry.loadTime;
    });

    // Observe entries of type `largest-contentful-paint`, including buffered
    // entries, i.e. entries that occurred before calling `observe()`.
    po.observe({type: 'largest-contentful-paint', buffered: true});

    // Send the latest LCP value to your analytics server once the user
    // leaves the tab.
    addEventListener('visibilitychange', function fn() {
        if (lcp && document.visibilityState === 'hidden') {
            console.log('LCP:', lcp);
            removeEventListener('visibilitychange', fn, true);
        }
    }, true);
})()
