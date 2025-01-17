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

import crypto from "crypto";
import {
  BanReason,
  GuildSettings
} from "./types";
import { CommandInteraction, Message } from "discord.js";
import { Guild, Confession, PrismaClient, Ban } from "@prisma/client";
import Logger from "../utils/Logger";

export class StoreMan {
  private static logger = new Logger("StoreMan");
  private static checkResult = (result: any | null) => result ? true : false;

  private client: PrismaClient;

  constructor() {
    this.client = new PrismaClient();
  }

  public static genId = () => crypto.randomBytes(2).toString("hex");

  // Checks if a guild is not set up
  public async checkSetup(guildId: string): Promise<boolean> {
    const result = await this.client.guild.findFirst({ where: { guildId } }).then(StoreMan.checkResult);

    return result;
  }

  // Sets up a guild and stores it in the persistent file
  public async setup(guildId: string, { confessChannel, modChannel }: GuildSettings): Promise<void> {
    await this.client.guild.create({ data: { guildId, confessChannel, modChannel } }).then(() => StoreMan.logger.log("Guild created"));
  }

  // Clear the settings for a given guild
  public async clearSettings(guildId: string): Promise<void> {
    await this.client.confession.deleteMany({ where: { guildId } });
    await this.client.ban.deleteMany({ where: { guildId } });
    await this.client.guild.delete({ where: { guildId } });
  }

  public async getGuildInfo(guildId: string): Promise<Guild | null> {
    return await this.client.guild.findFirst({ where: { guildId } });
  }

  // Attempts to add a confession. Returns true if the confession is sent, false if otherwise.
  public async addConfession(
    message: Message,
    id: string,
    author: string,
    authorId: string,
    content: string,
    attachment?: string
  ): Promise<boolean> {
    const { id: guildId } = message.guild!;
    const { id: messageId } = message;

    const ban = await this.client.ban.findFirst({ where: { guildId, authorId } }).then(StoreMan.checkResult);

    if (ban) {
      return false;
    }

    await this.client.confession.create({ data: { id, messageId, author, authorId, guildId, content, attachment } })
    return true;
  }

  public async getConfession(
    guildId: string,
    id: string
  ): Promise<Confession | null> {
    return await this.client.confession.findFirst({ where: { guildId, id } });
  }

  public async getConfessions(guildId: string): Promise<Confession[]> {
    return await this.client.confession.findMany({ where: { guildId } });
  }

  public async getConfessionById(guildId: string, messageId: string): Promise<Confession | null> {
    return await this.client.confession.findFirst({ where: { guildId, messageId } });
  }

  /**
   * Delete a confession from the database.
   *
   * @param interaction - Used to obtain the guild and authorId
   * @param id - The confession ID to delete
   *
   * @returns true if the confession was sucessfully deleted, false if otherwise.
   */
  public async delConfesssion(
    { guild, user: { id: authorId } }: CommandInteraction,
    id: string
  ): Promise<boolean> {
    const { id: guildId } = guild!;
    const result = await this.client.confession.delete({ where: { guildId, authorId, id } }).then(StoreMan.checkResult);

    return result;
  }

  /**
   * Delete a confession from the database as an admin.
   * 
   * @param guildId - The ID of the guild to delete from
   * @param id - The ID of the confession to delete
   */
  public async adminDelConfession(guildId: string, id: string): Promise<void> {
    await this.client.confession.delete({ where: { guildId, id } });
  }

  // Check if a certain user is banned within a guild.
  public async isBannedByUser(guildId: string, authorId: string): Promise<boolean> {
    const result = await this.client.ban.findFirst({ where: { guildId, authorId } }).then(StoreMan.checkResult);

    return result;
  }

  public async isBannedById(guildId: string, confessionId: string): Promise<boolean> {
    const result = await this.client.ban.findFirst({ where: { guildId, confessionId } }).then(StoreMan.checkResult);

    return result;
  }

  public async getBans(guildId: string): Promise<Ban[]> {
    return await this.client.ban.findMany({ where: { guildId } });
  }

  /**
   * Ban a user by confession id.
   *
   * @param guildId - The ID of the guild to ban from
   * @param confessionId - The ID of the confession to ban for
   */
  public async addBanById(guildId: string, confessionId: string): Promise<boolean> {
    const alreadyBanned = await this.isBannedById(guildId, confessionId);
    
    if (alreadyBanned) {
      return false;
    }

    const { authorId } = await this.client.confession.findFirstOrThrow({ where: { guildId, id: confessionId } });
    await this.client.ban.create({ data: { guildId, authorId, confessionId, reason: BanReason.ById } });
    return true;
  }

  public async addBanByUser(guildId: string, authorId: string): Promise<boolean> {
    const alreadyBanned = await this.isBannedByUser(guildId, authorId);

    if (alreadyBanned) {
      return false;
    }

    await this.client.ban.create({ data: { guildId, authorId, reason: BanReason.ByUser } });
    return true;
  }

  // Attempts to pardon a user from a ban. If sucessfully completed, returns true, false if otherwise.
  public async removeBanById(guildId: string, confessionId: string): Promise<boolean> {
    if (await this.isBannedById(guildId, confessionId)) {
      return false;
    }

    const { authorId } = await this.client.ban.findFirstOrThrow({ where: { guildId, confessionId } });

    await this.client.ban.delete({ where: { guildId, confessionId, authorId } });
    return true;
  }

  public async removeBanByUser(guildId: string, authorId: string): Promise<boolean> {
    if (await this.isBannedByUser(guildId, authorId)) {
      return false;
    }

    await this.client.ban.delete({ where: { guildId, authorId } });
    return true;
  }
}
