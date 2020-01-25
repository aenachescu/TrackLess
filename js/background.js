var isChrome = true;
if (typeof chrome !== "undefined") {
    if (typeof browser !== "undefined") {
        // console.info("detected firefox");
        isChrome = false;
    } else {
        // console.info("detected chrome");
    }
}

//
// core
//

const g_blackListedParameters = [
    "fbclid",
    "gclid",
    "utm_medium",
    "utm_source",
    "utm_content",
    "utm_serial",
    "utm_campaign",
    "utm_term"
];

function removeTrackingParameters(strUrl)
{
    var modified = false;
    const url = new URL(strUrl);

    for (const parameter of g_blackListedParameters) {
        if (url.searchParams.get(parameter)) {
            url.searchParams.delete(parameter);
            modified = true;
        }
    }

    if (modified === true) {
        return {
            modified: true,
            url: url.href
        };
    }

    return {
        modified: false
    };
}


//
// settings
//

function loadSettings(cbk)
{
    if (isChrome === false) {
        browser.storage.local.get()
            .then(
                function(settings) {
                    // console.info(`firefox settings loaded ${JSON.stringify(settings)}`);
                    cbk(settings);
                },
                function(error) {
                    console.error(`Load settings error: ${error}`);
                }
            )
    } else {
        chrome.storage.local.get(
            null,
            function(settings) {
                // console.info(`chrome settings loaded ${JSON.stringify(settings)}`);
                cbk(settings);
            }
        );
    }
}

function saveSettings(settings, cbk)
{
    if (isChrome === false) {
        browser.storage.local.set(settings)
            .then(
                function() {
                    // console.info(`firefox settings saved ${JSON.stringify(settings)}`);
                    cbk(settings);
                },
                function(error) {
                    console.error(`Save settings error: ${error}`);
                }
            );
    } else {
        chrome.storage.local.set(
            settings,
            function() {
                // console.info(`chrome settings saved ${JSON.stringify(settings)}`);
                cbk(settings);
            }
        )
    }
}

//
// proxy
//

let g_proxyEnabled = false;

function onBeforeRequestCbk(details)
{
    if (details.url) {
        var result = removeTrackingParameters(details.url);
        if (result.modified === true) {
            // console.info(`original url: ${details.url}`);
            // console.info(`modified url: ${result.url}`);
            return {
                redirectUrl: result.url
            };
        }
    }

    return {};
}

function enableProxy()
{
    // console.info("enable proxy");
    if (g_proxyEnabled === true)
        return;

    chrome.webRequest.onBeforeRequest.addListener(
        onBeforeRequestCbk,
        {
            urls: [
                "<all_urls>"
            ]
        },
        [
            "blocking"
        ]
    );
    g_proxyEnabled = true;
}

function disableProxy()
{
    // console.info("disable proxy");
    if (g_proxyEnabled === false)
        return;

    chrome.webRequest.onBeforeRequest.removeListener(onBeforeRequestCbk);
    g_proxyEnabled = false;
}

//
// init default settings on install
//

function onInstalledCbk(details)
{
    if (details.reason === "install") {
        // console.info("installing");
        saveSettings(
            {
                status: "enabled"
            },
            processingSettings
        );
    }
}

chrome.runtime.onInstalled.addListener(onInstalledCbk);

//
// main
//

function init()
{
    // console.info("init");
    loadSettings(processingSettings);
    chrome.runtime.onMessage.addListener(processingMessage);
}

function processingSettings(settings)
{
    if (typeof settings.status !== "undefined") {
        if (settings.status === "enabled")
            enableProxy();
        if (settings.status === "disabled")
            disableProxy();
    }
}

function processingMessage(message, sender, sendResponse)
{
    // console.info(`${JSON.stringify(message)}`);

    if (message.type === "getSettings") {
        loadSettings(sendResponse);
        return true;
    } else if (message.type === "changeSettings") {
        saveSettings(
            {
                "status": message.status
            },
            processingSettings
        );
    }

    return false;
}

init();
