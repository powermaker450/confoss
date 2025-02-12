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
import Logger from "../utils/Logger";
import { GuildData, StoreMan } from "../storeman";
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();
const oldData: GuildData[] = JSON.parse(
  fs.readFileSync("./persist/data.json").toString()
);

async function migrate() {
  const dbGuilds = oldData.map(
    ({
      id: guildId,
      settings: { confessChannel, modChannel },
      versionNote
    }) => ({
      guildId,
      confessChannel,
      modChannel,
      versionNote: versionNote ?? StoreMan.VERSION_NOTE
    })
  );
  const dbConfessions = [];
  const dbBans = [];

  for (const {
    id: guildId,
    confessions,
    settings: { bans }
  } of oldData) {
    dbConfessions.push(
      ...confessions.map(confession => ({ ...confession, guildId }))
    );

    dbBans.push(
      ...bans.map(({ user: authorId, method: reason, confessionId }) => ({
        authorId,
        reason,
        confessionId,
        guildId
      }))
    );
  }

  await client.guild.createMany({ data: dbGuilds });
  await client.confession.createMany({ data: dbConfessions });
  await client.ban.createMany({ data: dbBans });
}

migrate()
  .then(() => Logger.log("Migration success."))
  .catch(err => {
    Logger.error("A migration error occured:", err);
  });
