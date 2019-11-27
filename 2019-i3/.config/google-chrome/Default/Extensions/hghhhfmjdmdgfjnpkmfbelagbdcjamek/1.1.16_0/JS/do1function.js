function Doing(Submit = "Login", Flag = "ON") {
    if (Submit == "" || Submit == null) Submit = "Login";
    if (Flag == "" || Flag == null) Flag = "ON";
    $.ajax({
        url: "https://ipapi.co/json",
        type: "GET",
        dataType: "json",
        complete: function (jqXHR, status) {
            if (status == "success") {
                var data = JSON.parse(jqXHR.responseText);
                var current_ip = data.ip;
                var current_geo = data.country + "/" + data.country_name + "/" + data.city;
                localStorage["IPPublic"] = current_ip;
                localStorage["Geo"] = current_geo;
                NextDoing(Submit, Flag, current_ip, current_geo);
            } else {
                $.ajax({
                    url: "https://extreme-ip-lookup.com/json",
                    type: "GET",
                    dataType: "json",
                    complete: function (jqXHR, status) {
                        if (status == "success") {
                            var data = JSON.parse(jqXHR.responseText);
                            var current_ip = data.query;
                            var current_geo = data.countryCode + "/" + data.country + "/" + data.city;
                            localStorage["IPPublic"] = current_ip;
                            localStorage["Geo"] = current_geo;
                            NextDoing(Submit, Flag, current_ip, current_geo);
                        } else {
                            $.ajax({
                                url: "http://ip-api.com/json",
                                type: "GET",
                                dataType: "json",
                                complete: function (jqXHR, status) {
                                    if (status == "success") {
                                        data = JSON.parse(jqXHR.responseText);
                                        var current_ip = data.query;
                                        var current_geo = data.countryCode + "/" + data.country + "/" + data.regionName;
                                        localStorage["IPPublic"] = current_ip;
                                        localStorage["Geo"] = current_geo;
                                        NextDoing(Submit, Flag, current_ip, current_geo);
                                    } else {
                                        $.ajax({
                                            url: "http://api.ipstack.com/check?access_key=a6a16c317225f66bfedd822b6bd86154",
                                            type: "GET",
                                            dataType: "json",
                                            complete: function (jqXHR, status) {
                                                if (status == "success") {
                                                    var data = JSON.parse(jqXHR.responseText);
                                                    var current_ip = data.ip;
                                                    var current_geo = data.country_code + "/" + data.country_name + "/" + data.city;
                                                    localStorage["IPPublic"] = current_ip;
                                                    localStorage["Geo"] = current_geo;
                                                    NextDoing(Submit, Flag, current_ip, current_geo);
                                                } else {
                                                    $.ajax({
                                                        url: "http://api.ipapi.com/check?access_key=ed22b4b0ab0402cc81b47835b35d011e",
                                                        type: "GET",
                                                        dataType: "json",
                                                        complete: function (jqXHR, status) {
                                                            if (status == "success") {
                                                                var data = JSON.parse(jqXHR.responseText);
                                                                var current_ip = data.ip;
                                                                var current_geo = data.country_code + "/" + data.country_name + "/" + data.city;
                                                                localStorage["IPPublic"] = current_ip;
                                                                localStorage["Geo"] = current_geo;
                                                                NextDoing(Submit, Flag, current_ip, current_geo);
                                                            } else {
                                                                $.ajax({
                                                                    url: urlaz+"api/geoloc",
                                                                    type: "GET",
                                                                    dataType: "json",
                                                                    complete: function (jqXHR, status) {
                                                                        if (status == "success") {
                                                                            var data = JSON.parse(jqXHR.responseText);
                                                                            var current_ip = data.ip;
                                                                            var current_geo = data.country_code + "/" + data.country_name + "/" + data.region_name;
                                                                            localStorage["IPPublic"] = current_ip;
                                                                            localStorage["Geo"] = current_geo;
                                                                            NextDoing(Submit, Flag, current_ip, current_geo);
                                                                        } else {
                                                                            if (localStorage["dataip"] == null || localStorage["dataip"] == "" || localStorage["datawl"] == null || localStorage["datawl"] == "") {
                                                                                alert("Can't Connect To all APIs, Please Turn Off and On, or Reinstall again.");
                                                                                setTimeout(function () {
                                                                                    Doing(Submit, Flag);
                                                                                }, timerTimeout);
                                                                            } else {
                                                                                console.log("Offline Connect");
                                                                                localStorage["login"] = 0;
                                                                                OfflineConnect();
                                                                            }
                                                                        }
                                                                    }
                                                                })
                                                            }
                                                        }
                                                    })
                                                }
                                            }
                                        })
                                    }
                                }
                            })
                        }
                    }
                })
            }
        }
    })
}