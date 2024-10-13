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
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  ChannelType,
  CommandInteraction,
  ComponentType,
  PermissionFlagsBits,
  SlashCommandBuilder
} from "discord.js";
import { dt } from "../main";
import Logger from "../utils/Logger";

const logger = new Logger("(/) setup");

export const data = new SlashCommandBuilder()
  .setName("setup")
  .setDescription("Setup the bot.")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction: CommandInteraction) {
  if (dt.checkSetup(interaction.guild?.id!)) {
    return interaction.reply({
      content: "This guild has already been set up!",
      ephemeral: true
    });
  }

  const guildId = interaction.guild?.id;
  let confessChannel: string, logChannel: string;

  const channelList = new ChannelSelectMenuBuilder()
    .addChannelTypes(ChannelType.GuildText)
    .setCustomId("channels")
    .setPlaceholder("Choose a channel");

  const channelRow =
    new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(channelList);

  try {
    const response = await interaction.reply({
      content: `# Let's get started, ${interaction.user.displayName}!\nFirst, let's choose a channel for your confessions.`,
      ephemeral: true,
      components: [channelRow]
    });

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.ChannelSelect,
      time: 45_000
    });

    collector.on("collect", async i => {
      confessChannel = i.values[0];

      await i.update({
        content: "Awesome!",
        components: []
      });

      collector.stop();

      const logChannelList = new ChannelSelectMenuBuilder()
        .addChannelTypes(ChannelType.GuildText)
        .setCustomId("logChannels")
        .setPlaceholder("Choose a channel.");

      const logChannelRow =
        new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
          logChannelList
        );

      const logResponse = await interaction.followUp({
        content: "# Now, select a logging channel, for moderation purposes.",
        ephemeral: true,
        components: [logChannelRow]
      });

      const logCollector = logResponse.createMessageComponentCollector({
        componentType: ComponentType.ChannelSelect,
        time: 45_000
      });

      logCollector.on("collect", async ij => {
        logChannel = ij.values[0];

        await ij.update({
          content: "Setup Complete!",
          components: []
        });

        dt.setup(guildId!, {
          confessChannel: confessChannel,
          modChannel: logChannel,
          bans: []
        });

        logCollector.stop();
      });

      logCollector.on("end", content => {
        // If there is no content, follow up with an error message.
        !content.size &&
          interaction.followUp({
            content: "No channel selected. Please try again.",
            ephemeral: true,
            components: []
          });
      });
    });

    collector.on("end", collected => {
      // Same as above logCollector end
      !collected.size &&
        interaction.followUp({
          content: "No channel selected. Try again.",
          ephemeral: true,
          components: []
        });
    });
  } catch (err) {
    logger.error("An error occured:", err);
  }
}
