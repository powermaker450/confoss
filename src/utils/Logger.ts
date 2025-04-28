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

import { green, yellow, red, bold } from "chalk";
import { LOG_LEVEL } from "./config";

export default class Logger {
  private main: string;
  public readonly name: string;
  private readonly isMain: boolean;

  private static mainDeclared = false;
  public static readonly loglevel = +LOG_LEVEL;
  private static readonly wrn = yellow("[WARN] ");
  private static readonly err = red("[ERROR] ");
  private static readonly main = bold.gray(
    `[ConfessBot | ${green("Anonymous ")}] `
  );

  constructor(origin?: string) {
    if (origin === "Main" && Logger.mainDeclared) {
      throw new Error("Main Logger has already been instantiated.");
    }

    this.name = origin ?? "Anonymous";
    this.isMain = this.name === "Main";
    Logger.mainDeclared = this.name === "Main";

    this.main = bold.gray(`[ConfessBot | ${green(this.name)}] `);
  }

  public log(...args: any[]): void {
    (this.isMain || Logger.loglevel > 2) && console.log(this.main, ...args);
  }

  public static log(...args: any[]): void {
    this.loglevel > 2 && console.log(this.main, ...args);
  }

  public warn(...args: any[]): void {
    Logger.loglevel > 1 && console.warn(Logger.wrn + this.main, ...args);
  }

  public static warn(...args: any[]): void {
    this.loglevel > 1 && console.warn(this.wrn, ...args);
  }

  public error(...args: any[]): void {
    console.error(Logger.err + this.main, ...args);
  }

  public static error(...args: any[]): void {
    console.error(this.err + this.main, ...args);
  }
}
