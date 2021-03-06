require('dotenv').config();
const db = require('./db');

// =============== Gracefull shutdown ======================
// so the program will not close instantly
process.stdin.resume();

function exitHandler(options, exitCode) {
    db.close();
    if (options.cleanup) console.log('clean');
    if (exitCode || exitCode === 0) console.log(exitCode);
    if (options.exit) process.exit();
}

// do something when app is closing
process.on('exit', exitHandler.bind(null, { cleanup: true }));

// catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, { exit: true }));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));

// catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, { exit: true }));

// =============== Gracefull shutdown ======================


// ===============   Discord config   ======================
const Discord = require('discord.js');
const CommandHandler = require('./commands/command-handler');

const config = require('./commands/config.json');

const client = new Discord.Client();
const BOT_ID = '795980245400420363';


// ===============   Discord login   ======================
// Logging in using the token
console.log('Starting Bot: Beep beep! 🤖');
client.login(process.env.TOKEN);
client.on('ready', () => {
    console.log('Logged in!');
    client.user.setActivity('dir zu. Du machst das großartig!', { type: 'WATCHING', url: 'https://github.com/SirMoM/GamePoll' });
    load_messages();
});

// =============== Discord bindings ======================

client.on('messageReactionRemove', edit_emb);

client.on('messageReactionAdd', edit_emb);

client.on('message', CommandHandler);


// =============== Functions ======================
async function edit_emb(reaction, user) {
    // When we receive a reaction we check if the reaction is partial or not
    if (reaction.partial) {
        // If the message this reaction belongs to was removed the fetching might result in an API error, which we need to handle
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Something went wrong when fetching the message: ', error);
            // Return as `reaction.message.author` may be undefined/null
            return;
        }
    }
    if (
        (reaction.emoji.name === '✅' || reaction.emoji.name === '🅱️') &&
        !(user.id == BOT_ID)
    ) {
        const msg_reactions = reaction.message.reactions;

        // Edit message
        const msg_emb = reaction.message.embeds[0];
        // Get index to override fields
        let roster_field_id = -1;
        let backup_field_id = -1;

        msg_emb.fields.forEach(field => {
            if (field.name.includes('Roster')) {
                roster_field_id = msg_emb.fields.indexOf(field);
            } else if (field.name.includes('Backup')) {
                backup_field_id = msg_emb.fields.indexOf(field);
            }

        });

        const [game_tag] = msg_emb.description.split('\n').slice(-1);
        const game = get_game_from_config(game_tag);
        const [roster, backup, troll] = await manage_roster(msg_reactions, game);
        console.log('Roster: ' + roster);
        console.log('Backup ' + backup);
        msg_emb.fields[roster_field_id] = { name: 'Roster', value: roster, inline: true };
        msg_emb.fields[backup_field_id] = { name: 'Backup', value: backup, inline: true };
        msg_emb.setFooter('');
        if (troll != null) {
            const troll_user = await user.client.users.fetch(troll).catch(console.error);
            msg_emb.setFooter(troll_user.username + ' ist ein Arsch!');
        }
        reaction.message.edit(msg_emb);
    }
}

// load past messages and add the reaction listeners
async function load_messages() {
    const game_tag_regex = RegExp('<@&(\\d+)>', 'i');
    const past_messages = await db.get_past_messages();
    for (const msg_idx in past_messages) {
        const ID = past_messages[msg_idx].messageid;
        const channel = await client.channels.fetch(process.env.CHANNELID, true);
        const message = await channel.messages.fetch(ID);
        if (message !== null && typeof message == 'object') {
            message.client.on('messageReactionAdd', edit_emb);
            message.client.on('messageReactionRemove', edit_emb);
            const game_tag = message.embeds[0].description.match(game_tag_regex)[1];
            manage_roster(message.reactions, get_game_from_config(game_tag));
        }
        console.log('Added message: ' + ID + ' from file!');
    }
}
async function manage_roster(msg_reactions, game) {
    let roster = '';
    let backup = '';
    let troll = null;
    let count = 0;
    const users_roster = await msg_reactions.resolve('✅').users.fetch();
    users_roster.forEach(item => {
        if (item.id != BOT_ID) {
            const addToBackup = game['roster-size'] >= 0 && count >= game['roster-size'];
            console.log('Roster size ' + game['roster-size'] + ' players ' + count + ' will be added to backup ' + addToBackup);
            if (addToBackup) {
                backup += '<@' + item.id + '>\n';
                troll = item.id;
            } else {
                roster += '<@' + item.id + '>\n';
            }
            count++;
        }
    });

    const users_backup = await msg_reactions.resolve('🅱️').users.fetch();
    users_backup.forEach(item => {
        if (item.id != BOT_ID) {
            backup += '<@' + item.id + '>\n';
            troll = item.id;
        }
    });

    if (roster.length === 0) {
        roster += '...';
    }
    if (backup.length === 0) {
        backup += '...';
    }

    return [roster, backup, troll];
}

function get_game_from_config(game_tag) {
    let game;
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

// =============== REST-ENTPOINTS ======================

// Keep the bot alive with uptimerbot pinging the / endpoint every so often!
const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
    res.send('Hello World!');
});
app.get('/config', (req, res) => {
    res.send(require('./commands/config.json'));
});
app.get('/past_messages', (req, res) => {
    res.send(require('./past_messages.json'));
});

app.post('/past_messages/:msgId', (req, res) => {
    const msgId = req.params['msgId'];
    db.create_past_messages(msgId, 24).then(
        load_messages(),
    );
});

app.get('/load_msg', (req, res) => {
    load_messages();
    res.send('Messages loaded');
});

app.listen(process.env.PORT || port, () => {
    console.log(`Bot listening at ${port}`);
});