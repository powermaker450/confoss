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
import { messageOpts } from "../constants";

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
  )
  .addSubcommand(pardonuser =>
    pardonuser
      .setName("pardonuser")
      .setDescription("Pardon a user from confessions")
      .addUserOption(user =>
        user
          .setName("user")
          .setDescription("The user to pardon")
          .setRequired(true)
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const { id: guildId } = interaction.guild!;

  // /confessmod ban <id>
  if (interaction.options.getSubcommand() === "ban") {
    const confessionId = interaction.options.getString("id")!;

    if (await dt.isBannedById(guildId, confessionId)) {
      return interaction
        .reply({
          content: "That user is already banned!",
          ...messageOpts
        })
        .catch(err => logger.error("A ban interaction error occured:", err));
    }

    const result = await dt.addBanById(guildId, confessionId);

    return interaction
      .reply({
        content: result
          ? "User was banned."
          : "No confession with that ID was found.",
        ...messageOpts
      })
      .catch(err => logger.error("A ban interaction error occured:", err));

    // /confessmod banuser <user>
  } else if (interaction.options.getSubcommand() === "banuser") {
    const { id: userId } = interaction.options.getUser("user")!;

    const result = await dt.addBanByUser(guildId, userId);

    return interaction
      .reply({
        content: result ? "User was banned." : "How did we get here?",
        ...messageOpts
      })
      .catch(err => logger.log("A ban user interaction error occured:", err));

    // /confessmod list
  } else if (interaction.options.getSubcommand() === "list") {
    const bannedMembers = await dt.getBans(guildId);

    const determineContent = async () => {
      if (!bannedMembers.length) {
        return "There are no bans.";
      }

      let userHead = heading("Users:", HeadingLevel.Two);
      let userCount = false;

      let idHead = "\n" + heading("Confessions:", HeadingLevel.Two);
      let idCount = false;
      for (const member of bannedMembers) {
        if (member.reason === BanReason.ByUser) {
          userHead += "\n" + `<@${member.authorId}>`;
          userCount = true;
        } else if (member.reason === BanReason.ById) {
          const confession = (await dt.getConfession(
            guildId,
            member.confessionId!
          ))!;
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

    return interaction
      .reply({
        content: await determineContent(),
        ...messageOpts
      })
      .catch(err => logger.error("A banlist interaction error occured:", err));

    // /confessmod pardon <id>
  } else if (interaction.options.getSubcommand() === "pardon") {
    const result = await dt.removeBanById(
      guildId,
      interaction.options.getString("id")!
    );

    return interaction
      .reply({
        content: result
          ? "User was unbanned."
          : "No confession with that ID was found.",
        ...messageOpts
      })
      .catch(err => logger.log("An unban interaction error occured", err));

    // /confessmod pardonuser <user>
  } else if (interaction.options.getSubcommand() === "pardonuser") {
    const { id: userId } = interaction.options.getUser("user")!;

    const result = await dt.removeBanByUser(guildId, userId);

    return interaction
      .reply({
        content: result
          ? "User was unbanned."
          : "That user is not banned from confessions.",
        ...messageOpts
      })
      .catch(err => logger.log("Error replying to user ban interaction", err));
  }

  // Catch-all
  return interaction.reply({
    content: "Unknown error",
    ...messageOpts
  });
}
