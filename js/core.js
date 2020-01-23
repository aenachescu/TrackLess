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
