const emb = require('./discord-emb.js');
const { create_past_messages } = require('../db');


const poems = require('./poem.json');

module.exports = function(message, args) {
    if (args[0] === '--help' || args.length < 2) {
        const gpg_help =
            '**usage: !gpg <time> <game_tag>**\n' +
            '\t Creates a message with a game poll and reactions!\n' +
            '\t This command adds a poem to the poll\n\n' +
            '\t The arguments are:\n' +
            '\t\t time\t\t The time when you want to play the game. Examples: 21:00, now\n' +
            '\t\t \t\t\t\t The time can be escaped with "". Example: "Next Week"' +
            `\t\t game_tag\tThe tag that specifies who gehts notified. Examples: ${message.author}\n~\n` +
            '**usage: !gpg --help**\n\tShows the help for the !gpg command\n~';
        return message.channel.send(gpg_help);
    } else if (args.length >= 2) {
        const msg_emb = emb(args[0], args[1]);
        msg_emb.addField('Gedicht', poems[Math.floor(Math.random() * poems.length)]);
        message.channel.send(msg_emb).then((sent) => {
            sent.react('✅').then(() => sent.react('🅱️'));
            create_past_messages(sent.id, 24);
        });
    }
};