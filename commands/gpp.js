let emb = require('./discord-emb.js')
let past_messages = require("../past_messages.json")

module.exports = function(message, args) {
    if (args[0] === "--help") {
        let gpp_help =
            "**usage: !gpp <time> <game_tag>**\n" +
            "\t Creates a message with a game poll and reactions!\n" +
            "\t This command persists the poll so it can be used after the bot is restarted!\n\n" +
            "\t The arguments are:\n" +
            `\t\t time\t\t\t  The time when you want to play the game. Examples: 21:00, now\n` +
            `\t\t game_tag\tThe tag that specifies who gehts notified. Examples: ${message.author}\n~\n` +
            "**usage: !gpp --help**\n\tShows the help for the !gpp command\n~";
        return message.channel.send(gpp_help);
    } else if (args.length === 2) {
        let msg_emb = emb(args[0], args[1]);
        message.channel.send(msg_emb).then((sent) => {
            sent.react("✅").then(() => sent.react("🅱️"));
            past_messages.push(sent.id)
            let json = JSON.stringify(past_messages)
            var fs = require('fs');
            fs.writeFile("./past_messages.json", json, 'utf8', (callback) => {
                if (callback) throw callback;
            });
        });

    }
}