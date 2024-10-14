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
  // If there is no guild info, don't let the user delete anything
  if (!dt.getGuildInfo(interaction.guild?.id!)) {
    return interaction.reply({
      content:
        "The bot hasn't been set up yet! Ask the server admins to set it up.",
      ephemeral: true
    });
  }

  const idVal = interaction.options.getString("id")!;
  const result = dt.getConfession(interaction.guild?.id!, idVal);

  // If a confession is found with the given ID, check if the user is the one that posted it, and delete it if they are.
  // Otherwise, don't let the user delete anything.
  if (result) {
    try {
      const confession = dt.getConfession(
        interaction.guild?.id!,
        idVal
      )?.messageId;
      const channelId = dt.getGuildInfo(interaction.guild?.id!)?.settings
        .confessChannel!;
      const emptyEmbed = new EmbedBuilder()
        .setColor(getRandomColor())
        .setTitle("Confession Deleted")
        .setDescription("[Confession Deleted]");

      // Replace the given confession with an empty embed
      await (BotClient.channels.cache.get(channelId) as TextChannel).messages
        .fetch(confession!)
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
      logger.error("An error occured:", err);
    }
  } else {
    return interaction.reply({
      content:
        "Either the confession wasn't found or you may not be allowed to remove it.",
      ephemeral: true
    });
  }
}
