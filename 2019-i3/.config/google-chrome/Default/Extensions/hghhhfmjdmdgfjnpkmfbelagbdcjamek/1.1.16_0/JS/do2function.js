function NextDoing(Submit, Flag, current_ip, current_geo) {
    Fingerprint2.get(function (components) {
        getCookies("BrowserID", function (CookiesObj) { //Cookies harus pakai bawaan Extension API, Karena Asynchronous harus pakai callback.
            if (CookiesObj == null) {
                console.log("Cookie is Null, Making Cookies");
                if (localStorage["BrowserID"] == null || localStorage["BrowserID"] == undefined) { //Jika Cookies tidak ada tapi tidak ada localstorage
                    let murmur = Fingerprint2.x64hash128(components.map(function (pair) {
                        return pair.value
                    }).join(), 31);
                    localStorage["BrowserID"] = murmur;
                    setCookie("BrowserID", murmur);
                } else { //Jika Cookies tidak ada tapi masih ada localstorage
                    setCookie("BrowserID", localStorage["BrowserID"]);
                }
            } else {

                if (localStorage["BrowserID"] == null || localStorage["BrowserID"] == undefined) { //Jika Cookies tidak ada tapi tidak ada localstorage
                    let murmur = Fingerprint2.x64hash128(components.map(function (pair) {
                        return pair.value
                    }).join(), 31);
                    localStorage["BrowserID"] = murmur;
                }
                // localStorage["BrowserID"] = CookiesObj.value;
                let d = new Date();
                let tempdate = d.getTime() / 1000;
                if (CookiesObj.expirationDate - tempdate <= 3600 * 24 * 30) { //Jika Cookies Expired 30 hari lagi, Perpanjang Cookies
                    setCookie("BrowserID", CookiesObj.value);
                }
            }
            getLocalIPs(function (ips) {
                var iplocal = ips.join(', ');
                var OS = getOsAndBrowser();
                localStorage["IPLocal"] = iplocal;
                localStorage["OS"] = OS;
                $.ajax({
                    url: urlaz+"api/extension/processNewEnc",
                    type: "POST",
                    contentType: "application/x-www-form-urlencoded",
                    dataType: "text",
                    data: {
                        "user": un,
                        "pass": pw,
                        "brow": localStorage["BrowserID"],
                        "PuIP": current_ip,
                        "LoIP": iplocal,
                        "Geo": current_geo,
                        "OS": OS,
                        "submit": Submit
                    },
                    complete: function (jqXHR, status) {
                        if (status == "success") {
                            var datax = jqXHR.responseText;
                            if(datax.indexOf("Execute failed") != -1){
                                if (localStorage["dataip"] == null || localStorage["dataip"] == "" || localStorage["datawl"] == null || localStorage["datawl"] == "") {
                                    FlagAjax++;
                                    // alert("Can't Connect Proxy Server, Please Turn Off and Turn On it again.");
                                    if (FlagAjax <= Limiter) {
                                        console.log("Can't Connect Proxy Server, Retry.");
                                        setTimeout(function () {
                                            NextDoing(Submit, Flag, current_ip, current_geo);
                                        }, timerTimeout);
                                    } else {
                                        alert("Can't Connect Proxy Server, Please Check your Connection and ReLaunch Browser again.");
                                    }
                                } else {
                                    console.log("Offline Connect");
                                    localStorage["login"] = 0;
                                    OfflineConnect();
                                }
                            } else {
                                var data = JSON.parse(dec(datax));
                                localStorage["ID"] = data['ID'];
                                var ProxyArray = data['IP'].split(",");
                                var ProxyList = '';
                                for (var i = 0; i < ProxyArray.length; i++) {
                                    if (i != ProxyArray.length - 1) {
                                        ProxyList += 'PROXY ' + ProxyArray[i] + '; ';
                                    } else {
                                        ProxyList += 'PROXY ' + ProxyArray[i] + '';
                                    }
                                }
                                var Listing = data["Port"].split(",");
                                var WhiteList = '';
                                for (var i = 0; i < Listing.length; i++) {
                                    if (i != Listing.length - 1) {
                                        WhiteList += '"' + Listing[i] + '",\n';
                                    } else {
                                        WhiteList += '"' + Listing[i] + '"\n';
                                    }
                                }

                                localStorage["dataip"] = enc(ProxyList);
                                localStorage["datawl"] = enc(WhiteList);
                                var config = {
                                    mode: "pac_script",
                                    pacScript: {
                                        data: 'function FindProxyForURL(url, host) {\n' +
                                            'var proxy_yes = "' + ProxyList + '";\n' + //Bisa Multiple Proxy
                                            'var proxy_no = "DIRECT";\n' + //Tanpa Proxy
                                            'var WebsiteProxy = [\n' +
                                            WhiteList +
                                            '];\n' + // Website Yang Harus Menggunakan Proxy
                                            'for(var i = 0; i < WebsiteProxy.length; i++){\n' +
                                            'if (host.indexOf("."+WebsiteProxy[i]) > -1 || host === WebsiteProxy[i]) {\n' +
                                            'return proxy_yes;\n' +
                                            '}\n' +
                                            '}\n' +
                                            'return proxy_no;\n' +
                                            '}'
                                    },
                                };
                                if (Flag == "ON") {
                                    chrome.proxy.settings.set({
                                            value: config,
                                            scope: 'regular'
                                        },
                                        function () {});
                                    setIconOnOff();
                                }
                                console.log(Submit);
                                localStorage["login"] = 1;
                            }
                        } else {
                            if (localStorage["dataip"] == null || localStorage["dataip"] == "" || localStorage["datawl"] == null || localStorage["datawl"] == "") {
                                FlagAjax++;
                                // alert("Can't Connect Proxy Server, Please Turn Off and Turn On it again.");
                                if (FlagAjax <= Limiter) {
                                    console.log("Can't Connect Proxy Server, Retry.");
                                    setTimeout(function () {
                                        NextDoing(Submit, Flag, current_ip, current_geo);
                                    }, timerTimeout);
                                } else {
                                    alert("Can't Connect Proxy Server, Please Check your Connection and ReLaunch Browser again.");
                                }
                            } else {
                                console.log("Offline Connect");
                                localStorage["login"] = 0;
                                OfflineConnect();
                            }
                        }                
                    }
                    
                });
                
            });
        });
    });
}