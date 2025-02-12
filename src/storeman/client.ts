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
import { BanReason, GuildSettings } from "./types";
import { CommandInteraction, Message, TextChannel } from "discord.js";
import { Guild, Confession, PrismaClient, Ban } from "@prisma/client";
import Logger from "../utils/Logger";
import { BotClient } from "../bot";
import fetchReleaseNotes from "../utils/fetchReleaseNotes";

export class StoreMan {
  public static readonly VERSION_NOTE = "v0.2.0";
  private static logger = new Logger("StoreMan");

  private client: PrismaClient;

  public static genId = () => crypto.randomBytes(2).toString("hex");

  public constructor() {
    this.client = new PrismaClient();
  }

  /**
   * Check if a guild is set up.
   *
   * @param guildId - The ID of the guild to check
   *
   * @returns True if the guild is already set up, false if otherwise
   */
  public async checkSetup(guildId: string): Promise<boolean> {
    const result = await this.client.guild.findFirst({ where: { guildId } });
    StoreMan.logger.log(
      `Guild ${guildId} ${result ? "has" : "has not"} completed setup.`
    );

    // Don't need the result, just the presence of it, cast to boolean
    return !!result;
  }

  public async sendReleaseNotes(): Promise<void> {
    const guilds = await this.client.guild.findMany();
    const { body } = await fetchReleaseNotes();

    for (const { guildId, modChannel, versionNote } of guilds) {
      if (!modChannel) {
        return;
      }

      if (versionNote !== StoreMan.VERSION_NOTE) {
        const channel = BotClient.channels.cache.get(modChannel);
        if (!(channel instanceof TextChannel)) {
          StoreMan.logger.error(
            `Mod channel for guild ${guildId} is not a text channel.`
          );
          continue;
        }

        try {
          await channel.send(body);
          StoreMan.logger.log(`Sent changelog to guild ${guildId}.`);
        } catch (err) {
          StoreMan.logger.error(err);
          continue;
        }

        await this.client.guild.update({
          where: { guildId },
          data: { versionNote: StoreMan.VERSION_NOTE }
        });
      }
    }
  }

  /**
   * Adds a guild and it's settings to the database.
   *
   * @param guildId - The ID of the guild to add
   * @param GuildSettings - The ID of the confession channel and optionally the mod channel
   */
  public async setup(
    guildId: string,
    { confessChannel, modChannel }: GuildSettings
  ): Promise<void> {
    const result = await this.client.guild.create({
      data: {
        guildId,
        confessChannel,
        modChannel,
        versionNote: StoreMan.VERSION_NOTE
      }
    });
    StoreMan.logger.log(`Setup completed for guild ${guildId}:`, result);
  }

  /**
   * Removes a guild and it's data from the database.
   *
   * @param guildId - The ID of the guild to erase
   */
  public async clearSettings(guildId: string): Promise<void> {
    const { count: confessionCount } = await this.client.confession.deleteMany({
      where: { guildId }
    });
    const { count: banCount } = await this.client.ban.deleteMany({
      where: { guildId }
    });

    await this.client.guild.delete({ where: { guildId } });
    StoreMan.logger.log(
      `Sucessfully erased data for guild ${guildId}. (${confessionCount} confessions, ${banCount} bans)`
    );
  }

  /**
   * Gets the information of a guild
   *
   * @param guildId - The ID of the guild to get
   *
   * @returns - The guildId, confessChannel, modChannel, and versionNote of the guild if it exists
   */
  public async getGuildInfo(guildId: string): Promise<Guild | null> {
    const result = await this.client.guild.findFirst({ where: { guildId } });
    result
      ? StoreMan.logger.log("Got guild:", result)
      : StoreMan.logger.log(`Did not find a guild for id ${guildId}.`);

    return result;
  }

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

    const ban = await this.client.ban.findFirst({
      where: { guildId, authorId }
    });

    if (ban) {
      StoreMan.logger.log(
        `User ${authorId} is banned from submitting confessions in guild ${guildId}`
      );
      return false;
    }

    const result = await this.client.confession.create({
      data: { id, messageId, author, authorId, guildId, content, attachment }
    });
    StoreMan.logger.log("Created confession:", result);

