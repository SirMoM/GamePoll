const Discord = require("discord.js");
const client = new Discord.Client();
const BOT_ID = "795980245400420363"
require("dotenv").config();

const serverID = process.env.SERVERID;
const channelID = process.env.CHANNELID;

console.log("Beep beep! 🤖");
client.login(process.env.TOKEN);
client.on("ready", readyDiscord);

const prefix = "!";

const thumbnails = ["https://media.steampowered.com/apps/csgo/blog/images/fb_image.png", "https://cdn-images.win.gg/resize/w/932/h/420/format/jpg/type/progressive/fit/cover/path/news/c34a7191f6e9948068b83e7179ea3da8/4938da24cbb9028a008390afb863ff89/original.jpg"]

function readyDiscord() {
    console.log("Logged in!");
}

client.on("messageReactionRemove", edit_emb);

client.on("messageReactionAdd", edit_emb);

client.on("message", gotMessage);

function gotMessage(message) {
    if (message.guild.id === serverID && message.channel.id === channelID) {
        if (message.content.startsWith(`${prefix}gp`)) {
            // Parsing command
            const args = message.content.slice(prefix.length).trim().split(/ +/);
            const command = args.shift().toLowerCase();

            if (!args.length) {
                message.channel.send(
                    `Du hast keine Argumente angegeben, ${message.author}!\nFür mehr Informationen: !gp --help`
                );
                return message.channel.send("!gp <time> <game_tag>");
            } else if (args[0] === "--help") {
                let gp_help = "usage: !gp <time> <game_tag>\n" +
                    "\t The arguments are:\n" +
                    `\t\t <time>\t\t\t  The time when you want to play the game. Examples: 21:00, now\n` +
                    `\t\t <game_tag>\tThe tag that specifies who gehts notified. Examples: ${message.author}\n\n` +
                    "\t This help can be shown with !gp --help";
                return message.channel.send(gp_help);
            } else if (args.length === 2) {
                let msg_emb = emb(args[0], args[1]);
                message.channel.send(msg_emb).then((sent) => {
                    sent.react("✅").then(() => sent.react("🅱️"));
                });
            }
        }
    }
}

function emb(_time, _game) {
    return (
        new Discord.MessageEmbed()
        .setColor("#5599ff")
        .setTitle(_game)
        .setDescription(
            "So " +
            _time +
            " ist der Call meine Freunde!\n\n" +
            "**Bitte reagiert mit einem Emoji sonst kann es sein, dass ihr nicht mitmachen könnt, da ggf. sonst kein Platz mehr frei ist**\n"
            //+ _game
        )
        .addField("Emojis", "✅ = bin dabei!\n🅱️ = ich weiß nicht (Backup)!\n")
        .setTimestamp()
        .setThumbnail(thumbnails[Math.random() * thumbnails.length])
    );
}

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
        // Remove Fields if neccesary
        if (msg_emb.fields.length > 1) {
            msg_emb.fields.splice(1, 2);
        }

        let [roster, backup] = manage_roster(msg_reactions)
        msg_emb.addFields({ name: "Roster", value: roster, inline: true }, { name: "Backup", value: backup, inline: true });
        reaction.message.edit(msg_emb);
    }
}

function manage_roster(msg_reactions) {
    let roster = ""
    let backup = ""
    let count = 0

    msg_reactions.cache.get("✅").users.cache.forEach(item => {
        if (item.id != BOT_ID) {
            roster += "<@" + item.id + ">\n";
            count++
            if (count >= 5) {
                backup += "<@" + item.id + ">\n";
            }
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

const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(process.env.PORT || port, () => {
    console.log(`Example app listening at ${port}`)
})