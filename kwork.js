const fs = require("fs");
const path = require("path");
require("dotenv").config(path.join(__dirname, ".env"))
const { Telegraf } = require("telegraf")
const bot = new Telegraf(process.env.botToken)
const chatIdToSendMessage = 1386450473;
const username = "Jmail"
const fetch = require("node-fetch");
const cheerio = require("cheerio");

setInterval(async() => {
    var orders = await getOrders()
    var last12OrdersId = JSON.parse(fs.readFileSync(path.join(__dirname, "last12OrdersId.json"), "utf-8"))
    var ordersToCheck = orders.filter(order => !last12OrdersId.includes(order.id))
    fs.writeFileSync(path.join(__dirname, "last12OrdersId.json"), JSON.stringify(orders.map(order => order.id), null, 4), "utf-8")
    if(ordersToCheck.length == 0) return
    var interestingOrders = getInterestingOrders(ordersToCheck)
    await sendOrders(interestingOrders)
}, 1000 * 60 * 2);

async function getOrders() {
    try {
        const response = await fetch("https://kwork.ru/projects", {
            method: "GET",
            headers: {
                Cookie: "slrememberme=11643806_%242y%2410%24dVYxpsF72NF2ixt51G%2Fjtuf20OS11ANN2a7uuuFVo%2Fqe2B4aUJo%2FK"
            }
        });

        const html = await response.text();
        if(!html.includes(username)) return console.log(`Не получилось авторизоваться как ${username}`)

        const $ = cheerio.load(html);

        const scriptTag = $(`script:contains("wants")`);
        const scriptContent = scriptTag.html();
        const wantsArraySubstring = scriptContent.split(`"wants":`)[1];

        const wantsArraySubstringFull = extractWantsArraySubstring(wantsArraySubstring);
        const wantsArray = JSON.parse(wantsArraySubstringFull);
        return wantsArray
    } 
    catch (error) {
        console.error("Ошибка при выполнении запроса:", error);
    }
}

function extractWantsArraySubstring(content) {
    let bracketCount = 0;
    let endIndex = 0;

    for (let i = 0; i < content.length; i++) {
        if (content[i] === "[") bracketCount++;
        else if (content[i] === "]") {
            bracketCount--;
            if (bracketCount != 0) continue
            endIndex = i;
            break;
        }
    }
    return content.slice(0, endIndex + 1);
}

function getInterestingOrders(orders) {
    orders.map(order => order.text = `${order.name}\n${order.description}`.toLowerCase())
    var keywords = ["бот", "bot", "telegram", "телеграм", "vpn", "впн", "node", "нода", "js", "javascript", "java script", "бекенд", "бэкэнд", "бэкенд", "бекэнд", "back-end", "backend", "webhook", "вебхук", "вэбхук", "мойсклад", "moysklad", "мой склад", "moy sklad", "sheets", "таблиц"]
    
    const interestingOrders = []

    for(var order of orders) {
        order.keywords = []
        if(keywords.some(keyword => {
            var isInteresting = order.text.split(/\s+/).some(word => word.trim() == keyword)
            if(isInteresting) order.keywords.push(keyword)
            return isInteresting
        })) interestingOrders.push(order)
    }

    console.log(interestingOrders)
    return interestingOrders
}

async function sendOrders(orders) {
    for (var order of orders) {
        var text = `<b>Название</b>: ${order.name}\n<b>Описание</b>: ${order.description}\n<b>Желаемый бюджет</b>: ${order.priceLimit.substring(0, order.priceLimit.length - 3)}\n<b>Допустимый бюджет</b>: ${order.possiblePriceLimit}\n\n<a href="https://kwork.ru${order.url}/view">Ссылка</a>`
        bot.telegram.sendMessage(chatIdToSendMessage, text, {parse_mode: "HTML", reply_markup: {inline_keyboard: [[{text: "Удалить", callback_data: "deleteMessage"}]]}})
    }
}

bot.action("deleteMessage", ctx => {
    ctx.deleteMessage(ctx.callbackQuery.inline_message_id)
})

bot.launch()