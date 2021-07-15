const emb = require('./discord-emb.js');
const { create_past_messages } = require('../db');


module.exports = function(message, args) {
    if (args[0] === '--help' || args.length < 2) {
        const gp_help =
            '**usage: !gp <time> <game_tag>**\n' +
            '\t Creates a message with a game poll and reactions!\n' +
            '\t The arguments are:\n' +
            '\t\t time\t\t The time when you want to play the game. Examples: 21:00, now\n' +
            '\t\t \t\t\t\t The time can be escaped with "". Example: "Next Week"' +
            `\t\t game_tag\tThe tag that specifies who gehts notified. Examples: ${message.author}\n~\n` +
            '**usage: !gp --help**\n\tShows the help for the !gp command\n~';
        return message.channel.send(gp_help);
    } else if (args.length >= 2) {
        const msg_emb = emb(args[0], args[1]);
        message.channel.send(msg_emb).then((sent) => {
            sent.react('✅').then(() => sent.react('🅱️'));
            create_past_messages(sent.id, 24);
        });
    }
};