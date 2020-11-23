const path = require('path');
fs = require('fs');
const express = require('express');
let config = require('./config');
const port = 3000;
const app = express();
let log = console.log;

// Discord API
const Discord = require("discord.js");
const client = new Discord.Client();
client.login(config.discord.token);
client.on('ready', () => {
    log(`Logged in as ${client.user.tag}` + '\n');
})

const request = require('request');
const totp = require('notp').totp;
const base32 = require('thirty-two');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static('views'));
app.use(express.static("public"));
app.use(express.static(path.join(__dirname, 'views')));
app.use(express.static(path.join(__dirname, '/public')));

// Declaration of API & Secret
let code = totp.gen(base32.decode(config.bitskins.code));
let api_key = config.bitskins.api_key;

let rawdata = fs.readFileSync('skins.json');
let skins = JSON.parse(rawdata);

const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { window } = new JSDOM("");
const $ = require("jquery")(window);
const dom = new JSDOM(`
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Price Watcher</title>
    <link href="//maxcdn.bootstrapcdn.com/bootstrap/4.1.1/css/bootstrap.min.css" rel="stylesheet" id="bootstrap-css">
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@500&amp;display=swap" rel="stylesheet">
    <script src="//maxcdn.bootstrapcdn.com/bootstrap/4.1.1/js/bootstrap.min.js"></script>
    <script src="//cdnjs.cloudflare.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link type="text/css" rel="stylesheet" href="/css/style.css">
</head>
<body>
<script type="module" src="/app.js"></script>
<script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
</body>
</html>`, {
        url: "http://localhost:3000/",
        contentType: "text/html",
        includeNodeLocations: true,
        pretendToBeVisual: true
    })

const document = dom.window.document;
const bodyEl = document.body;
var container = document.createElement('div');
var title = document.createElement('h2');
var accountBalance = document.createElement('div');
var balanceText = document.createElement('p');
var balanceVal = document.createElement('p');
var cardList = document.createElement('div');
var card = document.createElement('div');

container.classList.add('container-fluid');
title.classList.add('title', 'mx-auto');
accountBalance.classList.add('mx-auto');
balanceText.classList.add('balance-text');
balanceVal.classList.add('balance-val');
cardList.classList.add('items', 'grid-container');
card.classList.add('card');

title.innerHTML += "Bitskins Price Watcher";
balanceText.innerHTML += "Balance: ";
accountBalance.id = 'account-balance';

container.append(title);
container.append(accountBalance);
container.append(balanceText);
container.append(balanceVal);
container.append(cardList);
bodyEl.append(container);

const optionsBal = {
    url: `https://bitskins.com/api/v1/get_account_balance/?api_key=${api_key}&app_id=730&code=${code}`,
    gzip: true,
    json: true,
};
request(optionsBal, (error, response, body) => {
    try {
        let balance = body.data.available_balance;
        balance = Number(balance).toFixedNoRounding(2);

        balanceVal.innerHTML += `$${balance}`;
        accountBalance.append(balanceText);
        accountBalance.append(balanceVal);

    } catch (error) {
        log(error);
    }
});

const options = {
    url: `https://bitskins.com/api/v1/get_price_data_for_items_on_sale/?api_key=${api_key}&app_id=730&code=${code}`,
    gzip: true,
    json: true,
};

