//For Refresh
setTimeout(function () {
    console.log("Auto Refesh");
    Doing("Refresh", localStorage["Toogle"]);
    setInterval(function () {
        Doing("Refresh", localStorage["Toogle"])
    }, intervalRefresh); //Minute * Second * Milisecond
    setIconOnOff();
}, 10 * 1000);
