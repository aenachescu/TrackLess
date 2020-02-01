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

const g_blackListedParameters = {
    // facebook
    "fbclid"            : true,
    "feature"           : true, // TODO: research more about this parameter, sometimes it could be legit
    "ad_id"             : true,
    "adset_id"          : true,
    "campaign_id"       : true,
    "ad_name"           : true,
    "adset_name"        : true,
    "campaign_name"     : true,
    "placement"         : true,
    "site_source_name"  : true,

    // google
    "gclid"             : true,
    "utm_medium"        : true,
    "utm_source"        : true,
    "utm_content"       : true,
    "utm_serial"        : true,
    "utm_campaign"      : true,
    "utm_term"          : true,
    "utm_id"            : true,

    // hubspot
    "hsa_cam"           : true,
    "hsa_grp"           : true,
    "hsa_mt"            : true,
    "hsa_src"           : true,
    "hsa_ad"            : true,
    "hsa_acc"           : true,
    "hsa_net"           : true,
    "hsa_kw"            : true,
    "hsa_tgt"           : true,
    "hsa_ver"           : true,

    // ns* (who the hell adds these parameters???)
    "ns_campaign"       : true,
    "ns_mchannel"       : true,
    "ns_source"         : true,
    "ocid"              : true, // TODO: research more about this parameter, sometimes it could be legit
};

const g_blackListedParametersByHostname = {
    "www.facebook.com": {
        "parameters" : {
            "__xts__[0]"        : true,
            "__xts__%5B0%5D"    : true,
            "__tn__"            : true,
            "eid"               : true,
            "hc_ref"            : true,
            "fref"              : true,
            "ref"               : true,
        },
        "originHostname": "www.facebook.com",
        "checkOriginHostname" : false,
        "removeGlobalBlacklistedParameters": true,
    },
};

function removeTrackingParameters(strUrl, strOriginUrl)
{
    var modified = false;
    var removeGlobalBlacklistedParameters = true;
    const url = new URL(strUrl);
    var parameters = [...url.searchParams.keys()];

    if (typeof g_blackListedParametersByHostname[url.hostname] !== 'undefined') {
        const hostDetails = g_blackListedParametersByHostname[url.hostname];
        var removeParametersByHostname = true;

        if (hostDetails.checkOriginHostname === true) {
            if (strOriginUrl === undefined) {
                removeParametersByHostname = false;
            } else {
                const originUrl = new URL(strOriginUrl);
                if (hostDetails.originHostname !== originUrl.hostname) {
                    removeParametersByHostname = false;
                }
            }
        }

        if (removeParametersByHostname === true) {
            for (const parameter of parameters) {
                if (typeof hostDetails.parameters[parameter] !== 'undefined') {
                    url.searchParams.delete(parameter);
                    modified = true;
                }
            }

            removeGlobalBlacklistedParameters = hostDetails.removeGlobalBlacklistedParameters;

            if (modified === true) {
                parameters = [...url.searchParams.keys()];
            }
        }
    }

    if (removeGlobalBlacklistedParameters === true) {
        for (const parameter of parameters) {
            if (typeof g_blackListedParameters[parameter] !== 'undefined') {
                url.searchParams.delete(parameter);
                modified = true;
            }
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
        var strOriginUrl;
        if (isChrome === true) {
            strOriginUrl = details.initiator;
        } else {
            strOriginUrl = details.originUrl;
        }

        var result = removeTrackingParameters(details.url, strOriginUrl);
        if (result.modified === true) {
            // console.info(`original url: ${details.url}   -->   modified url: ${result.url}`);
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
