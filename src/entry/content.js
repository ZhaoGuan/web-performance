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
        try {
            const po = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const lastEntry = entries[entries.length - 1]; // 优先取 renderTime，如果没有则取 loadTime
                let lcp = lastEntry.renderTime || lastEntry.loadTime;
                state.lcp += lcp
                console.log(`Largest Contentful Paint ${lcp}`)
            });
            po.observe({type: 'largest-contentful-paint'});
            // eslint-disable-next-line no-empty
        } catch (e) {
        }
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
                    location.reload();
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
                localStorage.setItem('LoadPerformanceTest', 'false')
                chrome.storage.local.set({Performance: state});
                message = message.join("\n") + "\n";
                console.log(message)
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
var doLoadPerformanceTest = doLoadPerformanceTest || (() => {
    chrome.runtime.onMessage.addListener(request => {
        if (request.action === 'LoadPerformance') {
            // 清空数据
            localStorage.setItem('performanceTesting', JSON.stringify({}));
            // 设置执行
            localStorage.setItem('LoadPerformanceTest', 'true')
            // 重新载入页面
            location.reload()
        }
        // 执行运行中性能
        if (request.action === 'RunningPerformance') {
            // 清空数据
            localStorage.setItem('RunningPerformanceTest', 'true');
        }
        // 关闭运行中性能
        if (request.action === 'StopRunningPerformance') {
            // 清空数据
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
    })
})();