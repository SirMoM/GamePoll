const Discord = require("discord.js");
const config = require("./config.json")
const poems = require("./poem.json")

function emb(_time, _game) {
    let game

    for (game_key in config.games) {
        g = config.games[game_key]
        if (g.tag === _game) {
            game = g
            break;
        }
    }
    if (!game) {
        game = config["default-emb"]
    }
    return (
        new Discord.MessageEmbed()
        .setColor(game.color)
        .setTitle(config["generic-game-poll"].title)
        .setDescription(
            config["generic-game-poll"]["time-text"].replace("{time}", _time) +
            "\n\n" +
            config["generic-game-poll"]["additional-text"] +
            "\n\n" +
            _game
        )
        .addField("Emojis", config["generic-game-poll"]["explain-emojis"] + "\n")
        .addField("Gedicht", poems[Math.floor(Math.random() * poems.length)])
        .setTimestamp()
        .setThumbnail(game.thumbnails[Math.floor(Math.random() * game.thumbnails.length)])
    );
}

module.exports = function(message, args) {
    if (args[0] === "--help") {
        let gpg_help =
            "**usage: !gpg <time> <game_tag>**\n" +
            "\t Creates a message with a game poll and reactions!\n" +
            "\t This command adds a poem to the poll\n\n" +
            "\t The arguments are:\n" +
            `\t\t time\t\t\t  The time when you want to play the game. Examples: 21:00, now\n` +
            `\t\t game_tag\tThe tag that specifies who gehts notified. Examples: ${message.author}\n~\n` +
            "**usage: !gpg --help**\n\tShows the help for the !gpg command\n~";
        return message.channel.send(gpg_help);
    } else if (args.length === 2) {
        let msg_emb = emb(args[0], args[1]);
        message.channel.send(msg_emb).then((sent) => {
            sent.react("✅").then(() => sent.react("🅱️"));
        });
    }
}