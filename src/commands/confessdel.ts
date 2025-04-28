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

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { dt } from "../main";
import Logger from "../utils/Logger";
import { messageOpts } from "../constants";
import { deleteConfession } from "../commandutils";

const logger = new Logger("(/) confessdel");

export const data = new SlashCommandBuilder()
  .setName("confessdel")
  .setDescription("Deletes a confession")
  .addStringOption(option =>
    option.setName("id").setDescription("The confession id").setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const { id: guildId } = interaction.guild!;

  // If there is no guild info, don't let the user delete anything
  if (!dt.getGuildInfo(guildId)) {
    return interaction.reply({
      content:
        "The bot hasn't been set up yet! Ask the server admins to set it up.",
      ...messageOpts
    });
  }

  const idVal = interaction.options.getString("id")!;

  return deleteConfession(interaction, idVal).catch(err =>
    logger.error("An error occured:", err)
  );
}
