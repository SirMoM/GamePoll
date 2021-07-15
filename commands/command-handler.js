const prefix = '!';

const gp = require('./gp.js');
const gpp = require('./gpp.js');
const gpg = require('./gpg.js');
const gpk = require('./gpk.js');

const commands = { gp, gpp, gpg, gpk };

module.exports = async function(message) {
    const serverID = process.env.SERVERID;
    const channelID = process.env.CHANNELID;

    const isBot = message.author.bot == true;
    const isDM = message.guild === null;
    const isServerAndChannel = () => {
        return message.guild.id === serverID && message.channel.id === channelID;
    };

    if (!isBot && (isDM || isServerAndChannel)) {
        const msgContent = message.content;
        let tokens;
        if (!msgContent.match('".*"')) {
            tokens = msgContent.split(' ');
        } else {
            tokens = generateTokens(msgContent);
            if (!tokens) {
                console.log('Could not parse msg');
                return;
            }
        }

        let command = tokens.shift();
        if (command.charAt(0) === prefix) {
            command = command.substring(1);
            console.log('Command: ' + command);
            console.log('Args: ' + tokens);

            if (commands.hasOwnProperty(command)) {
                if (command === 'gpk' && !isDM) {
                    message.delete().catch(console.error);
                }
                commands[command](message, tokens);
            } else if (command === 'gphelp') {
                for (const func_idx in commands) {
                    commands[func_idx](message, ['--help']);
                }
            } else {
                console.log('Command not found');
            }
        }
    }
};

function generateTokens(msgContent) {
    const regex = RegExp('^(!\\w+) (".*"|\\w) (.+)$', 'i');

    const matches = msgContent.match(regex);
    if (!matches) {
        return null;
    }
    console.log('Regex result ' + matches);
    // remove input
    matches.shift();
    const tokens = [];
    // Replace "" for nicer output
    matches.forEach((element) => {
        tokens.push(element.replaceAll('"', ''));
    });

    return tokens;
}