const Discord = require("discord.js");
const CommandHandler = require("./commands/command-handler")
const config = require("./commands/config.json")
require("dotenv").config();
const client = new Discord.Client();


const BOT_ID = "795980245400420363"

// Logging in using the token
console.log("Starting Bot: Beep beep! 🤖");
client.login(process.env.TOKEN);
client.on("ready", () => {
    console.log("Logged in!");
    client.user.setActivity("dir zu. Du machst das großartig!", { type: "WATCHING", url: "https://github.com/SirMoM/GamePoll" })
    load_messages()
});


client.on("messageReactionRemove", edit_emb);

client.on("messageReactionAdd", edit_emb);

client.on("message", CommandHandler);

async function edit_emb(reaction, user) {
    // When we receive a reaction we check if the reaction is partial or not
    if (reaction.partial) {
        // If the message this reaction belongs to was removed the fetching might result in an API error, which we need to handle
        try {
            await reaction.fetch();
        } catch (error) {
            console.error("Something went wrong when fetching the message: ", error);
            // Return as `reaction.message.author` may be undefined/null
            return;
        }
    }
    if (
        (reaction.emoji.name === "✅" || reaction.emoji.name === "🅱️") &&
        !(user.id == BOT_ID)
    ) {
        let msg_reactions = reaction.message.reactions

        // Edit message
        let msg_emb = reaction.message.embeds[0];
        // Get index to override fields
        let roster_field_id = -1
        let backup_field_id = -1

        msg_emb.fields.forEach(field => {
            if (field.name === 'Roster') {
                roster_field_id = msg_emb.fields.indexOf(field)
            } else if (field.name === 'Backup') {
                backup_field_id = msg_emb.fields.indexOf(field)
            }

        })

        const [game_tag] = msg_emb.description.split("\n").slice(-1)
        let game = get_game_from_config(game_tag)
        let [roster, backup] = manage_roster(msg_reactions, game)
        console.log("Roster: " + roster)
        console.log("Backup " + backup)
        msg_emb.fields[roster_field_id] = { name: "Roster", value: roster, inline: true }
        msg_emb.fields[backup_field_id] = { name: "Backup", value: backup, inline: true }
        reaction.message.edit(msg_emb);
    }
}

function manage_roster(msg_reactions, game) {
    let roster = ""
    let backup = ""
    let count = 0
    msg_reactions.cache.get("✅").users.cache.forEach(item => {
        if (item.id != BOT_ID) {
            let addToBackup = game["roster-size"] >= 0 && count >= game["roster-size"]
            console.log("Roster size " + game["roster-size"] + " players " + count + " will be added to backup " + addToBackup)
            if (addToBackup) {
                backup += "<@" + item.id + ">\n";
            } else {
                roster += "<@" + item.id + ">\n";
            }
            count++
        }
    })

    msg_reactions.cache.get("🅱️").users.cache.forEach(item => {
        if (item.id != BOT_ID) {
            backup += "<@" + item.id + ">\n";
        }
    })

    if (roster.length === 0) {
        roster += "...";
    }
    if (backup.length === 0) {
        backup += "...";
    }

    return [roster, backup];
}


// load past messages and add the reaction listeners
async function load_messages() {
    past_messages = require("./past_messages.json")

    for (msg_idx in past_messages) {
        const ID = past_messages[msg_idx]
        client.channels.fetch(process.env.CHANNELID)
        let channel = client.channels.cache.get(process.env.CHANNELID);

        // Get messages
        channel.messages.fetch(ID)
            .then(msg => {
                msg.client.on("messageReactionAdd", edit_emb);
                msg.client.on("messageReactionRemove", edit_emb);
            })
            .catch(console.error);
        console.log("Added message: " + ID + " from file!")
    }
}
// Keep the bot alive with uptimerbot pinging the / endpoint every so often!
const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
    res.send('Hello World!')
})
app.get('/config', (req, res) => {
    res.send(require("./commands/config.json"))
})
app.get('/past_messages', (req, res) => {
    res.send(require("./past_messages.json"))
})

app.post('/past_messages/:msgId', (req, res) => {
    let msgId = req.params["msgId"]

    past_messages.push(msgId)

    let json = JSON.stringify(past_messages)
    var fs = require('fs');
    fs.writeFile("./past_messages.json", json, 'utf8', (callback) => {
        if (callback) throw callback;
    });

    res.send("Added " + msgId + " msgId");
    load_messages()
});

app.delete('/past_messages/:msgId', (req, res) => {
    let msgId = req.params["msgId"];

    past_messages.splice(past_messages.indexOf(msgId), 1);

    let json = JSON.stringify(past_messages);
    var fs = require('fs');
    fs.writeFile("./past_messages.json", json, 'utf8', (callback) => {
        if (callback) throw callback;
    });

    res.send("Delete " + msgId + " msgId");
    load_messages()
})

app.listen(process.env.PORT || port, () => {
    console.log(`Bot listening at ${port}`)
})

function get_game_from_config(game_tag) {
    let game
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
    return game
}