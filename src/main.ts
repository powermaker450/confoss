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

import { BotClient, BOT_TOKEN, deployCommands } from "./bot";
import { commands } from "./commands";
import { StoreMan } from "./storeman";
import Logger from "./utils/Logger";

export const dt = new StoreMan(StoreMan.checkFile());
const logger = new Logger("Main");

BotClient.once("ready", client => {
  logger.log(`We're ready! Logged in as ${client.user.tag}`);
});

BotClient.on("guildCreate", async guild => {
  await deployCommands({ guildId: guild.id });
});

BotClient.on("guildDelete", guild => {
  logger.log(`${guild.name} didn't want us anymore... :(`);
  dt.clearSettings(guild.id);
});

BotClient.on("interactionCreate", async interaction => {
  if (!interaction.isCommand()) {
    return;
  }

  const { commandName } = interaction;

  if (commands[commandName as keyof typeof commands]) {
    commands[commandName as keyof typeof commands].execute(interaction);
  }
});

BotClient.login(BOT_TOKEN);
