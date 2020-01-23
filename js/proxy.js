function onBeforeRequestCbk(details)
{
    if (details.url) {
        var result = removeTrackingParameters(details.url);
        if (result.modified === true) {
            return {
                redirectUrl: result.url
            };
        }
    }

    return {};
}

if (chrome === null)
    chrome = browser;

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
