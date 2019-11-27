chrome.extension.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.msg == "Refresh") {
            Doing("Refresh");
        }
    }
);

chrome.commands.onCommand.addListener(function(command) {
    if(command == "refresh-list"){
        Doing("Refresh", localStorage["Toogle"]);
    }
    console.log('Run Command: ', command);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if(localStorage["Toogle"]=="ON"){
        datawl = dec(localStorage["datawl"]);
        arr = datawl.replace(/"/g,"").replace(/\n/g,"").split(",");
        if (changeInfo.status == 'complete' && arr.some(url => tab.url.includes(url))) { 
            $.ajax({
                url: urlaz+"api/extlog/insert",
                type: "POST",
                contentType: "application/x-www-form-urlencoded",
                dataType: "text",
                data: {
                    "username": un,
                    "browserid": localStorage["BrowserID"],
                    "ip": localStorage["IPPublic"],
                    "local": localStorage["IPLocal"],
                    "country": localStorage["Geo"],
                    "os": localStorage["OS"],
                    "url": tab.url
                },
                complete: function (jqXHR, status) {
                    if (status == "success") {
                        if(jqXHR.responseText == "success"){
                            console.log("Log saved.");
                        } else {
                            console.log("Connected but Log not saved. Something Wrong on server.");
                        }
                    } else {
                        console.log("Log not saved. Connection Failed.");
                    }                
                }
            });
        }
    }
});

chrome.runtime.onStartup.addListener(function (details) {
    Doing();
    console.log("StartedUp");
});

chrome.runtime.onInstalled.addListener(function (details) {
    Doing();
    console.log("Installed");
});