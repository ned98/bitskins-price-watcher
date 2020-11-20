let log = console.log;
fs = require('fs');
var Pusher = require('pusher-client');
var pusher = new Pusher('c0eef4118084f8164bec65e6253bf195', {
    encrypted: true,
    wsPort: 443,
    wssPort: 443,
    host: 'notifier.bitskins.com'
});

let rawdata = fs.readFileSync('skins.json');
let skins = JSON.parse(rawdata);

pusher.connection.bind('connected', function () {
    log(" -- connected to websocket");
});

pusher.connection.bind('disconnected', function () {
    log(" -- disconnected from websocket");
});

var events_channel = pusher.subscribe('inventory_changes');

events_channel.bind('listed', function (data) {
    if (data.app_id === "730") {

        for (let [key, value] of Object.entries(skins)) {
            if (data.market_hash_name === key && data.price <= value) {
                log(`${unixTimeToDate(data)} [LISTED] ${data.market_hash_name} is listed for $${data.price}. Buy price: $${value}`);
                log("##############################################################################################################");
                log("                                                                                                              ");
            }
        }
    }
});

events_channel.bind('price_changed', function (data) {
    if (data.app_id === "730") {

        for (let [key, value] of Object.entries(skins)) {
            if (data.market_hash_name === key && data.price <= value) {
                log(`${unixTimeToDate(data)} ${data.market_hash_name} price changed to ${data.price}. Buy price: ${value}`);
                log("###################################################################################################################");
                log("                                                                                                              ");
            }
        }
    }
});

function unixTimeToDate(data) {
    let unix_timestamp = data.broadcasted_at;
    var date = new Date(unix_timestamp * 1000);
    var hours = date.getHours();
    var minutes = "0" + date.getMinutes();
    var seconds = "0" + date.getSeconds();
    var formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);

    return `[${formattedTime}]`;
}

