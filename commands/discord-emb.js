const Discord = require('discord.js');
const config = require('./config.json');
const tagRegEx = RegExp('<@&([0-9]*)>');

class Emb {
    constructor(_time, _game) {
        this.game_tag = _game;
        this.game = this.get_game_config_from(_game);
        this.time = _time;
    }

    createDiscordEmb() {
        return new Discord.MessageEmbed()
            .setColor(this.game.color)
            .setTitle(config['generic-game-poll'].title)
            .setDescription(config['generic-game-poll']['time-text'].replace('{time}', this.time) + '\n\n' +
                config['generic-game-poll']['additional-text'] + '\n\n' + this.game_tag)
            .addField('Emojis', config['generic-game-poll']['explain-emojis'] + '\n')
            .addFields({ name: 'Roster', value: '...', inline: true })
            .addFields({ name: 'Backup', value: '...', inline: true })
            .setTimestamp()
            .setThumbnail(this.game.thumbnails[Math.floor(Math.random() * this.game.thumbnails.length)]);
    }

    // This should be private but js is wierd ....
    get_game_config_from(game_string) {
        let game;
        const regExResult = tagRegEx.exec(game_string);

        let game_tag = null;
        if (regExResult != null) {
            game_tag = regExResult[1];
        }

        for (const game_key in config.games) {
            const g = config.games[game_key];
            if (g.tag === game_tag) {
                game = g;
                break;
            }
        }
        if (!game) {
            game = config['default-emb'];
        }
        return game;
    }
}

module.exports = function emb(_time, _game) {
    let game;
    const regExResult = tagRegEx.exec(_game);
    let game_tag = null;
    if (regExResult != null) {
        game_tag = regExResult[1];
    }
    for (const game_key in config.games) {
        const g = config.games[game_key];
        if (g.tag === game_tag) {
            game = g;
            break;
        }
    }
    if (!game) {
        game = config['default-emb'];
    }
    return (
        new Discord.MessageEmbed()
            .setColor(game.color)
            .setTitle(config['generic-game-poll'].title)
            .setDescription(
                config['generic-game-poll']['time-text'].replace('{time}', _time) +
            '\n\n' +
            config['generic-game-poll']['additional-text'] +
            '\n\n' +
            _game,
            )
            .addField('Emojis', config['generic-game-poll']['explain-emojis'] + '\n')
            .addFields({ name: 'Roster', value: '...', inline: true })
            .addFields({ name: 'Backup', value: '...', inline: true })
            .setTimestamp()
            .setThumbnail(game.thumbnails[Math.floor(Math.random() * game.thumbnails.length)])
    );
};