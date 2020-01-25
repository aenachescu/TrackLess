function enableHandleClick(cb)
{
    if (this.checked === true) {
        chrome.runtime.sendMessage(
            {
                "type": "changeSettings",
                "status":"enabled"
            }
        );
    } else {
        chrome.runtime.sendMessage(
            {
                "type": "changeSettings",
                "status":"disabled"
            }
        );
    }
}

function initPanel()
{
    // console.info("init panel");

    chrome.runtime.sendMessage(
        {
            "type": "getSettings"
        },
        function(response) {
            var checkboxElement = document.getElementById('enableCheckboxId');
            checkboxElement.onclick = enableHandleClick;
            checkboxElement.checked = false;

            if (response.status === "enabled")
                checkboxElement.checked = true;
        }
    );
}

initPanel();
