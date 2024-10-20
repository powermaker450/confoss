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
import { deployCommands } from "../bot";
import Logger from "../utils/Logger";

const logger = new Logger("(/) update");
const minutes = 5;
const cooldownList = new Set();

export const data = new SlashCommandBuilder()
  .setName("update")
  .setDescription("Update the bot with new data if available")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction: ChatInputCommandInteraction) {
  const { id: guildId, name: guildName } = interaction.guild!;

  if (cooldownList.has(guildId)) {
    return interaction.reply({
      content: `You can only run the update command once every ${minutes} minutes.`,
      ephemeral: true
    });
  }

  deployCommands({ guildId: guildId });

  cooldownList.add(guildId);
  logger.log(`Applied cooldown to "${guildName}"`);

  setTimeout(
    () => {
      cooldownList.delete(guildId);
      logger.log(`Removed cooldown from "${guildName}"`);
    },
    minutes * 60 * 1000
  );

  return interaction.reply({
    content: "Commands refreshed.",
    ephemeral: true
  });
}
