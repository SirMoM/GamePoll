const Discord = require("discord.js");
const client = new Discord.Client();

require("dotenv").config();

const serverID = process.env.SERVERID;
const channelID = process.env.CHANNELID;

console.log("Beep beep! 🤖");
client.login(process.env.TOKEN);
client.on("ready", readyDiscord);

const prefix = "!";

let msg_ids = [];

function readyDiscord() {
    console.log("Logged in!");
}

client.on("message", gotMessage);

function emb(_time, _game) {
    return (
        new Discord.MessageEmbed()
        .setColor("#5599ff")
        .setTitle("CS:GO")
        .setDescription(
            "So " +
            _time +
            " ist der Call meine Freunde!\n\n" +
            "**Bitte reagiert mit einem Emoji sonst kann es sein, dass ihr nicht mitmachen könnt, da ggf. sonst kein Platz mehr frei ist**\n" +
            _game
        )
        .addField("Emojis", "✅ = bin dabei!\n🅱️ = ich weiß nicht (Backup)!\n")
        .setTimestamp()
        // .setThumbnail(
        //   "https://media.steampowered.com/apps/csgo/blog/images/fb_image.png"
        // )
        .setThumbnail(
            "https://cdn-images.win.gg/resize/w/932/h/420/format/jpg/type/progressive/fit/cover/path/news/c34a7191f6e9948068b83e7179ea3da8/4938da24cbb9028a008390afb863ff89/original.jpg"
        )
    );
}

const filter = (reaction, user) => {
    return (
        (reaction.emoji.name === "✅" || reaction.emoji.name === "🅱️") &&
        !(user.id == 795980245400420363)
    );
};

function gotMessage(message) {
    if (message.guild.id === serverID && message.channel.id === channelID) {
        if (message.content.startsWith(`${prefix}gp`)) {
            // Parsing command
            const args = message.content.slice(prefix.length).trim().split(/ +/);
            const command = args.shift().toLowerCase();
            console.log(command);
            console.log(args);

            if (!args.length) {
                return message.channel.send(
                    `Du hast keine Argumente angegeben, ${message.author}!\nFür mehr Informationen: !gp help`
                );
            } else if (args[0] === "help") {
                return message.channel.send("!gb <time> <game>");
            } else if (args.length === 2) {
                let msg_emb = emb(args[0], args[1]);
                message.channel.send(msg_emb).then((sent) => {
                    msg_ids.push(sent.id);
                    sent.react("✅").then(() => sent.react("🅱️"));
                });
            }
        }
    }
}
client.on("messageReactionRemove", async(reaction, user) => {
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

    let msg_id = reaction.message.id;
    if (
        (reaction.emoji.name === "✅" || reaction.emoji.name === "🅱️") &&
        !(user.id == 795980245400420363)
    ) {
        // # roster / backup manipulation
        if (reaction.emoji.name === "🅱️") {
            manage_backup(msg_id, user.id, true);
        }
        if (reaction.emoji.name === "✅") {
            manage_roster(msg_id, user.id, true);
        }

        // Edit message
        let msg_emb = reaction.message.embeds[0];

        if (msg_emb.fields.length > 1) {
            msg_emb.fields.splice(1, 2);
        }

        msg_emb.addFields({ name: "Roster", value: get_roster(msg_id), inline: true }, { name: "Backup", value: get_backup(msg_id), inline: true });
        reaction.message.edit(msg_emb);
    }
});

client.on("messageReactionAdd", async(reaction, user) => {
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
        !(user.id == 795980245400420363)
    ) {
        // # roster / backup manipulation
        let msg_id = reaction.message.id;
        if (!rosters.has(msg_ids)) {
            rosters.set(msg_id, []);
            backups.set(msg_id, []);
        }

        if (reaction.emoji.name === "🅱️") {
            manage_backup(msg_id, user.id);
        }
        if (reaction.emoji.name === "✅") {
            manage_roster(msg_id, user.id);
        }

        // Edit message
        let msg_emb = reaction.message.embeds[0];

        if (msg_emb.fields.length > 1) {
            msg_emb.fields.splice(1, 2);
        }

        msg_emb.addFields({ name: "Roster", value: get_roster(msg_id), inline: true }, { name: "Backup", value: get_backup(msg_id), inline: true });
        reaction.message.edit(msg_emb);
    }
});

let rosters = new Map();
let backups = new Map();

function manage_roster(msg_id, user_id, del = false) {
    let roster = rosters.get(msg_id);
    if (del) {
        const index = roster.indexOf(user_id);
        if (index > -1) {
            roster.splice(index, 1);
            return;
        }
    }

    if (undefined === roster.find((element) => element === user_id)) {
        if (roster.length >= 5) {
            manage_backup(msg_id, user_id);
            return;
        }
        roster.push(user_id);
        console.log("User added to roster " + msg_id + ": " + user_id);
    }
}

function manage_backup(msg_id, user_id, del = false) {
    let backup = backups.get(msg_id);

    if (del) {
        const index = backup.indexOf(user_id);
        if (index > -1) {
            backup.splice(index, 1);
            return;
        }
    }

    if (undefined === backup.find((element) => element === user_id)) {
        backup.push(user_id);
        console.log("User added to backup " + msg_id + ": " + user_id);
    }
}

function get_roster(msg_id) {
    let result = "";
    let roster = rosters.get(msg_id);
    roster.forEach((player) => {
        result += "<@" + player + ">\n";
    });
    if (result.length === 0) {
        result += "...";
    }
    return result;
}

function get_backup(msg_id) {
    let result = "";
    let backup = backups.get(msg_id);
    backup.forEach((player) => {
        result += "<@" + player + ">\n";
    });
    if (result.length === 0) {
        result += "...";
    }
    return result;
}