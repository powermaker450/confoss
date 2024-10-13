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
  ActionRowBuilder,
  ModalActionRowComponentBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} from "discord.js";

const submit = new ModalBuilder()
  .setCustomId("submitConfession")
  .setTitle("Submit Confession");

const confessionInput = new TextInputBuilder()
  .setCustomId("confessionInput")
  .setLabel("Confession")
  .setRequired(true)
  .setMaxLength(2000)
  .setStyle(TextInputStyle.Paragraph);

const attachmentInput = new TextInputBuilder()
  .setCustomId("confessionAttachment")
  .setLabel("Attachment (optional)")
  .setRequired(false)
  .setStyle(TextInputStyle.Short);

const confessionRow =
  new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
    confessionInput
  );

const attachmentRow =
  new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
    attachmentInput
  );

submit.addComponents(confessionRow, attachmentRow);

export { submit };
