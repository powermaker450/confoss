/*
 * Confoss: Anonymous confessions for Discord, free as in freedom and price!
 * Copyright (C) 2024 povario
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
  REST,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  RESTPostAPIContextMenuApplicationCommandsJSONBody,
  Routes
} from "discord.js";
import { commands } from "../commands";
import { BOT_ID, BOT_TOKEN } from "./config";
import { DeployCommandsProps } from "./types";
import Logger from "../utils/Logger";
import { BotClient } from "./client";
import { contextCommands } from "../contextcommands";

const logger = new Logger("Deployer");

let commandsData: (
  | RESTPostAPIChatInputApplicationCommandsJSONBody
  | RESTPostAPIContextMenuApplicationCommandsJSONBody
)[] = [];

Object.values(commands).forEach(command =>
  commandsData.push(command.data.toJSON())
);
Object.values(contextCommands).forEach(command =>
  commandsData.push(command.data.toJSON())
);

export const rest = new REST({ version: "9" }).setToken(BOT_TOKEN);

export async function deployCommands({ guildId }: DeployCommandsProps) {
  try {
    const guildName = BotClient.guilds.cache.get(guildId)?.name;

    logger.log(`Started refreshing (/) commands for ${guildName}`);

    await rest.put(Routes.applicationGuildCommands(BOT_ID, guildId), {
      body: commandsData
    });

    logger.log(`Successfully reloaded (/) commands for ${guildName}`);
  } catch (err) {
    logger.error(err);
  }
}
