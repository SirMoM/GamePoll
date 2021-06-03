const prefix = "!";

const gp = require('./gp.js');
const gpp = require('./gpp.js');
const gpg = require('./gpg.js');


const commands = { gp, gpp, gpg };

module.exports = async function(message) {
    const serverID = process.env.SERVERID;
    const channelID = process.env.CHANNELID;

    if (message.guild === null || (message.guild.id === serverID && message.channel.id === channelID)) {
        let msgContent = message.content
        let tokens
        if (!msgContent.match('".*"')) {
            tokens = msgContent.split(' ');
        } else {
            tokens = generateTokens(msgContent)
        }

        let command = tokens.shift();
        if (command.charAt(0) === prefix) {
            command = command.substring(1);
            console.log("Command: " + command)
            console.log("Args: " + tokens)

            if (commands.hasOwnProperty(command)) {
                commands[command](message, tokens);
            } else if (command === "gphelp") {
                for (func_idx in commands) {
                    commands[func_idx](message, ["--help"])
                }
            } else {
                console.log("Command not found")
            }

        }
    }
}

function generateTokens(msgContent) {
    let regex = RegExp("(!\\w+) (\".*\"|\\w) (.+)", "i")

    let matches = msgContent.match(regex)
    console.log("Regex result " + matches)
    matches.shift() // remove input
    let tokens = []
    matches.forEach(element => { // Replace "" for nicer output
        tokens.push(element.replaceAll("\"", ""))
    });

    return tokens
}