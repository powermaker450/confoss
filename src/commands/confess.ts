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
  CommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import { BotClient } from "../bot";
import { dt } from "../main";
import { StoreMan } from "../storeman";
import getRandomColor from "../utils/getRandomColor";

export const data = new SlashCommandBuilder()
  .setName("confess")
  .setDescription("Send a confession")
  .addStringOption(option =>
    option
      .setName("message")
      .setRequired(true)
      .setDescription("What you want to confess"),
  );

export async function execute(interaction: CommandInteraction) {
  if (dt.isBanned(interaction.guild?.id!, interaction.user.id)) {
    return interaction.reply({
      content: "You are banned from confessions in this server!",
      ephemeral: true
    });
  }

  if (!dt.getGuildInfo(interaction.guild?.id!)) {
    return interaction.reply({
      content:
        "The bot hasn't been set up yet! Ask the server admins to set it up.",
      ephemeral: true,
    });
  }


  const confessChannel = dt.getGuildInfo(interaction.guild?.id!)?.settings
    .confessChannel;
  const adminChannel = dt.getGuildInfo(interaction.guild?.id!)?.settings
    .modChannel;

  const color = getRandomColor();
  const messageId = StoreMan.genId();
  const userConfessionEmbed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`Anonymous Confession ${messageId}`)
    // @ts-ignore
    .setDescription(`"${interaction.options.getString("message")}"`);
  
  const adminConfessionEmbed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`Anonymous Confession ${messageId}`)
    // @ts-ignore
    .setDescription(`"${interaction.options.getString("message")}"`)
    .addFields({
        name: "Author",
        value: interaction.user.displayName
      },
      {
        name: "Author ID",
        value: interaction.user.id
      }
    );

  const message = await (
    BotClient.channels.cache.get(confessChannel!) as TextChannel
  )
    .send({
      embeds: [userConfessionEmbed]
    });

  await (BotClient.channels.cache.get(adminChannel!) as TextChannel)
    .send({
      embeds: [adminConfessionEmbed]
    });

  dt.addConfession(message, messageId, interaction.user.displayName, interaction.user.id);

  return interaction.reply({
    content: "Confession sent!",
    ephemeral: true,
  });
}
