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

import { ChatInputCommandInteraction, Events } from "discord.js";
import { BotClient, BOT_TOKEN, deployCommands } from "./bot";
import { commands } from "./commands";
import { StoreMan } from "./storeman";
import Logger from "./utils/Logger";
import { submit } from "./modals";
import { messageOpts } from "./constants";
import { submitConfession } from "./commandutils";

export const dt = new StoreMan(StoreMan.checkFile());
const logger = new Logger("Main");

BotClient.once("ready", client => {
  logger.log(`We're ready! Logged in as ${client.user.tag}`);
});

// Deploy the commands for a new guild
BotClient.on("guildCreate", async guild => {
  await deployCommands({ guildId: guild.id });
});

// Delete the data for a guild after it is removed
BotClient.on("guildDelete", guild => {
  logger.log(`${guild.name} didn't want us anymore... :(`);
  dt.clearSettings(guild.id);
});

BotClient.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isCommand()) {
    return;
  }

  const { commandName } = interaction;

  if (commands[commandName as keyof typeof commands]) {
    commands[commandName as keyof typeof commands].execute(
      interaction as ChatInputCommandInteraction
    );
  }
});

BotClient.on(Events.MessageDelete, async message => {
  const guildId = message.guild?.id!;
  if (!dt.getGuildInfo(guildId)) {
    return;
  }

  try {
    const messageId = message.id;
    const confessions = dt.getGuildInfo(guildId)?.confessions!;

    for (const confession of confessions) {
      if (confession.messageId === messageId) {
        dt.adminDelConfession(guildId, confession.id);
      }
    }
  } catch (err) {
    logger.error("An error occured:", err);
  }
});

// Submit Confession button
BotClient.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) {
    return;
  }

  // Changed the id of the submit request button, but keep compatibility for now
  const requestSubmit =
    interaction.customId === "requestSubmit" ||
    interaction.customId === "submitConfession";

  if (requestSubmit) {
    // Check if the user is banned from confessions before showing the modal
    dt.isBannedByUser(interaction.guild?.id!, interaction.user.id)
      ? interaction.reply({
          content: "You are banned from confessions in this server!",
          ...messageOpts
        })
      : interaction.showModal(submit);
  }
});

BotClient.on(Events.InteractionCreate, interaction => {
  if (!interaction.isModalSubmit()) {
    return;
  }

  if (interaction.customId === "submitConfession") {
    const messageContent: string = `"${interaction.fields.getTextInputValue("confessionInput")}"`;
    const attachment: string = interaction.fields.getTextInputValue(
      "confessionAttachment"
    );

    try {
      attachment
        ? submitConfession(interaction, messageContent)
        : submitConfession(interaction, messageContent, attachment);
    } catch (err) {
      logger.error("An error occured:", err);
    }
  }
});

BotClient.login(BOT_TOKEN);
