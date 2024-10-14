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
  .setName("confessmod")
  .setDescription("Moderate confessions")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .addSubcommand(ban =>
    ban
      .setName("ban")
      .setDescription("Ban a user from confessions")
      .addStringOption(option =>
        option
          .setName("id")
          .setDescription("The confession ID to ban")
          .setMinLength(4)
          .setMaxLength(4)
          .setRequired(true)
      )
  )
  .addSubcommand(list =>
    list.setName("list").setDescription("Show the list of banned users")
  )
  .addSubcommand(pardon =>
    pardon
      .setName("pardon")
      .setDescription("Unban a user from confessions")
      .addStringOption(id =>
        id
          .setName("id")
          .setDescription("The confession ID to ban")
          .setMinLength(4)
          .setMaxLength(4)
          .setRequired(true)
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guild?.id!;

  // /confessmod ban <id>
  if (interaction.options.getSubcommand() === "ban") {
    const confessionId = interaction.options.getString("id")!;

    if (dt.isBanned(guildId, confessionId)) {
      try {
        return interaction.reply({
          content: "That user is already banned!",
          ephemeral: true
        });
      } catch (err) {
        logger.error("A ban interaction error occured:", err);
      }
    }

    const result = dt.addBan(guildId, confessionId);

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
      logger.error("A ban interaction error occured:", err);
    }
    // /confessmod list
  } else if (interaction.options.getSubcommand() === "list") {
    const bannedMembers = dt.getBans(interaction.guild?.id!);

    let content = bannedMembers.length
      ? "Banned Members:\n"
      : "There are no banned members.";

    // For each member, add them to the message content.
    // It will end up looking something like this:
    //
    //  Banned Members:
    //
    //  @user1 | a1b2
    //  @user2 | c3d4
    //  @user3 | e5f6
    //
    for (const member of bannedMembers) {
      content += `\n<@${member.user}> | \`${member.confessionId}\``;
    }

    try {
      return interaction.reply({
        content: content,
        ephemeral: true
      });
    } catch (err) {
      logger.error("A banlist interaction error occured:", err);
    }
    // /confessmod pardon <id>
  } else if (interaction.options.getSubcommand() === "pardon") {
    const result = dt.removeBan(
      interaction.guild?.id!,
      interaction.options.getString("id")!
    );

    try {
      return result
        ? interaction.reply({
            content: "User was unbanned.",
            ephemeral: true
          })
        : interaction.reply({
            content: "No confession with that ID was found.",
            ephemeral: true
          });
    } catch (err) {
      logger.error("An unban interaction error occured:", err);
    }
  }

  return interaction.reply({
    content: "Unknown error",
    ephemeral: true
  });
}
