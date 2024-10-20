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
  try {
    // If the user is banned in this guild, don't let them post
    if (dt.isBannedByUser(interaction.guild?.id!, interaction.user.id)) {
      return interaction.reply({
        content: "You are banned from confessions in this server!",
        ephemeral: true
      });
    }

    // If no guild info is present for this guild, don't let the user post
    if (!dt.getGuildInfo(interaction.guild?.id!)) {
      return interaction.reply({
        content:
          "The bot hasn't been set up yet! Ask the server admins to set it up.",
        ephemeral: true
      });
    }

    const confessChannel = dt.getGuildInfo(interaction.guild?.id!)?.settings
      .confessChannel;
    const adminChannel = dt.getGuildInfo(interaction.guild?.id!)?.settings
      .modChannel;

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
          value: `<@${interaction.user.id}>`
        },
        {
          name: "Author ID",
          value: interaction.user.id
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

    adminChannel && await (BotClient.channels.cache.get(adminChannel!) as TextChannel).send({
      embeds: [adminConfessionEmbed]
    });

    dt.addConfession(
      message,
      messageId,
      interaction.user.displayName,
      interaction.user.id,
      messageContent,
      attachment
    );

    const confessionsLength = dt.getGuildInfo(interaction.guild?.id!)
      ?.confessions.length!;

    // If there are 2 or more confessions, remove the previous confession's button components
    if (confessionsLength >= 2) {
      await (
        BotClient.channels.cache.get(confessChannel!) as TextChannel
      ).messages
        .fetch(
          dt.getGuildInfo(interaction.guild?.id!)?.confessions[
            confessionsLength - 2
          ].messageId!
        )
        .then(message => {
          message.edit({ components: [] });
        });
    }

    return interaction.reply({
      content: "Confession sent!",
      ephemeral: true
    });
  } catch (err) {
    logger.error("An error occured:", err);
  }
}
