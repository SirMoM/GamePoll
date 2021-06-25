const Discord = require("discord.js");
const config = require("./config.json")
const tagRegEx = RegExp("<@&([0-9]*)>")


module.exports = function(message, args) {
    if (args[0] === "--help" || args.length < 2) {
        let gp_help =
            "**usage: !gpk <time> <game_tag>**\n" +
            "\t Creates a message with a game poll and reactions but in a compact form!\n" +
            "\t This will also delete the comment which started the GamePoll ^^\n" +
            "\t The arguments are:\n" +
            `\t\t time\t\t The time when you want to play the game. Examples: 21:00, now\n` +
            `\t\t \t\t\t\t The time can be escaped with "". Example: "Next Week"` +
            `\t\t game_tag\tThe tag that specifies who gehts notified. Examples: ${message.author}\n~\n` +
            "**usage: !gpk --help**\n\tShows the help for the !gpk command\n~";
        return message.channel.send(gp_help);
    } else if (args.length >= 2) {
        let msg_emb = comp_emb(args[0], args[1]);
        message.channel.send(msg_emb).then((sent) => {
            sent.react("✅").then(() => sent.react("🅱️"));
        });
    }
}

let comp_emb = (_time, _game) => {
    let game
    let regExResult = tagRegEx.exec(_game)
    let game_tag = null
    if (regExResult != null) {
        game_tag = regExResult[1]
    }
    for (game_key in config.games) {
        g = config.games[game_key]
        if (g.tag === game_tag) {
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
        .setTitle(game.name + " um " + _time)
        .setDescription(_game)
        .addFields({ name: "✅\tRoster", value: "...", inline: true })
        .addFields({ name: "Backup\t🅱️", value: "...", inline: true })
        .setThumbnail(game.thumbnails[Math.floor(Math.random() * game.thumbnails.length)])
        .setTimestamp()
    );
}