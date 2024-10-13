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
  PermissionFlagsBits,
  SlashCommandBuilder
} from "discord.js";
import { dt } from "../main";
import Logger from "../utils/Logger";

const logger = new Logger("(/) confessban");

export const data = new SlashCommandBuilder()
  .setName("confessban")
  .setDescription("Ban a user from submitting confessions.")
  .addStringOption(option =>
    option
      .setName("id")
      .setDescription("The confession ID to ban")
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function execute(interaction: ChatInputCommandInteraction) {
  const result = dt.addBan(
    interaction.guild?.id!,
    interaction.options.getString("id")!
  );

  try {
    return result
      ? interaction.reply({
          content: "User was banned.",
          ephemeral: true
        })
      : interaction.reply({
          content: "No confession with that ID was found.",
          ephemeral: true
        });
  } catch (err) {
    logger.error("An error occured:", err);
  }
}
