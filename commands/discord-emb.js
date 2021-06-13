const Discord = require("discord.js");
const config = require("./config.json")
const tagRegEx = RegExp("<@&([0-9]*)>")

module.exports = function emb(_time, _game) {
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
        .setTitle(config["generic-game-poll"].title)
        .setDescription(
            config["generic-game-poll"]["time-text"].replace("{time}", _time) +
            "\n\n" +
            config["generic-game-poll"]["additional-text"] +
            "\n\n" +
            _game
        )
        .addField("Emojis", config["generic-game-poll"]["explain-emojis"] + "\n")
        .addFields({ name: "Roster", value: "...", inline: true })
        .addFields({ name: "Backup", value: "...", inline: true })
        .setTimestamp()
        .setThumbnail(game.thumbnails[Math.floor(Math.random() * game.thumbnails.length)])
    );
}