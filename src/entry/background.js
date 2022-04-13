// eslint-disable-next-line no-unused-vars
var url = null


chrome.storage.onChanged.addListener((changes) => {
    for (let [key, {newValue}] of Object.entries(changes)) {
        if (key === 'runningPerformance' && newValue !== null) {
            url = newValue.url
        }
        if (key === 'runningPerformance' && newValue === null) {
            url = null
        }
    }
});

function checkRunning() {
    chrome.tabs.query({active: true, currentWindow: true}, tab => {
        if (url !== null && (tab.length === 0 || tab[0].url !== url)) {
            chrome.runtime.sendMessage({
                msg: "isRunning",
                data: true
            });
        }
    });

}

setInterval(checkRunning, 2000)
