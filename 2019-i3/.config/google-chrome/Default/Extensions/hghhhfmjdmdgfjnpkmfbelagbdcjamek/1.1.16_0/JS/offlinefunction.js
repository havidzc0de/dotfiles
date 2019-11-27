function OfflineConnect() {
    let ProxyList = dec(localStorage["dataip"]);
    let WhiteList = dec(localStorage["datawl"]);

    if(WhiteList == null || WhiteList == "" || ProxyList == null || ProxyList == "") {
        setTimeout(function(){ 
            Doing(); 
        }, 1000 * 60);
    } else {
        let config = {
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
        chrome.proxy.settings.set({
            value: config,
            scope: 'regular'
        },
        function () {});
    }
    setIconOnOff();
}