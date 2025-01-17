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
import {
  BanReason,
  Confession,
  ConfessionBan,
  GuildData,
  GuildSettings
} from "./types";
import { DATA_DIR } from "./config";
import {
  bold,
  CommandInteraction,
  heading,
  Message,
  TextChannel,
  unorderedList
} from "discord.js";
import Logger from "../utils/Logger";
import { BotClient } from "../bot";

export class StoreMan {
  public static readonly fullPath: string =
    (DATA_DIR ?? "./persist/") + "data.json";
  private static logger = new Logger("StoreMan");
  private data: GuildData[];

  constructor(existingData: GuildData[] = []) {
    this.data = existingData;
  }

  public static genId = () => crypto.randomBytes(2).toString("hex");

  public static toConfession(
    message: Message,
    id: string,
    author: string,
    authorId: string,
    content: string,
    attachment?: string
  ): Confession {
    return {
      id: id,
      messageId: message.id,
      author: author,
      authorId: authorId,
      content: content,
      attachment: attachment
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

  public async saveFile(): Promise<void> {
    fs.writeFile(
      StoreMan.fullPath,
      JSON.stringify(this.data, null, 2),
      "utf8",
      err => err && StoreMan.logger.error("A write error occured:", err)
    );
  }

  // Checks if a guild is not set up
  public checkSetup(guildId: string): boolean {
    for (const guild of this.data) {
      if (guild.id === guildId) {
        return true;
      }
    }

    return false;
  }

  // Sets up a guild and stores it in the persistent file
  public setup(guildId: string, opts: GuildSettings): void {
    this.data.push({
      id: guildId,
      confessions: [],
      settings: opts,
      versionNote: "v0.1.1"
    });

    this.saveFile();
  }

  // Clear the settings for a given guild
  public clearSettings(guildId: string): void {
    this.data = this.data.filter(guild => {
      return guild.id !== guildId;
    });
    this.saveFile();
  }

  public getGuildInfo(guildId: string): GuildData | null {
    for (const guild of this.data) {
      if (guild.id === guildId) {
        return guild;
      }
    }

    return null;
  }

  public sendReleaseNotes(): void {
    for (const guild of this.data) {
      if (!guild.settings.modChannel) {
        return;
      }

      if (guild.versionNote !== "v0.1.1") {
        // TODO: Manual release notes for now
        const channel = BotClient.channels.cache.get(guild.settings.modChannel);
        const content =
          heading("🎉 Release v0.1.1\n") +
          unorderedList([
            "No notable changes with this release, just popping in to say hi! :)",
            "You'll get updates about future releases right here in the mod channel!"
          ]) +
          "\n\n" +
          bold("Full Changelog: ") +
          "https://codeberg.org/powermaker450/confoss/commits/tag/v0.1.1";

        (channel as TextChannel).send(content).catch(StoreMan.logger.log);
        guild.versionNote = "v0.1.1";
      }
    }

    this.saveFile();
  }

  // Attempts to add a confession. Returns true if the confession is sent, false if otherwise.
  public addConfession(
    message: Message,
    id: string,
    author: string,
    authorId: string,
    content: string,
    attachment?: string
  ): boolean {
    const { id: guildId } = message.guild!;

    for (const guild of this.data) {
      if (guild.id === guildId) {
        // If the author's user ID is in the ban list, don't let them post a confession.
        if (this.isBannedByUser(guildId, author)) {
          return false;
        }

        guild.confessions.push(
          StoreMan.toConfession(
            message,
            id,
            author,
            authorId,
            content,
            attachment
          )
        );
        this.saveFile();
        return true;
      }
    }

    throw new Error(
      `No guild with id ${id} was found. Something's pretty wrong.`
    );
  }

  public getConfession(
    guildId: string,
    confessionId: string
  ): Confession | null {
    for (const guild of this.data) {
      if (guild.id === guildId) {
        for (const confession of guild.confessions) {
          if (confession.id === confessionId) {
            return confession;
          }
        }
      }
    }

    return null;
  }

  public getConfessionById(
    guildId: string,
    messageId: string
  ): Confession | null {
    for (const guild of this.data) {
      if (guild.id === guildId) {
        for (const confession of guild.confessions) {
          if (confession.messageId === messageId) {
            return confession;
          }
        }
      }
    }

    return null;
  }

  // Attempts to delete a confession. If it is sucessfully deleted, returns true, else false.
  public delConfesssion(
    { guild, user }: CommandInteraction,
    confessionId: string
  ): boolean {
    const guildId = guild?.id;
    const userId = user.id;

    for (const guild of this.data) {
      if (guild.id === guildId) {
        for (const confession of guild.confessions) {
          if (confession.authorId === userId) {
            guild.confessions = guild.confessions.filter(confession => {
              return confession.id !== confessionId;
            });

            this.saveFile();
            return true;
          }
        }
      }
    }

    return false;
  }

  public adminDelConfession(guildId: string, confessionId: string): void {
    for (const guild of this.data) {
      if (guild.id === guildId) {
        guild.confessions = guild.confessions.filter(confession => {
          return confession.id !== confessionId;
        });

        this.saveFile();
      }
    }
  }

  // Check if a certain user is banned within a guild.
  public isBannedByUser(guildId: string, userId: string): boolean {
    for (const guild of this.data) {
      if (guild.id === guildId) {
        for (const ban of guild.settings.bans) {
          if (ban.user === userId) {
            return true;
          }
        }
      }
    }

    return false;
  }

  public isBannedById(guildId: string, confessionId: string): boolean {
    for (const guild of this.data) {
      if (guild.id === guildId) {
        for (const ban of guild.settings.bans) {
          if (ban.confessionId === confessionId) {
            return true;
          }
        }
      }
    }

    return false;
  }

  public getBans(guildId: string): ConfessionBan[] {
    for (const guild of this.data) {
      if (guild.id === guildId) {
        return guild.settings.bans;
      }
    }

    return [];
  }

  // Attempts to ban a user from confessions.
  public addBanById(guildId: string, confessionId: string): boolean {
    const confession = this.getConfession(guildId, confessionId);

    for (const guild of this.data) {
      if (guild.id === guildId) {
        if (confession) {
          // Only add the user to the ban list if they aren't banned already
          !this.isBannedByUser(guildId, confession.authorId) &&
            guild.settings.bans.push({
              user: confession.authorId,
              confessionId: confessionId,
              method: BanReason.ById
            });

          this.saveFile();
          return true;
        }
      }
    }

    return false;
  }

  public addBanByUser(guildId: string, userId: string): boolean {
    for (const guild of this.data) {
      if (guild.id === guildId) {
        // Only add the user to the ban list if they aren't banned already
        !this.isBannedByUser(guildId, userId) &&
          guild.settings.bans.push({
            user: userId,
            method: BanReason.ByUser
          });

        this.saveFile();
        return true;
      }
    }

    return false;
  }

  // Attempts to pardon a user from a ban. If sucessfully completed, returns true, false if otherwise.
  public removeBanById(guildId: string, confessionId: string): boolean {
    for (const guild of this.data) {
      if (guild.id === guildId) {
        if (this.getConfession(guildId, confessionId)) {
          guild.settings.bans = guild.settings.bans.filter(ban => {
            return (
              ban.user !== this.getConfession(guildId, confessionId)?.authorId!
            );
          });

          this.saveFile();
          return true;
        }
      }
    }

    return false;
  }

  public removeBanByUser(guildId: string, userId: string): boolean {
    for (const guild of this.data) {
      if (guild.id === guildId) {
        for (const ban of guild.settings.bans) {
          if (ban.method === BanReason.ByUser && ban.user === userId) {
            guild.settings.bans = guild.settings.bans.filter(ban => {
              return ban.user !== userId;
            });

            this.saveFile();
            return true;
          }
        }
      }
    }

    return false;
  }
}
