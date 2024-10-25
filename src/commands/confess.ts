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

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import Logger from "../utils/Logger";
import { submitConfession } from "../commandutils";

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
  const messageContent = `"${interaction.options.getString("message")}"`;
  const attachment = interaction.options.getString("attachment")!;

  try {
    attachment
      ? submitConfession(interaction, messageContent)
      : submitConfession(interaction, messageContent);
  } catch (err) {
    logger.error("An error occured:", err);
  }
}
