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
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextChannel
} from "discord.js";
import { dt } from "../main";
import { BotClient } from "../bot";
import getRandomColor from "../utils/getRandomColor";
import Logger from "../utils/Logger";

const logger = new Logger("(/) confessdel");

export const data = new SlashCommandBuilder()
  .setName("confessdel")
  .setDescription("Deletes a confession")
  .addStringOption(option =>
    option.setName("id").setDescription("The confession id").setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const { id: guildId } = interaction.guild!;
  const { id: userId } = interaction.user;

  // If there is no guild info, don't let the user delete anything
  if (!dt.getGuildInfo(guildId)) {
    return interaction.reply({
      content:
        "The bot hasn't been set up yet! Ask the server admins to set it up.",
      ephemeral: true
    });
  }

  const idVal = interaction.options.getString("id")!;
  const result = dt.getConfession(guildId, idVal);
  // If there is a result, and the user is either an author or has manage messages
  const allowedByUser = result && result.authorId === userId;
  const allowedByMod =
    result &&
    interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages);

  // If a confession is found with the given ID, check if the user is the one that posted it, and delete it if they are.
  // Otherwise, don't let the user delete anything.
  if (allowedByUser || allowedByMod) {
    const confession = dt.getConfession(guildId, idVal)!.messageId;
    const channelId = dt.getGuildInfo(guildId)!.settings.confessChannel;
    const emptyEmbed = new EmbedBuilder()
      .setColor(getRandomColor())
      .setTitle("Confession Deleted")
      .setDescription(
        allowedByUser
          ? "[Confession removed by user]"
          : "[Confession removed by moderator]"
      );

    try {
      // Replace the given confession with an empty embed
      await (BotClient.channels.cache.get(channelId) as TextChannel).messages
        .fetch(confession)
        .then(e => {
          e.edit({
            embeds: [emptyEmbed]
          });
        });

      return interaction.reply({
        content: "Confession removed.",
        ephemeral: true
      });
    } catch (err) {
      logger.error("A confession delete error occured:", err);
      return interaction.reply({
        content: "An error occured.",
        ephemeral: true
      });
    }
  } else {
    try {
      // If there was a result, the user wasn't allowed to remove it, otherwise it didn't exist.
      return result
        ? interaction.reply({
            content: "You are not allowed to remove this confession.",
            ephemeral: true
          })
        : interaction.reply({
            content:
              "Either the confession wasn't found or you may not be allowed to remove it.",
            ephemeral: true
          });
    } catch (err) {
      logger.error("A confession delete interaction occured:", err);
      return interaction.reply({
        content: "An error occured.",
        ephemeral: true
      });
    }
  }
}
