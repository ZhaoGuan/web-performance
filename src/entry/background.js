// eslint-disable-next-line no-unused-vars
var loadIsRunning = false
var runningPerformanceIsRunning = false

chrome.devtools.network.onRequestFinished.addListener(
    (request) => {
        if (!Object.keys(request).includes("_fromCache") && request.request.httpVersion !== "chrome-extension") {
            console.log("Net Work")
            console.log(request)
            chrome.storage.local.set({
                netWork: request
            });
        }
    }
);

chrome.storage.onChanged.addListener((changes) => {
    for (let [key, {newValue}] of Object.entries(changes)) {
        if (key === 'loadIsRunning' && newValue !== null) {
            loadIsRunning = newValue
        }
        if (key === 'runningPerformanceIsRunning' && newValue !== null) {
            runningPerformanceIsRunning = newValue
        }
    }
});

function checkRunning() {
    chrome.tabs.query({active: true, currentWindow: true}, () => {
        try {
            chrome.runtime.sendMessage(
                {
                    msg: "loadIsRunning",
                    data: loadIsRunning
                });
            chrome.runtime.sendMessage({
                msg: "runningPerformanceIsRunning",
                data: runningPerformanceIsRunning
            });
            // eslint-disable-next-line no-empty
        } catch (e) {

        }
    });
}

setInterval(checkRunning, 500)
