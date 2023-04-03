import { ButtonInteraction, Client, CommandInteraction, EmbedBuilder, EmbedField, Interaction, Message, MessageMentions, User } from "discord.js";
import { Command, Commands } from "./command/Command";
import { backupButtonCustomId, imInButtonCustomId, manageRoster } from "./command/GamePoll";
import { getGameConfigFromTag } from "./config/GamesConfig";
import { logger as LOG } from "./logging/Logger";

export default (client: Client): void => {
    client.on("interactionCreate", async (interaction: Interaction) => {
        if (interaction.isCommand() || interaction.isContextMenuCommand()) {
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
    interaction: CommandInteraction
): Promise<void> => {
    const slashCommand: Command | undefined = Commands.find(
        (c) => c.name === interaction.commandName
    );
    if (!slashCommand) {
        interaction
            .followUp({ content: "An error has occurred" })
            .catch((error: Error) => {
                console.log(error);
            });
        return;
    }

    await interaction.deferReply();

    slashCommand.run(client, interaction);
};

async function handleButtonInteraction(client: Client, interaction: ButtonInteraction) {
    if (!(interaction.customId === imInButtonCustomId || interaction.customId === backupButtonCustomId)) {
        interaction.reply({ ephemeral: true, content: "An error has occurred" })
            .catch((error) => {
                LOG.error(error);
            });
        return;
    }

    const message: Message = interaction.message as Message;
    const roleAsString: string | undefined = message.content.match(MessageMentions.RolesPattern)?.pop()
    if (roleAsString == undefined) throw Error("Could not find role in Embed content")
    const roleID = roleAsString.substring(3, roleAsString.length-1)
    LOG.info("Role ID from message: " + roleID)
    const fields = manageRoster(
        interaction.customId,
        interaction.member?.user as User,
        interaction.message.embeds[0].fields as EmbedField[],
        getGameConfigFromTag(roleID)
    );
    

    const embBuilder = EmbedBuilder.from(message.embeds[0]);
    embBuilder.setFields(fields)

    if (interaction.customId == backupButtonCustomId)
        embBuilder.setFooter(
            { text: `${interaction.member?.user.username ?? "MN33"} sucked!`}
        );

    await interaction.update({ embeds: [embBuilder] });
}
