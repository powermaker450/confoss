/*
 * Confoss: Anonymous confessions for Discord, free as in freedom and price!
 * Copyright (C) 2024 powermaker450
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  TextChannel
} from "discord.js";
import { BotClient } from "../bot";
import { dt } from "../main";
import { StoreMan } from "../storeman";
import getRandomColor from "../utils/getRandomColor";
import Logger from "../utils/Logger";
import { messageOpts } from "../constants";

const logger = new Logger("(/) confess");

export const data = new SlashCommandBuilder()
  .setName("confess")
  .setDescription("Send a confession")
  .addStringOption(option =>
    option
      .setName("message")
      .setRequired(true)
      .setDescription("What you want to confess")
      .setMaxLength(2000)
  )
  .addStringOption(option =>
    option
      .setName("attachment")
      .setDescription("The link to an image to attach (optional)")
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  // TODO: This all works as intended, but I'd like for it so be a reusable function
  // instead because all of this is used in src/main.ts
  const { id: guildId } = interaction.guild!;
  const { id: userId, displayName: userName } = interaction.user;

  try {
    // If the user is banned in this guild, don't let them post
    if (dt.isBannedByUser(guildId, userId)) {
      return interaction.reply({
        content: "You are banned from confessions in this server!",
        ...messageOpts
      });
    }

    // If no guild info is present for this guild, don't let the user post
    if (!dt.getGuildInfo(guildId)) {
      return interaction.reply({
        content:
          "The bot hasn't been set up yet! Ask the server admins to set it up.",
        ...messageOpts
      });
    }

    const confessChannel = dt.getGuildInfo(guildId)!.settings.confessChannel;
    const adminChannel = dt.getGuildInfo(guildId)?.settings.modChannel;

    const messageContent = `"${interaction.options.getString("message")}"`;
    const attachment = interaction.options.getString("attachment")!;

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
      .setTitle(`Anonymous Confession \`${messageId}\``)
      .setDescription(messageContent);

    isAttachment(attachment) && userConfessionEmbed.setImage(attachment);

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
      .setTitle(`Anonymous Confession \`${messageId}\``)
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

    isAttachment(attachment) && adminConfessionEmbed.setImage(attachment);

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

    adminChannel &&
      (await (BotClient.channels.cache.get(adminChannel!) as TextChannel).send({
        embeds: [adminConfessionEmbed]
      }));

    dt.addConfession(
      message,
      messageId,
      userName,
      userId,
      messageContent,
      attachment
    );

    const confessionsLength = dt.getGuildInfo(guildId)!.confessions.length;

    // If there are 2 or more confessions, remove the previous confession's button components
    if (confessionsLength >= 2) {
      (BotClient.channels.cache.get(confessChannel) as TextChannel).messages
        .fetch(
          dt.getGuildInfo(guildId)!.confessions[confessionsLength - 2].messageId
        )
        .then(message => {
          message.edit({ components: [] });
        })
        .catch(err => {
          logger.error(
            "An error occured removing embeds from the previous message:",
            err
          );
        });
    }

    return interaction.reply({
      content: "Confession sent!",
      ...messageOpts
    });
  } catch (err) {
    logger.error("An error occured:", err);
  }
}
