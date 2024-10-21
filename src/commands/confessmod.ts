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
  heading,
  HeadingLevel,
  inlineCode,
  italic,
  PermissionFlagsBits,
  SlashCommandBuilder
} from "discord.js";
import { dt } from "../main";
import Logger from "../utils/Logger";
import { BanReason } from "../storeman";

const logger = new Logger("(/) confessban");

export const data = new SlashCommandBuilder()
  .setName("confessmod")
  .setDescription("Moderate confessions")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .addSubcommand(ban =>
    ban
      .setName("ban")
      .setDescription("Ban an ID from confessions")
      .addStringOption(option =>
        option
          .setName("id")
          .setDescription("The confession ID to ban")
          .setMinLength(4)
          .setMaxLength(4)
          .setRequired(true)
      )
  )
  .addSubcommand(banuser =>
    banuser
      .setName("banuser")
      .setDescription("Ban a user from confessions")
      .addUserOption(user =>
        user.setName("user").setDescription("The user to ban").setRequired(true)
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
  const { id: guildId } = interaction.guild!;

  // /confessmod ban <id>
  if (interaction.options.getSubcommand() === "ban") {
    const confessionId = interaction.options.getString("id")!;

    if (dt.isBannedById(guildId, confessionId)) {
      try {
        return interaction.reply({
          content: "That user is already banned!",
          ephemeral: true
        });
      } catch (err) {
        logger.error("A ban interaction error occured:", err);
      }
    }

    const result = dt.addBanById(guildId, confessionId);

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
    // /confessmod banuser <user>
  } else if (interaction.options.getSubcommand() === "banuser") {
    const { id: userId } = interaction.options.getUser("user")!;

    const result = dt.addBanByUser(guildId, userId);

    try {
      return result
        ? interaction.reply({
            content: "User was banned.",
            ephemeral: true
          })
        : interaction.reply({
            content: "How did we get here? (An error occured.)}",
            ephemeral: true
          });
    } catch (err) {
      logger.error("A banuser interaction error occured:", err);
    }
    // /confessmod list
  } else if (interaction.options.getSubcommand() === "list") {
    const bannedMembers = dt.getBans(guildId);

    const determineContent = () => {
      if (!bannedMembers.length) {
        return "There are no bans.";
      }

      let userHead = heading("Users:", HeadingLevel.Two);
      let userCount = false;

      let idHead = "\n" + heading("Confessions:", HeadingLevel.Two);
      let idCount = false;
      for (const member of bannedMembers) {
        if (member.method === BanReason.ByUser) {
          userHead += "\n" + `<@${member.user}>`;
          userCount = true;
        } else if (member.method === BanReason.ById) {
          const confession = dt.getConfession(guildId, member.confessionId!)!;
          idHead += `\nConfession ${inlineCode(member.confessionId!)}: ${italic(confession.content)}`;
          idCount = true;
        }
      }

      // If there are users and confessions use both headers, otherwise use whichever is populated
      if (userCount && idCount) {
        return userHead + idHead;
      } else {
        return userCount ? userHead : idHead;
      }
    };

    try {
      return interaction.reply({
        content: determineContent(),
        ephemeral: true
      });
    } catch (err) {
      logger.error("A banlist interaction error occured:", err);
      return interaction.reply({
        content: "A server-side error occurred when getting the ban list.",
        ephemeral: true
      });
    }
    // /confessmod pardon <id>
  } else if (interaction.options.getSubcommand() === "pardon") {
    const result = dt.removeBan(guildId, interaction.options.getString("id")!);

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
