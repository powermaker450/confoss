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
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  CommandInteraction,
  ComponentType,
  PermissionFlagsBits,
  SlashCommandBuilder
} from "discord.js";
import { dt } from "../main";
import Logger from "../utils/Logger";
import { messageOpts } from "../constants";

const logger = new Logger("(/) setup");

export const data = new SlashCommandBuilder()
  .setName("setup")
  .setDescription("Setup the bot.")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction: CommandInteraction) {
  const { id: guildId } = interaction.guild!;
  const { displayName: username } = interaction.user;

  if (dt.checkSetup(guildId)) {
    return interaction.reply({
      content: "This guild has already been set up!",
      ...messageOpts
    });
  }

  let confessChannel: string, logChannel: string;

  const channelList = new ChannelSelectMenuBuilder()
    .addChannelTypes(ChannelType.GuildText)
    .setCustomId("channels")
    .setPlaceholder("Choose a channel");

  const skipButton = new ButtonBuilder()
    .setCustomId("skipModChannel")
    .setLabel("Skip")
    .setStyle(ButtonStyle.Secondary);

  const channelRow =
    new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(channelList);

  const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    skipButton
  );

  try {
    const response = await interaction.reply({
      content: `# Let's get started, ${username}!\nFirst, let's choose a channel for your confessions.`,
      ...messageOpts,
      components: [channelRow]
    });

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.ChannelSelect,
      time: 45_000
    });

    collector.on("collect", async i => {
      [confessChannel] = i.values;

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
        ...messageOpts,
        components: [logChannelRow, buttonRow]
      });

      const logCollector = logResponse.createMessageComponentCollector({
        componentType: ComponentType.ChannelSelect,
        time: 45_000
      });

      const skipCollector = logResponse.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 45_000
      });

      let skipped = false;

      logCollector.on("collect", async ij => {
        [logChannel] = ij.values;

        await ij.update({
          content: "Setup Complete!",
          components: []
        });

        dt.setup(guildId, {
          confessChannel: confessChannel,
          modChannel: logChannel,
          bans: []
        });

        logCollector.stop();
        skipCollector.stop();
      });

      skipCollector.on("collect", async ik => {
        if (ik.customId === "skipModChannel") {
          await ik.update({
            content: "Setup complete!",
            components: []
          });

          dt.setup(guildId!, {
            confessChannel: confessChannel,
            bans: []
          });

          skipped = true;
          logCollector.stop();
          skipCollector.stop();
        }
      });

      logCollector.on("end", content => {
        // If there is no content and the channel hasn't been skipped, follow up with an error message.
        !content.size &&
          !skipped &&
          interaction.followUp({
            content: "No channel selected. Please try again.",
            ...messageOpts,
            components: []
          });
      });
    });

    collector.on("end", collected => {
      // Same as above logCollector end
      !collected.size &&
        interaction.followUp({
          content: "No channel selected. Try again.",
          ...messageOpts,
          components: []
        });
    });
  } catch (err) {
    logger.error("An error occured:", err);
  }
}