    return true;
  }

  public async getConfession(
    guildId: string,
    id: string
  ): Promise<Confession | null> {
    const result = await this.client.confession.findFirst({
      where: { guildId, id }
    });
    result
      ? StoreMan.logger.log("Got confession:", result)
      : StoreMan.logger.log(
          `Confession not found. (Guild: ${guildId}, Confession ID: ${id})`
        );

    return result;
  }

  public async getConfessions(guildId: string): Promise<Confession[]> {
    const result = await this.client.confession.findMany({
      where: { guildId }
    });
    StoreMan.logger.log(`Got confessions for guild ${guildId}:`, result);

    return result;
  }

  public async getConfessionById(
    guildId: string,
    messageId: string
  ): Promise<Confession | null> {
    const result = await this.client.confession.findFirst({
      where: { guildId, messageId }
    });
    result
      ? StoreMan.logger.log("Got confession:", result)
      : StoreMan.logger.log(
          `Confession not found. (Guild: ${guildId}, Message: ${messageId})`
        );

    return await this.client.confession.findFirst({
      where: { guildId, messageId }
    });
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
    const result = await this.client.confession.delete({
      where: { guildId, authorId, id }
    });

    result
      ? StoreMan.logger.log("Deleted confession:", result)
      : StoreMan.logger.log(
          `Unable to delete confession. (Guild: ${guildId}, Author: ${authorId}, Confession ID: ${id})`
        );

    // Don't need the result, just the presence of it, cast to boolean
    return !!result;
  }

  /**
   * Delete a confession from the database as an admin.
   *
   * @param guildId - The ID of the guild to delete from
   * @param id - The ID of the confession to delete
   */
  public async adminDelConfession(guildId: string, id: string): Promise<void> {
    const result = await this.client.confession.delete({
      where: { guildId, id }
    });
    StoreMan.logger.log("Deleted confession:", result);
  }

  // Check if a certain user is banned within a guild.
  public async isBannedByUser(
    guildId: string,
    authorId: string
  ): Promise<boolean> {
    const result = await this.client.ban.findFirst({
      where: { guildId, authorId }
    });
    StoreMan.logger.log(
      `Author ID ${authorId} is ${result ? "banned" : "not banned"} in guild ${guildId}.`
    );

    // Don't need the result, just the presence of it, cast to boolean
    return !!result;
  }

  public async isBannedById(
    guildId: string,
    confessionId: string
  ): Promise<boolean> {
    const result = await this.client.ban.findFirst({
      where: { guildId, confessionId }
    });
    StoreMan.logger.log(
      `Confession ID ${confessionId} is ${result ? "banned" : "not banned"} in guild ${guildId}.`
    );

    // Don't need the result, just the presence of it, cast to boolean
    return !!result;
  }

  public async getBans(guildId: string): Promise<Ban[]> {
    const result = await this.client.ban.findMany({ where: { guildId } });
    StoreMan.logger.log(`Got bans for guild ${guildId}:`, result);

    return result;
  }

  /**
   * Ban a user by confession id.
   *
   * @param guildId - The ID of the guild to ban from
   * @param confessionId - The ID of the confession to ban for
   */
  public async addBanById(
    guildId: string,
    confessionId: string
  ): Promise<boolean> {
    const alreadyBanned = await this.isBannedById(guildId, confessionId);

    if (alreadyBanned) {
      StoreMan.logger.log(
        `Confession ${confessionId} is already banned in guild ${guildId}`
      );
      return false;
    }

    const { authorId } = await this.client.confession.findFirstOrThrow({
      where: { guildId, id: confessionId }
    });
    const result = await this.client.ban.create({
      data: { guildId, authorId, confessionId, reason: BanReason.ById }
    });
    StoreMan.logger.log("Banned user:", result);

    return true;
  }

  public async addBanByUser(
    guildId: string,
    authorId: string
  ): Promise<boolean> {
    const alreadyBanned = await this.isBannedByUser(guildId, authorId);

    if (alreadyBanned) {
      StoreMan.logger.log(
        `User ${authorId} is already banned in guild ${guildId}`
      );
      return false;
    }

    const result = await this.client.ban.create({
      data: { guildId, authorId, reason: BanReason.ByUser }
    });
    StoreMan.logger.log("Banned user:", result);

    return true;
  }

  /**
   * Unban a user from confessions.
   *
   * @param guildId - The ID of the guild to reference
   * @param confessionId - The confession to unban for
   *
   * @returns True if the user was pardoned, false if otherwise
   */
  public async removeBanById(
    guildId: string,
    confessionId: string
  ): Promise<boolean> {
    const alreadyBanned = !(await this.isBannedById(guildId, confessionId));

    if (alreadyBanned) {
      return false;
    }

    const { authorId } = await this.client.ban.findFirstOrThrow({
      where: { guildId, confessionId }
    });
    const result = await this.client.ban.delete({
      where: { guildId, confessionId, authorId }
    });
    StoreMan.logger.log("Unbanned confession:", result);

    return true;
  }

  public async removeBanByUser(
    guildId: string,
    authorId: string
  ): Promise<boolean> {
    const alreadyBanned = !(await this.isBannedByUser(guildId, authorId));

    if (alreadyBanned) {
      return false;
    }

    StoreMan.logger.log(
      "Unbanned user:",
      await this.client.ban.delete({ where: { guildId, authorId } })
    );
    return true;
  }
}
