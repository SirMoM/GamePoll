# Modern Discord components for a Poll bot

Research for [#25](https://github.com/SirMoM/GamePoll/issues/25), part of the map [#23](https://github.com/SirMoM/GamePoll/issues/23).
Question: what do string/user/role selects, Components V2, autocomplete and modals offer GamePoll as of discord.js 14.27, what are their hard limits, and can each replace the current embed Roster + two-button UI?

This note lays out options and constraints only. **Which UI ships is decided by the later prototype ticket.**

Researched 2026-10-22. Terms follow `CONTEXT.md` (Poll, Roster, Backup = the undecided list, Player, Expiry).

## Sources

- **[REF]** Discord, Component Reference — https://docs.discord.com/developers/components/reference
- **[OVR]** Discord, Components Overview — https://docs.discord.com/developers/components/overview
- **[UMC]** Discord, Using Message Components — https://docs.discord.com/developers/components/using-message-components
- **[UMOD]** Discord, Using Modal Components — https://docs.discord.com/developers/components/using-modal-components
- **[RR]** Discord, Receiving and Responding to Interactions — https://docs.discord.com/developers/interactions/receiving-and-responding
- **[CMD]** Discord, Application Commands — https://docs.discord.com/developers/interactions/application-commands
- **[MSG]** Discord, Message resource (Create/Edit Message) — https://docs.discord.com/developers/resources/message
- **[DJS-DC]** discord.js guide, Display Components — https://discordjs.guide/legacy/popular-topics/display-components
- **[DJS-AC]** discord.js guide, Autocomplete — https://discordjs.guide/legacy/slash-commands/autocomplete
- **[DJS-REL]** discord.js GitHub releases (`gh release view <tag> -R discordjs/discord.js`)
- **[CODE]** this repo: `src/command/GamePoll.ts`, `src/handleInteractionCreate.ts` (origin/main `bd1a47f`)

`discord.com/developers/docs/*` now 301-redirects to `docs.discord.com/developers/*`.

## Today's UI (baseline) [CODE]

- `/gp` defers (`deferReply`), then `followUp` sends one legacy message: `content` = role mention + time (+ poem / quote / figlet "large time"), one **embed** (title, description, game thumbnail, colour = role colour, two inline fields "Roster" and "Backup"), and one action row with two buttons: `imIn` ("Bin dabei", Success) and `backup` ("Ich weiß nicht (Backup)", Secondary).
- Button click: the handler **parses the role ID out of `message.content`** and the Player lists out of `embeds[0].fields`, toggles the user, and answers with `interaction.update({ embeds })` (callback type 7, UPDATE_MESSAGE). The message is the database.
- The `time` option declares `autocomplete: true`, but `handleInteractionCreate.ts` only branches on `isCommand()/isContextMenuCommand()` and `isButton()`. **No autocomplete handler exists**, so Discord's client gets no suggestions (the user just types freely; the autocomplete interaction is dropped and times out after 3 s). See §4.
- Embed limits that bind today: field value max **1024** chars, 25 fields, 6000 chars total across all embeds [MSG]. A Roster is a newline-joined list of `<@id>` mentions (~22 chars each), so a field fits roughly 45 Players.

## Version timeline in discord.js v14 [DJS-REL]

| Feature | discord.js | Released |
|---|---|---|
| Components V2 (containers, sections, text display, media gallery, separator, file, thumbnail) | **14.19.0** (#10781) | 2025-04-26 |
| Text display + user/role/mentionable/channel selects **in modals** (Label) | **14.23.0** (#11096) | 2025-10-08 |
| File upload in modals | 14.24.0 (#11179) | 2025-10-24 |
| Radio group + checkbox (group) in modals | 14.26.0 (#11437) | 2026-03-31 |
| current target | 14.27.0 | 2026-07-15 |

Note: the ticket text says "Components V2 — discord.js 14.16+"; the release notes put it at **14.19.0**. All of it is available on the 14.27 target. String selects, user/role selects, buttons and basic text-input modals predate 14.11 and are usable today.

## 1. Select menus (string / user / role)

**Capabilities**
- String select: up to **25** options, each with label/value/description (**100** chars each), optional emoji; multi-select via `min_values`/`max_values` (0–25) [REF].
- User / Role / Mentionable / Channel selects: Discord fills the options itself (searchable member/role picker). `default_values` can pre-select entries; count must lie within `min_values`–`max_values`, both max **25** [REF].
- Usable in **messages** (inside an Action Row) and, since the modal update, **in modals** (inside a Label) [REF].

**Hard limits**
- One select per Action Row; an Action Row holds either up to 5 buttons **or** one select [REF].
- `custom_id` 1–100 chars, placeholder max 150 [REF].
- `required` only matters in modals; `disabled: true` errors in modals [REF].
- Legacy messages: max **5** top-level Action Rows [REF].

**Fit for GamePoll**
- *String select as answer picker* (e.g. "Bin dabei" / "Ich weiß nicht" / "Raus"): can replace the two buttons — one interaction, same `UPDATE_MESSAGE` flow. Costs one extra click (open, pick) versus a button, and a select in a shared message does not show "your" answer per Player — every viewer sees the same component. It does allow a third explicit state ("leave"), which the toggle buttons express only implicitly (click again).
- *Role select*: could replace the `role` slash option, but only inside a modal or a follow-up step; the slash option already gives a native role picker, so there is little to gain.
- *User select*: a Poll author could pre-fill/invite Players (`default_values`), or a "add someone to the Roster" admin action. Not a replacement for self-service answering — a user select lets anyone pick *other* users.
- **Verdict:** can replace the buttons, not the Roster display. Buttons remain the lowest-friction answer control.

## 2. Components V2 (`IS_COMPONENTS_V2`)

**What it is**
- Message flag `1 << 15` (32768). Layout components: Container (17), Section (9), Text Display (10), Thumbnail (11), Media Gallery (12), File (13), Separator (14); Action Rows/Buttons/Selects still work inside [REF][OVR].
- discord.js builders: `ContainerBuilder`, `SectionBuilder`, `TextDisplayBuilder`, `ThumbnailBuilder`, `MediaGalleryBuilder` (+ `MediaGalleryItemBuilder`), `SeparatorBuilder`, `FileBuilder`; send with `flags: MessageFlags.IsComponentsV2` [DJS-DC].

**Per-component capabilities and limits** [REF]
- **Container**: rounded box, `accent_color` 0x000000–0xFFFFFF (can keep the role colour), `spoiler`. Children: Action Row, Text Display, Section, Media Gallery, Separator, File. Messages only.
- **Section**: **1–3** Text Displays plus one accessory, which is **either** a Button **or** a Thumbnail (not both). Messages only.
- **Text Display**: markdown text; works in messages and modals. No per-component length on the reference page; the discord.js guide states the **total across all Text Displays ≤ 4000 chars** [DJS-DC]. Mentions inside Text Display **do ping** users/roles, governed by `allowedMentions` [DJS-DC].
- **Thumbnail**: image only (incl. animated GIF/WebP, no video), alt text ≤ 1024, Section accessory only.
- **Media Gallery**: **1–10** items, description ≤ 1024 each.
- **Separator**: `divider` (default true), `spacing` 1 small / 2 large.
- **File**: one `attachment://` file per component.

**Message-level hard limits**
- Max **40 components per message, nested ones included** [REF][DJS-DC].
- Text Display total ≤ **4000** chars [DJS-DC] — vs 1024 per embed field today, so a Roster can be ~4× longer.
- With the flag set, `content`, `embeds`, `poll` and `stickers` **cannot be sent** (400 on create); on edit `content`/`poll` must be `null` and `embeds`/`sticker_ids` `[]` [MSG]. **V2 cannot be mixed with embeds or `content`.**
- Attachments are not rendered unless referenced by a component [REF].
- **The flag cannot be removed** once set; Edit Message can only *set* it [MSG][UMC]. discord.js: "can't opt out when editing; can opt in by nulling content/poll/embeds/stickers" [DJS-DC]. Existing legacy Polls could in principle be converted in place; new V2 Polls can never go back.
- Interaction responses: `IS_COMPONENTS_V2` is a settable response flag alongside `EPHEMERAL`; it works on follow-ups and edit-original; Discord recommends creating V2 interaction messages via edit original response [RR]. discord.js: no need to set the flag on the `deferReply` itself [DJS-DC]. GamePoll's defer → followUp path is compatible.
- Ephemeral state of a message can't be changed later; after a defer, only `EPHEMERAL` may be set on the defer, and the defer's ephemerality wins [RR].
- Updating on button click (`interaction.update`, type 7) must resend the **whole component tree** (there's no `embeds`/`content` to patch separately).

**Fit for GamePoll**
- Can fully replace embed + `content`. A plausible tree, ~8–10 of 40 components:
  Container(accent = role colour) → Section[Text Display "title / time / @role", accessory Thumbnail = game image] → Separator → Text Display "Roster (n/m)…" → Text Display "Backup…" → Action Row[two buttons].
- Section accessory **Button** allows per-row buttons (e.g. a "Bin dabei" button next to the Roster text and "Ich weiß nicht" next to the Backup text) — but then that Section can't also carry the thumbnail.
- **Losses / gotchas:**
  - No side-by-side columns: embed `inline` fields have no V2 equivalent; Roster and Backup stack vertically.
  - No embed footer/timestamp — the "… sucked!" footer and `setTimestamp()` must become Text Display (e.g. `<t:unix:R>` markdown timestamps).
  - The role mention moves from `content` into a Text Display; it still pings, but `handleInteractionCreate.ts` currently parses the role from `message.content`, and `manageRoster` parses `embeds[0].fields`. **Both break under V2** — reading state from the message becomes impractical, which aligns with the map's persisted-state decision rather than conflicting with it.
  - Native Discord `poll` is unavailable on V2 messages (not used today).
  - The figlet "large time" code block counts against the 4000-char total instead of the 2000-char `content`.
- **Verdict:** can replace the embed-roster entirely, and keeps the buttons. One-way door per message; requires state outside the message.

## 3. Modals

**Capabilities**
- Opened only as the **first** response (callback type 9) to a slash command or component interaction; **not** in response to a modal submit or ping [RR]. (Opening a modal after `deferReply` is therefore impossible — GamePoll's handler defers every command before `run`.)
- Top-level: **1–5** components; title ≤ **45**; `custom_id` 1–100 [RR].
- Current model wraps each input in a **Label** (`label` ≤ 45, `description` ≤ 100, exactly one child) [REF]. Label children: Text Input, String/User/Role/Mentionable/Channel Select, File Upload, Radio Group, Checkbox Group, Checkbox. Text Display is allowed directly in modals [REF].
- Text Input: Short/Paragraph, `value`/`min_length`/`max_length` up to **4000**, placeholder ≤ 100; Text Input in an Action Row is deprecated [REF].
- Radio Group 2–10 options; Checkbox Group 1–10; Checkbox can't be required; File Upload 0–10 files [REF].
- Modal-only: Text Input, Label, File Upload, Radio/Checkbox [REF].
- Submit arrives as a MODAL_SUBMIT interaction; valid responses are a message, deferred message, or (when opened from a component) `UPDATE_MESSAGE` / `DEFERRED_UPDATE_MESSAGE` [RR]. Also subject to the 3 s / 15 min token rules.

**Fit for GamePoll**
- Not a replacement for the Roster or the answer buttons — modals are private, single-user forms.
- Useful for **Poll creation** instead of six slash options: one form with time (Text Input), game (Role Select), and flags (Checkbox Group: poem / short / backup-only / LIN / large time) — needs 14.23+ for selects in modals and 14.26+ for checkboxes. Constraint: the command handler must not defer before showing it.
- Useful for per-answer extras (e.g. "Bin dabei, but late — note"), opened from a button.

## 4. Autocomplete

**Capabilities** [CMD][DJS-AC]
- Only on `STRING`, `INTEGER`, `NUMBER` options; mutually exclusive with static `choices`.
- The app receives the partially typed value (focused option flagged `focused: true`) and replies with **≤ 25** choices (callback type 8); name 1–100 chars, string value ≤ 100.
- Must answer within **3 s**; **cannot be deferred**. Responding with `[]` shows "No options match your search."
- **Suggestions are not enforced** — the user can submit any string, so the command must still validate `time`.
- discord.js: `interaction.isAutocomplete()`, `interaction.options.getFocused(true)`, `interaction.respond(choices)`; role/user getters are unavailable during autocomplete.

**The dead `time` autocomplete**
- `GamePoll.ts` sets `autocomplete: true` on `time`; nothing handles `AutocompleteInteraction`. Options for the spec: (a) implement a handler (e.g. suggest "20:00", "heute 20:00", next half-hours, parsed into a normalised time or `<t:…>` timestamp); (b) drop `autocomplete` to make the option a plain free-text string; (c) switch to static `choices` (max 25, then enforced). Note `handleSlashCommand` branches on `isCommand()`; an autocomplete branch must run *before* any defer and respond inside 3 s.
- **Verdict:** a creation-time aid only; irrelevant to the Roster UI. Also relevant to the "large-time" and Expiry open questions, since a parsed time is what an Expiry or a Discord timestamp would need.

## Summary matrix

| Option | Replaces embed Roster? | Replaces 2 buttons? | Key hard limits | discord.js |
|---|---|---|---|---|
| Buttons (today) | – | – | 5 per row, label ≤ 80, custom_id ≤ 100 | any v14 |
| String select | No | Yes (+1 click, adds explicit "leave") | 25 options, 100-char label/value, 1 select per row | any v14 |
| User / role select | No | No (picks *others*) | 25 values, default_values | any v14 (modal use 14.23+) |
| Components V2 | **Yes** | Keeps them (or Section-accessory buttons) | 40 components incl. nested, 4000 text chars, no content/embeds/poll, flag irreversible, no inline columns | 14.19+ |
| Modal | No | No | first response only (no defer), 1–5 top-level, title 45, Label 45/100 | Labels+selects 14.23+, checkboxes 14.26+ |
| Autocomplete | No | No | 25 choices, 3 s, no defer, not enforced | any v14 |

## Open questions for the prototype ticket

- V2 Container vs keeping the embed: is the loss of side-by-side Roster/Backup acceptable?
- Buttons in one Action Row vs Section-accessory buttons next to each list.
- Modal-based Poll creation vs slash options (requires removing the blanket `deferReply`).
- Convert existing (pre-upgrade) legacy Polls to V2 in place, or leave them legacy until Expiry.
- Unverified in primary docs: per-Text-Display length (the 4000 figure comes from the discord.js guide as a message total; Discord's reference page gives none) — confirm empirically in the prototype.
