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

import chalk from "chalk";
import { LOG_LEVEL } from "./config";

export default class Logger {
  private _main: string;
  public readonly _loglevel = +LOG_LEVEL;
  public readonly name: string;
  private readonly isMain: boolean;

  public static readonly emp = chalk.green;
  public static readonly wrn = chalk.yellow;
  public static readonly err = chalk.red;

  public static readonly bold = chalk.bold;
  public static readonly itl = chalk.italic;
  public static readonly udln = chalk.underline;

  private static readonly _wrn = Logger.wrn("[WARN] ");
  private static readonly _err = Logger.err("[ERROR] ");

  public static readonly anon = Logger.bold.gray(
    `[ConfessBot | ${Logger.emp("Anonymous ")}] `
  );

  constructor(origin?: string) {
    this.name = origin ?? "Anonymous";
    this.isMain = this.name === "Main";

    this._main = Logger.bold.gray(`[ConfessBot | ${Logger.emp(this.name)}] `);
  }

  private static argDet(args: any[]): any | any[] {
    return args.length === 1 ? args : args[0];
  }

  public log(text?: any, ...args: any[]): void {
    if (this.isMain || this._loglevel > 2) {
      args.length
        ? console.log(this._main + text, Logger.argDet(args))
        : console.log(this._main + text);
    }
  }

  public static log(text?: any, ...args: any[]): void {
    args.length
      ? console.log(Logger.anon + text, Logger.argDet(args))
      : console.log(Logger.anon + text);
  }

  public warn(text?: any, ...args: any[]): void {
    if (this._loglevel > 1) {
      args.length
        ? console.warn(Logger._wrn + this._main + text, Logger.argDet(args))
        : console.warn(Logger._wrn + this._main + text);
    }
  }

  public static warn(text?: any, ...args: any[]): void {
    args.length
      ? console.warn(Logger._wrn + Logger.anon + text, Logger.argDet(args))
      : console.warn(Logger._wrn + Logger.anon + text);
  }

  public error(text?: any, ...args: any[]): void {
    args.length
      ? console.error(Logger._err + this._main + text, Logger.argDet(args))
      : console.error(Logger._err + this._main + text);
  }

  public static error(text?: any, ...args: any[]): void {
    args.length
      ? console.error(Logger._err + Logger.anon + text, Logger.argDet(args))
      : console.error(Logger._err + Logger.anon + text);
  }
}
