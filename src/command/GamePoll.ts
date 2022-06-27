/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-misused-promises */
import { BaseCommandInteraction, Client, EmbedField, MessageActionRow, MessageButton, MessageEmbed, MessageMentions, Role, User } from "discord.js";
import { GameConfig, gamesConfig, getGameConfigFromTag } from "../config/GamesConfig";
import * as poemJson from "../config/poem.json";
import { logger as LOG } from "../logging/Logger";
import { Command } from "./Command";

const poems: string[] = poemJson;

const fakeRoster = "Ｂａｃｋｕｐ";

const imInText = "Bin dabei";

export const imInButtonCustomId = "imIn";
export const backupButtonCustomId = "backup";

const opPoem = "poem";
const opShort = "short";
const opBackupOnly = "backup-only";
// const opPersistence = "persistence";

export const GamePoll: Command = {
    name: "gp",
    description: "Starts a game poll",
    type: "CHAT_INPUT",
    options: [
        {
            type: "STRING",
            name: "time",
            description: "The time you want to play",
            required: true,
            autocomplete: true
        },
        {
            type: "ROLE",
            name: "role",
            description: "The role to ping",
            required: true
        },
        {
            type: "BOOLEAN",
            name: opPoem,
            description: "Print a poem message with your poll (default: false)",
            required: false
        },
        {
            type: "BOOLEAN",
            name: opShort,
            description: "Use the compact from of the poll (default: false)",
            required: false
        },
        {
            type: "BOOLEAN",
            name: opBackupOnly,
            description: "Use the backup-only from of the poll (default: false)",
            required: false
        }
        // {
        //     type: "NUMBER",
        //     name: opPersistence,
        //     description:
        //         "How many hours this poll will be active (default: 24h)",
        //     required: false,
        // },
    ],

    run: async (client: Client, interaction: BaseCommandInteraction) => {
        // Option parsing
        const role = interaction.options.get("role", true).role!;
        const time = interaction.options.get("time", true).value!.toString();

        // If we dont get a role return // FIXME: Error handling
        if (!(role instanceof Role)) return;

        const poem: boolean = (interaction.options.get(opPoem)?.value ?? false) as boolean;
        const short: boolean = (interaction.options.get(opShort)?.value ?? false) as boolean;
        const backupOnly: boolean = (interaction.options.get(opBackupOnly)?.value ?? false) as boolean;

        const len = Object.keys(poems).length;

        LOG.info(`Role: ${role.name} Time: ${time} Poem: ${poem.toString()} ${len} Short ${short.toString()} BackupOnly: ${backupOnly.toString()}`);

        let content = `${role.toString()} um ${time.toLocaleString()}!`;

        if (poem) {
            content += "\n\n";
            content += poems[Math.floor(Math.random() * len)];
        }

        const embed: MessageEmbed = createDiscordEmbed(
            time,
            role,
            short,
            backupOnly
        );
        const buttons = createRosterAndBackupButtons(backupOnly);
        await interaction.followUp({
            ephemeral: false,
            content: content,
            embeds: [embed],
            components: [buttons]
        });
    }
};

function createRosterAndBackupButtons(backupOnly: boolean): MessageActionRow {
    return new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId(imInButtonCustomId)
                .setLabel(backupOnly ? fakeRoster : imInText) // Very elegant but not so easy to read
                .setStyle("SUCCESS")
        )
        .addComponents(
            new MessageButton()
                .setCustomId(backupButtonCustomId)
                .setLabel("Ich weiß nicht (Backup)")
                .setStyle("SECONDARY")
        );
}

function createDiscordEmbed(
    time: string,
    role: Role,
    short: boolean,
    backupOnly: boolean
): MessageEmbed {
    const gameConfig: GameConfig = getGameConfigFromTag(role.id);

    const messageEmbed = new MessageEmbed()
        .setColor(gameConfig.color as HexColorString)
        .setTitle(gamesConfig.generalConfig.title)
        .setTimestamp()
        .setThumbnail(
            gameConfig.thumbnails[
                Math.floor(Math.random() * gameConfig.thumbnails.length)
                ]
        );

    if (!backupOnly) {
        messageEmbed.addFields({ name: "Roster", value: "...", inline: true });
    } else {
        messageEmbed.addFields({
            name: fakeRoster,
            value: "...",
            inline: true
        });
    }

    messageEmbed.addFields({ name: "Backup", value: "...", inline: true });

    // Only add description for not short Messages
    if (!short) {
        messageEmbed.setDescription(createDiscordEmbedDiscription(time, role));
    }

    return messageEmbed;
}

function createDiscordEmbedDiscription(time: string, role: Role): string {
    return `${gamesConfig.generalConfig.timeText.replace("{time}", time)}
    \n
    ${gamesConfig.generalConfig.additionalText}
    \n
    ${role.toString()}`;
}

export function manageRoster(
    customId: string,
    user: User,
    fields: EmbedField[],
    game: GameConfig
): EmbedField[] {
    LOG.info(`Managing roster: ${user.username} ${customId}`);

    const rosterField = fields.find(
        (it) => it.name === "Roster" || it.name === fakeRoster
    )!;
    const backupField = fields.find((it) => it.name === "Backup")!;

    const roster: string[] = parseListOfPlayers(rosterField.value);
    const backup: string[] = parseListOfPlayers(backupField.value);

    LOG.info(`Loaded roster ${JSON.stringify(roster)}`);
    LOG.info(`Loaded backup ${JSON.stringify(backup)}`);

    let addTooBackup = false;
    if (customId == imInButtonCustomId) {
        const indexOfUser = roster.indexOf(user.toString());
        if (indexOfUser !== -1) {
            roster.splice(indexOfUser, 1);
        } else {
            if (game.rosterSize === -1 || game.rosterSize > roster.length) {
                roster.push(user.toString());
            } else {
                addTooBackup = true;
            }
        }
    }

    if (customId == backupButtonCustomId || addTooBackup) {
        const indexOfUser = backup.indexOf(user.toString());
        if (indexOfUser !== -1) {
            backup.splice(indexOfUser, 1);
        } else {
            backup.push(user.toString());
        }
    }

    LOG.info(`Modified roster ${JSON.stringify(roster)}`);
    LOG.info(`Modified backup ${JSON.stringify(backup)}`);

    const rosterEmbedField: EmbedField = {
        name: rosterField.name == fakeRoster ? fakeRoster : "Roster",
        value: writeListOfPlayers(roster),
        inline: true
    };

    const backupEmbedField: EmbedField = {
        name: "Backup",
        value: writeListOfPlayers(backup),
        inline: true
    };
    return [rosterEmbedField, backupEmbedField];
}

function writeListOfPlayers(players: string[]): string {
    if (players.length > 0) {
        return players.join("\n");
    } else {
        return "...";
    }
}

function parseListOfPlayers(value: string): string[] {
    if (value === "...") return [];
    return value.split("\n");
}
