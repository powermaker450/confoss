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

export interface Confession {
  id: string;
  messageId: string;
  author: string;
  authorId: string;
  content: string;
  attachment?: string;
}

export interface ConfessionBan {
  user: string;
  confessionId: string;
}

export interface GuildSettings {
  confessChannel: string;
  modChannel?: string;
  bans: ConfessionBan[];
}

export interface GuildData {
  id: string;
  confessions: Confession[];
  settings: GuildSettings;
}
