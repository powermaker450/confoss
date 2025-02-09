import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  inlineCode,
  Message,
  ModalSubmitInteraction,
  TextChannel
} from "discord.js";
import { messageOpts } from "../constants";
import { dt } from "../main";
import getRandomColor from "../utils/getRandomColor";
import { StoreMan } from "../storeman";
import { BotClient } from "../bot";
import Logger from "../utils/Logger";

const logger = new Logger("submitConfession");

export async function submitConfession(
  interaction: ChatInputCommandInteraction | ModalSubmitInteraction,
  messageContent: string,
  attachmentContent?: string
) {
  const { id: guildId } = interaction.guild!;
  const { id: userId, displayName: username } = interaction.user;

  // If the user is banned in this guild, don't let them post
  if (await dt.isBannedByUser(guildId, userId)) {
    return interaction.reply({
      content: "You are banned from confessions in this server!",
      ...messageOpts
    });
  }

  // If no guild info is present for this guild, don't let the user post
  if (!(await dt.getGuildInfo(guildId))) {
    return interaction.reply({
      content:
        "The bot hasn't been set up yet! Ask the server admins to set it up.",
      ...messageOpts
    });
  }

  const { confessChannel, modChannel } = (await dt.getGuildInfo(guildId))!;

  const isAttachment = (text: string | null) =>
    text && (text.startsWith("http://") || text.startsWith("https://"));

  const color = getRandomColor();
  const messageId = StoreMan.genId();

  // Looks like:
  //
  //  |
  //  | Anonymous Confession a1b2
  //  |
  //  | "example confession content"
  //  |
  //
  const userConfessionEmbed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`Anonymous Confession ${inlineCode(messageId)}`)
    .setDescription(messageContent);

  attachmentContent &&
    isAttachment(attachmentContent) &&
    userConfessionEmbed.setImage(attachmentContent);

  // Looks like:
  //
  //  |
  //  | Anonymous Confession a1b2
  //  |
  //  | "example confession content"
  //  |
  //  | Author
  //  | @user1
  //  |
  //  | Author ID
  //  | 1234567890
  //  |
  //
  const adminConfessionEmbed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`Anonymous Confession ${inlineCode(messageId)}`)
    .setTimestamp(Date.now())
    .setDescription(messageContent)
    .addFields(
      {
        name: "Author",
        value: `<@${userId}>`
      },
      {
        name: "Author ID",
        value: userId
      }
    );

  attachmentContent &&
    isAttachment(attachmentContent) &&
    adminConfessionEmbed.setImage(attachmentContent);

  const submitConfessionButton = new ButtonBuilder()
    .setCustomId("requestSubmit")
    .setLabel("Submit a Confession")
    .setStyle(ButtonStyle.Primary);

  // const deleteConfessionButton = new ButtonBuilder()
  //   .setCustomId("deleteConfession")
  //   .setLabel("Delete")
  //   .setStyle(ButtonStyle.Danger);

  const actionRow = new ActionRowBuilder<ButtonBuilder>().setComponents(
    submitConfessionButton
    // deleteConfessionButton
  );

  const message = await (
    BotClient.channels.cache.get(confessChannel!) as TextChannel
  ).send({
    embeds: [userConfessionEmbed],
    components: [actionRow]
  });

  modChannel &&
    (BotClient.channels.cache.get(modChannel!) as TextChannel).send({
      embeds: [adminConfessionEmbed]
    });

  const fields: readonly [Message, string, string, string, string] = [
    message,
    messageId,
    username,
    userId,
    messageContent
  ];

  attachmentContent
    ? await dt.addConfession(...fields, attachmentContent)
    : await dt.addConfession(...fields);

  const confessions = await dt.getConfessions(guildId);
  logger.log(confessions);
  logger.log(confessions.length);

  // If there are 2 or more confessions, remove the previous confession's button components
  if (confessions.length > 1) {
    const channel = BotClient.channels.cache.get(confessChannel);
    logger.log(confessions);
    const messageId = confessions[confessions.length - 2].messageId;
    if (!channel || !channel.isTextBased()) {
      logger.error(`Channel ${confessChannel} is not a text channel.`);
      return;
    }

    const previousMessage = await channel.messages.fetch(messageId);

    try {
      await previousMessage.edit({ components: [] });
      logger.log(`Removed embeds from previous message ${messageId}`);
    } catch (err) {
      logger.error(
        "An error occured removing embeds from the previous message:",
        err
      );
    }
  }

  return interaction.reply({
    content: "Confession sent!",
    ...messageOpts
  });
}
