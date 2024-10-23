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

import { Events, Routes } from "discord.js";
import { BOT_ID, BotClient, deployCommands, rest } from "../bot";

if (process.argv.length < 3 || !process.argv[2]) {
  console.log("You need to specify the guild ID to refresh.");
  process.exit(1);
}

const [, , guildId] = process.argv;

BotClient.on(Events.ClientReady, () => {
  try {
    rest
      .put(Routes.applicationGuildCommands(BOT_ID, guildId), { body: [] })
      .then(() => {
        console.log("Deleted (/) commands.");
        deployCommands({ guildId: guildId })
          .then(() => {
            console.log("Successfully reloaded (/) commands.");
            process.exit(0);
          })
          .catch(err => {
            console.log("An error occurred refreshing (/) commands:", err);
            process.exit(1);
          });
      })
      .catch(err => {
        console.log("An error occured refreshing (/) commands:", err);
        process.exit(1);
      });
  } catch (err) {
    console.log("An error occurred refreshing (/) commands:", err);
    process.exit(1);
  }
});
