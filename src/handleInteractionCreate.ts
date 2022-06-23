import { BaseCommandInteraction, ButtonInteraction, Client, EmbedField, Interaction, User } from "discord.js";
import { Command, Commands } from "./command/Command";
import { backupButtonCustomId, imInButtonCustomId, manageRoster } from "./command/GamePoll";
import { gamesConfig } from "./config/GamesConfig";
import { logger as LOG } from "./logging/Logger";

export default (client: Client): void => {
    client.on("interactionCreate", async (interaction: Interaction) => {
        if (interaction.isCommand() || interaction.isContextMenu()) {
            LOG.info(`Handle slash-Command ${interaction.commandName}`);
            await handleSlashCommand(client, interaction);
        } else if (interaction.isButton()) {
            LOG.info(`Handle button ${interaction.component.label ?? ""}`);
            await handleButtonInteraction(client, interaction);
        }
    });
};

const handleSlashCommand = async (
    client: Client,
    interaction: BaseCommandInteraction
): Promise<void> => {
    const slashCommand: Command | undefined = Commands.find(
        (c) => c.name === interaction.commandName
    );
    if (!slashCommand) {
        interaction
            .followUp({ content: "An error has occurred" })
            .catch((error) => {
                console.log(error);
            });
        return;
    }

    await interaction.deferReply();

    slashCommand.run(client, interaction);
};

async function handleButtonInteraction(client: Client, interaction: ButtonInteraction) {
    if (!(interaction.customId === imInButtonCustomId || interaction.customId === backupButtonCustomId)) {
        interaction
            .reply({ ephemeral: true, content: "An error has occurred" })
            .catch((error) => {
                LOG.error(error);
            });
        return;
    }

    const message = interaction.message;
    interaction.member?.user;

    LOG.info(interaction.client.user);
    const fields = manageRoster(
        interaction.customId,
        interaction.member?.user as User,
        interaction.message.embeds[0].fields as EmbedField[],
        gamesConfig.defaultGameConfig
    );

    message.embeds[0].fields = fields;
    const emb = message.embeds[0];

    if (interaction.customId == backupButtonCustomId)
        emb.footer = {
            text: `${interaction.member?.user.toString() ?? "MN33"} sucked!`
        };

    await interaction.update({ embeds: [emb] });
}
