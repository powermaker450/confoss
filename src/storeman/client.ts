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

import fs from "fs";
import crypto from "crypto";
import { Confession, GuildData, GuildSettings } from "./types";
import { DATA_DIR } from "./config";
import { CommandInteraction, Message } from "discord.js";

export class StoreMan {
  public static readonly fullPath: string =
    (DATA_DIR ?? "./persist/") + "data.json";
  private data: GuildData[];

  constructor(existingData: GuildData[] = []) {
    this.data = existingData;
  }

  public static genId = () => crypto.randomBytes(2).toString("hex");

  public static toConfession(
    message: Message,
    id: string,
    author: string,
  ): Confession {
    return {
      id: id,
      author: author,
      authorId: message.author.id,
      content: message.content.replace(/(# Confession .{4}:\n)/, ""),
    };
  }

  public static checkFile(): GuildData[] {
    let final: GuildData[];

    if (fs.existsSync(StoreMan.fullPath)) {
      const data = fs.readFileSync(StoreMan.fullPath);

      // Read the file if it isn't empty, else set final to an empty array
      final = !data.toString().trim() ? [] : JSON.parse(data.toString());
    } else {
      // If the directory doesn't exist, make it
      !fs.existsSync(DATA_DIR ?? "./persist/") &&
        fs.mkdirSync(DATA_DIR ?? "./persist/");
      fs.createWriteStream(StoreMan.fullPath);
      final = [];
    }

    return final;
  }

  private saveFile(): void {
    fs.writeFileSync(
      StoreMan.fullPath,
      JSON.stringify(this.data, null, 2),
      "utf8",
    );
  }

  // Checks if a guild is not set up
  public checkSetup(id: string): boolean {
    for (const guild of this.data) {
      if (guild.id === id) {
        return true;
      }
    }

    return false;
  }

  // Sets up a guild and stores it in the persistent file
  public setup(id: string, opts: GuildSettings): void {
    this.data.push({
      id: id,
      confessions: [],
      settings: opts,
    });

    this.saveFile();
  }

  // Clear the settings for a given guild
  public clearSettings(id: string): void {
    this.data = this.data.filter((guild) => {
      return guild.id !== id;
    });
    this.saveFile();
  }

  public getGuildInfo(id: string): GuildData | null {
    for (const guild of this.data) {
      if (guild.id === id) {
        return guild;
      }
    }

    return null;
  }

  public addConfession(message: Message, id: string, author: string): void {
    const guildId = message.guild?.id;

    for (const guild of this.data) {
      if (guild.id === guildId) {
        guild.confessions.push(StoreMan.toConfession(message, id, author));
        this.saveFile();
        return;
      }
    }

    throw new Error(
      `No guild with id ${id} was found. Something's pretty wrong.`,
    );
  }

  public delConfesssion(interaction: CommandInteraction): void {
    const guildId = interaction.guild?.id;
    const userId = interaction.user.id;

    // Check if the user is allowed to delete that confesssion
    // If so, delete it, else let them know that they can't delete that confesssion,
    // or it wasn't found.
  }
}
