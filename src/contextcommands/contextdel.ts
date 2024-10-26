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
  ApplicationCommandType,
  ContextMenuCommandBuilder,
  ContextMenuCommandInteraction,
  ContextMenuCommandType
} from "discord.js";
import Logger from "../utils/Logger";
import { messageOpts } from "../constants";
import { BotClient } from "../bot";

const logger = new Logger("(:) contextdel");

export const friendlyName = "Delete Confession";

export const data = new ContextMenuCommandBuilder()
  .setName(friendlyName)
  // This is what it's supposed to be, but tsc gets upset if the type isn't coerced
  // .setType(ApplicationCommandType.Message)
  .setType(ApplicationCommandType.Message as ContextMenuCommandType);

export async function execute(interaction: ContextMenuCommandInteraction) {
  const text = `Target: ${interaction.targetId}`;

  logger.log(text);

  return interaction.reply({
    content: text,
    ...messageOpts
  });
}
