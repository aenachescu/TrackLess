function enableHandleClick(cb)
{
    console.info("aici");
    if (this.checked === true) {
        browser.runtime.sendMessage({
            "type": "changeSettings",
            "status":"enabled"
        });
    } else {
        browser.runtime.sendMessage({
            "type": "changeSettings",
            "status":"disabled"
        });
    }
}

function initPanel()
{
    console.info("init panel");

    browser.runtime.sendMessage({
        "type": "getSettings"
    }).then( function(response) {
        var checkboxElement = document.getElementById('enableCheckboxId');
        checkboxElement.onclick = enableHandleClick;

        console.info(`primit: ${JSON.stringify(response)}`);
    });
}

initPanel();
