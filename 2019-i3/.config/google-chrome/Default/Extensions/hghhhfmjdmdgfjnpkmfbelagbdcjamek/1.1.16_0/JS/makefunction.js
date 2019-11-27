//SetOnOff Icon Extension
function setIconOnOff() {
    var iconOff = {
        path: "IMG/16AVPNoff.png"
    }
    var iconOn = {
        path: "IMG/16AVPN.png"
    };

    chrome.proxy.settings.get({
            'incognito': false
        },
        function (config) {
            if (config['value']['mode'] == "system" || config['value']['mode'] == "direct") {
                chrome.browserAction.setIcon(iconOff);
                localStorage["Toogle"] = "OFF";
            } else {
                chrome.browserAction.setIcon(iconOn);
                localStorage["Toogle"] = "ON";
            }
        })
}

function getLocalIPs(callback) {
    var ips = [];
    var RTCPeerConnection = window.RTCPeerConnection ||
        window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
    var pc = new RTCPeerConnection({
        iceServers: []
    });
    pc.createDataChannel('');
    pc.onicecandidate = function (e) {
        if (!e.candidate) {
            pc.close();
            callback(ips);
            return;
        }
        var ip = /^candidate:.+ (\S+) \d+ typ/.exec(e.candidate.candidate)[1];
        if (ips.indexOf(ip) == -1) // avoid duplicate entries (tcp/udp)
            ips.push(ip);
    };
    pc.createOffer(function (sdp) {
        pc.setLocalDescription(sdp);
    }, function onerror() {});
}

function getOsAndBrowser() {
    var OsName = "Unknown";
    var sBrowser, sUsrAg = navigator.userAgent;
    if (sUsrAg.indexOf("Windows") != -1) {
        if (sUsrAg.indexOf("NT 10.0") != -1) OsName = "Windows 10";
        else if (sUsrAg.indexOf("NT 6.2") != -1) OsName = "Windows 8";
        else if (sUsrAg.indexOf("NT 6.1") != -1) OsName = "Windows 7";
        else if (sUsrAg.indexOf("NT 6.0") != -1) OsName = "Windows Vista";
        else if (sUsrAg.indexOf("NT 5.1") != -1) OsName = "Windows XP";
        else if (sUsrAg.indexOf("NT 5.0") != -1) OsName = "Windows 2000";
    } else if (sUsrAg.indexOf("Mac") != -1) {
        OsName = "Mac/iOS";
    } else if (sUsrAg.indexOf("X11") != -1) {
        OsName = "UNIX";
    } else if (sUsrAg.indexOf("Linux") != -1) {
        OsName = "Linux";
    } else OsName = "Unknown";

    if (sUsrAg.indexOf("x64") != -1) {
        OsName += " 64 bit";
    } else if (sUsrAg.indexOf("x86") != -1 || sUsrAg.indexOf("x32") != -1) {
        OsName += " 32 bit";
    }

    if (sUsrAg.indexOf("Firefox") > -1) {
        sBrowser = "Mozilla Firefox";
        //"Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:61.0) Gecko/20100101 Firefox/61.0"
    } else if ((!!window.opr && !!opr.addons) || !!window.opera || sUsrAg.indexOf(' OPR/') >= 0) {
        sBrowser = "Opera";
    } else if (sUsrAg.indexOf("Trident") > -1) {
        sBrowser = "Microsoft Internet Explorer";
        //"Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; .NET4.0C; .NET4.0E; Zoom 3.6.0; wbx 1.0.0; rv:11.0) like Gecko"
    } else if (sUsrAg.indexOf("Edge") > -1) {
        sBrowser = "Microsoft Edge";
        //"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36 Edge/16.16299"
    } else if (sUsrAg.indexOf("Chrome") > -1) {
        sBrowser = "Google Chrome";
        //"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/66.0.3359.181 Chrome/66.0.3359.181 Safari/537.36"
    } else if (sUsrAg.indexOf("Safari") > -1) {
        sBrowser = "Apple Safari";
        //"Mozilla/5.0 (iPhone; CPU iPhone OS 11_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/11.0 Mobile/15E148 Safari/604.1 980x1306"
    } else {
        sBrowser = "unknown";
    }
    return OsName + "/" + sBrowser;
}

function getCookies(name, callback) {
    chrome.cookies.get({
        "url": urlaz,
        "name": name
    }, function (cookie) {
        if (callback) {
            if (cookie == undefined) {
                callback(null);
            } else {
                callback(cookie);
            }
        }
    });
}

function setCookie(cname, cvalue) {
    let d = new Date();
    let expires = d.getTime() / 1000 + 3600 * 24 * 365;
    let securing = true;
    let sameSiteStatus = 'no_restriction';
    chrome.cookies.set({
        url: urlaz,
        name: cname,
        value: cvalue,
        secure: securing,
        sameSite: sameSiteStatus,
        expirationDate: expires
    });
}

function enc($string){
    return btoa($string);
}

function dec($string){
    return atob($string);
}