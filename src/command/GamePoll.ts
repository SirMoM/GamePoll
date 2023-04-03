/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-misused-promises */
import { CommandInteraction, Client, EmbedField, Role, User, ApplicationCommandType, ApplicationCommandOptionType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import { Options, textSync } from "figlet";
import { GameConfig, gamesConfig, getGameConfigFromTag } from "../config/GamesConfig";
import * as poemJson from "../config/poem.json";
import * as quotesJson from "../config/quotes.json";
import { logger as LOG } from "../logging/Logger";
import { Command } from "./Command";

const poems: string[] = poemJson;
const quotes: string[] = quotesJson;

const fakeRosterText = "Ｂａｃｋｕｐ";
const rosterText = "Roster";

const imInText = "Bin dabei";

export const imInButtonCustomId = "imIn";
export const backupButtonCustomId = "backup";

const opPoem = "poem";
const opShort = "short";
const opBackupOnly = "backup-only";
const opLargeTime = "large-time"
const opLin = "lin";
// const opPersistence = "persistence";

export const GamePoll: Command = {
    name: "gp",
    description: "Starts a game poll",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            type: ApplicationCommandOptionType.String,
            name: "time",
            description: "The time you want to play",
            required: true,
            autocomplete: true
        },
        {
            type:  ApplicationCommandOptionType.Role,
            name: "role",
            description: "The role to ping",
            required: true
        },
        {
            type:  ApplicationCommandOptionType.Boolean,
            name: opPoem,
            description: "Print a poem message with your poll (default: false)",
            required: false
        },
        {
            type: ApplicationCommandOptionType.Boolean,
            name: opShort,
            description: "Use the compact from of the poll (default: false)",
            required: false
        },
        {
            type: ApplicationCommandOptionType.Boolean,
            name: opBackupOnly,
            description: "Use the backup-only from of the poll (default: false)",
            required: false
        },
        {
            type: ApplicationCommandOptionType.Boolean,
            name: opLin,
            description: "LIN (default: false)",
            required: false
        },
        // {
        //     type: "BOOLEAN",
        //     name: opLargeTime,
        //     description: "Adds a large time display to the message (default: false)",
        //     required: false
        // }

        // {
        //     type: "NUMBER",
        //     name: opPersistence,
        //     description:
        //         "How many hours this poll will be active (default: 24h)",
        //     required: false,
        // },
    ],

    run: async (client: Client, interaction: CommandInteraction) => {
        // Option parsing
        const role = interaction.options.get("role", true).role!;
        const time = interaction.options.get("time", true).value!.toString();

        // If we dont get a role return // FIXME: Error handling
        if (!(role instanceof Role)) return;

        const poem: boolean = (interaction.options.get(opPoem)?.value ?? false) as boolean;
        const short: boolean = (interaction.options.get(opShort)?.value ?? false) as boolean;
        const backupOnly: boolean = (interaction.options.get(opBackupOnly)?.value ?? false) as boolean;
        const lin: boolean = (interaction.options.get(opLin)?.value ?? false) as boolean;
        const largeTime: boolean = (interaction.options.get(opLargeTime)?.value ?? false) as boolean;

        const poemsLen = Object.keys(poems).length;
        const quotesLen = Object.keys(quotes).length;
        LOG.info(`poemsLen: ${poemsLen}`)
        LOG.info(`quotesLen: ${quotesLen}`)

        LOG.info(`Role: ${role.name} Time: ${time} Poem: ${poem.toString()} Short ${short.toString()} BackupOnly: ${backupOnly.toString()} Large time: ${largeTime.toString()} Lin: ${lin.toString()}`);

        let content = `${role.toString()} um ${time.toLocaleString()}!`;

        if (poem) {
            content += "\n\n";
            content += poems[Math.floor(Math.random() * poemsLen)];
        }
        if (lin){
            content += "\n\n";
            content += quotes[Math.floor(Math.random() * quotesLen)];
            content += "\n\n";
        }


        if (largeTime){
            content += "\n\n";
            const options: Options = {
                font: "Big Money-ne",
            }
            const codeBlockWrapper = "```"
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
            const asciiArt: string = textSync(time, options)
            let x = content + codeBlockWrapper + asciiArt
            x =  x.trimEnd()
            x += codeBlockWrapper
            if (x.length < 2000) {
                content = x
            }
            LOG.info(x.length)
        }

        const embed: EmbedBuilder = createDiscordEmbed(
            time,
            role,
            short,
            backupOnly
        );
        const buttons: ActionRowBuilder<ButtonBuilder> = createRosterAndBackupButtons(backupOnly);
        await interaction.followUp({
            ephemeral: false,
            content: content,
            components: [buttons],
            embeds: [embed],
        });
    }
};

function createRosterAndBackupButtons(backupOnly: boolean): ActionRowBuilder<ButtonBuilder> {
    const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(imInButtonCustomId)
                .setLabel(backupOnly ? fakeRosterText : imInText) // Very elegant but not so easy to read
                .setStyle(ButtonStyle.Success)
        )
        .addComponents(
            new ButtonBuilder()
                .setCustomId(backupButtonCustomId)
                .setLabel("Ich weiß nicht (Backup)")
                .setStyle(ButtonStyle.Secondary)
        );
        return row
}

function createDiscordEmbed(
    time: string,
    role: Role,
    short: boolean,
    backupOnly: boolean
): EmbedBuilder {
    const gameConfig: GameConfig = getGameConfigFromTag(role.id);
    LOG.info(`${role.name}: ${gameConfig.name}`);
    const messageEmbed = new EmbedBuilder()
        .setColor(role.color)
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
            name: fakeRosterText,
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

    const rosterField = fields[0]; //fields.find((it) => it.name === "Roster" || it.name === fakeRoster)!;
    const backupField = fields[1]; //fields.find((it) => it.name === "Backup")!;

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

    let rosterFieldName = (rosterField.name.startsWith(rosterText)) ? rosterText : fakeRosterText;
    rosterFieldName += ` (${roster.length}/${(game.rosterSize == -1) ? "∞" : game.rosterSize})`;

    const rosterEmbedField: EmbedField = {
        name: rosterFieldName,
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
