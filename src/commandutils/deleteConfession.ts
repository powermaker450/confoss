/*
 * Confoss: Anonymous confessions for Discord, free as in freedom and price!
 * Copyright (C) 2024 povario
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
  ContextMenuCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  TextChannel
} from "discord.js";
import { dt } from "../main";
import getRandomColor from "../utils/getRandomColor";
import { BotClient } from "../bot";
import { messageOpts } from "../constants";
import Logger from "../utils/Logger";

const logger = new Logger("deleteConfession");

export async function deleteConfession(
  interaction: ChatInputCommandInteraction | ContextMenuCommandInteraction,
  idVal: string
) {
  const { id: guildId } = interaction.guild!;
  const { id: userId } = interaction.user;

  const result = await dt.getConfession(guildId, idVal);
  // If there is a result, and the user is either an author or has manage messages
  const allowedByUser = result && result.authorId === userId;
  const allowedByMod =
    result &&
    interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages);

  // If a confession is found with the given ID, check if the user is the one that posted it, and delete it if they are.
  // Otherwise, don't let the user delete anything.
  if (allowedByUser || allowedByMod) {
    const confession = (await dt.getConfession(guildId, idVal))!.messageId;
    const channelId = (await dt.getGuildInfo(guildId))!.confessChannel;
    const emptyEmbed = new EmbedBuilder()
      .setColor(getRandomColor())
      .setTitle("Confession Deleted")
      .setDescription(
        allowedByUser
          ? "[Confession removed by user]"
          : "[Confession removed by moderator]"
      );

    // Replace the given confession with an empty embed
    (BotClient.channels.cache.get(channelId) as TextChannel).messages
      .fetch(confession)
      .then(message => {
        message.edit({
          embeds: [emptyEmbed]
        });

        return interaction.reply({
          content: "Confession removed.",
          ...messageOpts
        });
      })
      .catch(async err => {
        logger.error("An error occured deleting a confession:", err);

        return interaction
          .reply({
            content: "An error occured when trying to delete that confession.",
            ...messageOpts
          })
          .catch(err => logger.error("An error occured following up:", err));
      });
  } else {
    // If there was a result, the user wasn't allowed to remove it, otherwise it didn't exist.
    return interaction
      .reply({
        content: result
          ? "You are not allowed to remove this confession."
          : "Either the confession wasn't found or you may not be allowed to remove it.",
        ...messageOpts
      })
      .catch(err => logger.error("A confession delete error occured:", err));
  }
}
