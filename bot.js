const path = require("path");
require("dotenv").config(path.join(__dirname, ".env"))
const { Telegraf } = require("telegraf")
const bot = new Telegraf(process.env.botToken)
const kwork = require('kwork-api');
const kw = new kwork(process.env.kworkLogin, process.env.kworkPassword, process.env.kworkLast4NumbersOfPhone);
const chatIdToSendMessage = 1386450473

kw.onNewProject.subscribe((project) => {
    console.log(project);
    const keywoards = ["bot", "бот", "telegram", "телеграм", "tg", "тг", "webhook", "вебхук", "vpn", "впн", "мойсклад", "moysklad", "мой склад", "moy sklad", "node js", "nodejs"]
    const titleAndDescription = project.title.toLowerCase() + "\n" + project.description.toLowerCase()
    if(keywoards.some(keywoard => titleAndDescription.includes(keywoard))) return bot.telegram.sendMessage(chatIdToSendMessage, `Название: ${project.title}\n\nЖелаемый бюджет: ${project.price}\nДопустимый бюджет: ${project.possible_price_limit}\n\nОписание: ${project.description}`)
    return
});

bot.launch()