request(options, (error, response, body) => {
    try {
        var objCount = body.data.items.length;

        for (let [key, value] of Object.entries(skins)) {

            for (var i = 0; i < objCount; i++) {
                if (body.data.items[i].market_hash_name == key && body.data.items[i].lowest_price <= value && body.data.items[i].lowest_price != 0) {
                    var skinName = body.data.items[i].market_hash_name;
                    var skinImage = `http://api.steamapis.com/image/item/730/${body.data.items[i].market_hash_name}`;
                    var skinPrice = body.data.items[i].lowest_price;
                    var data = { skinName: skinName, skinPrice: skinPrice, image: skinImage };

                    app.get('/', (req, res) => {
                        res.render('index', data);
                    });

                    var card = document.createElement('div');
                    var cardTitleDiv = document.createElement('div');
                    var cardTitle = document.createElement('p');
                    var cardImageDiv = document.createElement('div');
                    var imageLink = document.createElement('a');
                    var cardImage = document.createElement('img');
                    var cardFooter = document.createElement('div');
                    var ul = document.createElement('ul');
                    var lowestLi = document.createElement('li');
                    var lowestPriceText = document.createElement('p');
                    var lowestPriceVal = document.createElement('p');
                    var buyPriceLi = document.createElement('li');
                    var buyPriceText = document.createElement('p');
                    var buyPriceVal = document.createElement('p');

                    card.classList.add('card');
                    cardTitleDiv.classList.add('card-header', 'border', 'border-danger', 'bg-header');
                    cardTitle.classList.add('card-title');
                    cardImageDiv.classList.add('card-image', 'border', 'border-danger', 'bg-body');
                    cardImage.classList.add('image-size');
                    cardFooter.classList.add('card-footer', 'border', 'border-danger', 'bg-footer');
                    ul.classList.add('list-group');
                    lowestLi.classList.add('lowest-li');
                    lowestPriceText.classList.add('lowest-price-text');
                    lowestPriceVal.classList.add('lowest-price-val');
                    buyPriceLi.classList.add('buy-price-li');
                    buyPriceText.classList.add('buy-price-text');
                    buyPriceVal.classList.add('buy-price-val');

                    cardTitle.innerHTML += `${skinName}`;
                    imageLink.setAttribute('href', `https://bitskins.com/?market_hash_name=${skinName}&advanced=1&appid=730&is_stattrak=0&has_stickers=0&is_souvenir=0&show_trade_delayed_items=0&sort_by=price&order=asc`);
                    cardImage.setAttribute('src', skinImage);
                    lowestPriceVal.innerHTML += `$${skinPrice}`;
                    lowestPriceText.innerHTML += "Lowest price: ";
                    buyPriceText.innerHTML += "Buy price: ";
                    buyPriceVal.innerHTML += `$${value.toFixed(2)}`;

                    lowestLi.append(lowestPriceText);
                    lowestLi.append(lowestPriceVal);
                    buyPriceLi.append(buyPriceText);
                    buyPriceLi.append(buyPriceVal);

                    cardFooter.append(ul);
                    cardFooter.append(lowestLi);
                    cardFooter.append(buyPriceLi);

                    imageLink.append(cardImage);
                    cardImageDiv.append(imageLink);
                    cardTitleDiv.append(cardTitle);
                    card.append(cardTitleDiv);
                    card.append(cardImageDiv);
                    card.append(cardFooter);
                    cardList.append(card);

                    fs.writeFile('C:/Users/NEDI/Desktop/Bitskins/views/index.ejs',
                        `${dom.serialize()}`, function (err) {
                            if (err) return console.log(err);
                        });

                    // *********************** CONSOLE.LOG THE ITEMS ***********************
                    // log(`${body.data.items[i].market_hash_name}: $${body.data.items[i].lowest_price} | Buy range: $${value}`);
                    // log("###################################################################################################################");
                    //log("                                                                                                              ");
                }
            }
        }
    } catch (error) {
        log(error);
    }
});

//////////// WEBSOCKET ////////////
var Pusher = require('pusher-client');
var pusher = new Pusher('c0eef4118084f8164bec65e6253bf195', {
    encrypted: true,
    wsPort: 443,
    wssPort: 443,
    host: 'notifier.bitskins.com'
});

pusher.connection.bind('connected', function () {
    log(" -- connected to websocket" + '\n');
});

pusher.connection.bind('disconnected', function () {
    log(" -- disconnected from websocket" + '\n');
});

var events_channel = pusher.subscribe('inventory_changes');

events_channel.bind('listed', function (data) {
    if (data.app_id === "730") {

        for (let [key, value] of Object.entries(skins)) {
            if (data.market_hash_name === key && data.price <= value) {
                log(`${unixTimeToDate(data)} [LISTED] ${data.market_hash_name} is listed for $${data.price}. Buy price: $${value}` + '\n');
            }
        }
    }
});

events_channel.bind('price_changed', function (data) {
    if (data.app_id === "730") {
        for (let [key, value] of Object.entries(skins)) {
            if (data.market_hash_name === key && data.price <= value) {
                client.channels.cache.get('780414429706715168')
                    .send(`${unixTimeToDate(data)} ${data.market_hash_name} price changed to $${data.price}. Buy price: $${value}` + '\n');
                log(`${unixTimeToDate(data)} ${data.market_hash_name} price changed to $${data.price}. Buy price: $${value}` + '\n');
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

Number.prototype.toFixedNoRounding = function (n) {
    const reg = new RegExp("^-?\\d+(?:\\.\\d{0," + n + "})?", "g")
    const a = this.toString().match(reg)[0];
    const dot = a.indexOf(".");
    if (dot === -1) {
        return a + "." + "0".repeat(n);
    }
    const b = n - (a.length - dot) + 1;
    return b > 0 ? (a + "0".repeat(b)) : a;
}

app.set('port', port);
app.listen(port, () => log(`Server is listening on port ${port}` + '\n'));
