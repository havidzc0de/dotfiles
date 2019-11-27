var iconOff = {
    path: "IMG/16AVPNoff.png"
}
var iconOn = {
    path: "IMG/16AVPN.png"
};

function setIconOnOff() {
    chrome.proxy.settings.get({
            'incognito': false
        },
        function (config) {
            if (config['value']['mode'] == "system" || config['value']['mode'] == "direct") {
                chrome.browserAction.setIcon(iconOff);
                $('#togBtn').prop('checked', false);
                localStorage["Toogle"] = "OFF";
            } else {
                chrome.browserAction.setIcon(iconOn);
                $('#togBtn').prop('checked', true);
                localStorage["Toogle"] = "ON";
            }
        })
}

$(document).ready(function () {
    setIconOnOff();
    $("#togBtn").click(function () {
        if ($('#togBtn').prop('checked') == false) {
            var config = {
                mode: 'system',
            };
            chrome.proxy.settings.set({
                    value: config,
                    scope: 'regular'
                },
                function () {});
            setIconOnOff();
        } else {
            chrome.extension.sendMessage({
                msg: "Refresh"
            });
        }
    });

    $("#refBtn").click(function () {
        chrome.extension.sendMessage({
            msg: "Refresh"
        });
    });
});