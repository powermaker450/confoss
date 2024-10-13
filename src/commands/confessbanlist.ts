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

import { CommandInteraction,PermissionFlagsBits,SlashCommandBuilder } from "discord.js";
import { dt } from "../main";
import { BotClient } from "../bot";

export const data = new SlashCommandBuilder()
  .setName("confessbanlist")
  .setDescription("Get the current ban list")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)

export async function execute(interaction: CommandInteraction) {
  const bannedMembers = dt.getBans(interaction.guild?.id!);

  let content = bannedMembers.length ? "Banned Members:\n" : "There are no banned members.";

  for (const member of bannedMembers) {
    const identifiedMember = await BotClient.users.fetch(member.user);

    content += `\n${identifiedMember.displayName} | \`${member.confessionId}\``;
  }

  return interaction.reply({
    content: content,
    ephemeral: true
  })
}
