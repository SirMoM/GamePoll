# discord.js 14.11 → 14.27: what breaks or is deprecated in GamePoll

Research for [#24](https://github.com/SirMoM/GamePoll/issues/24) (part of the modernization map [#23](https://github.com/SirMoM/GamePoll/issues/23)).
Researched 2026-10-22 against `origin/main` @ `bd1a47f`.

## TL;DR

- **Two compile breaks** (TypeScript only, no runtime breaks): `CommandInteraction.options` is gone from the typings (since 14.20.0), and `ButtonInteraction.component.label` no longer type-checks (since 14.16.0). Both are small, mechanical fixes.
- **Three runtime deprecation warnings** worth fixing in the same change: the `ready` event (use `clientReady`), the `ephemeral` reply option (use `flags: MessageFlags.Ephemeral`), and `Role#color` (use `Role#colors`).
- **Node**: 14.27.0 declares `>=18`. Its pinned `undici@^6.27.0` actually needs **`>=18.17`**. The VPS runs Node 22, so nothing needs to change there.
- **Sequencing**: do the upgrade as **one direct jump with its fixups in the same commit**, and do it **before** the persistence and UI rework. The deploy runs `npm ci && tsc`, so a lockfile bump that ships without the fixes fails the build.
- Found while researching, not caused by the upgrade: the role-ID parsing in `handleInteractionCreate.ts:50-52` is broken on 14.11 too, so per-game `rosterSize` never applies (details below).

## Method

1. Read the GitHub release notes for every tag from `14.12.0` through `14.27.0` (42 releases) with `gh release view <tag> -R discordjs/discord.js`.
2. Got `engines.node` and dependency pins for each version with `npm view discord.js@'>=14.11.0 <=14.27.0' version engines.node dependencies`.
3. Unpacked the `discord.js@14.11.0` and `@14.27.0` tarballs and read the source and typings directly (`src/structures/interfaces/InteractionResponses.js`, `src/client/websocket/WebSocketManager.js`, `src/structures/Role.js`, `src/structures/MessageMentions.js`, `typings/index.d.ts`).
4. **Ran the compiler.** In a scratch copy of `main` I ran `npm ci` (14.11.0 from the lockfile), and `tsc --noEmit` came back clean. I then installed each of 14.12.1, 14.13.0, 14.14.1, 14.15.3, 14.16.3, 14.17.3, 14.18.0, 14.19.3, 14.20.0, … 14.27.0 and re-ran `tsc --noEmit` each time to find the release that introduced each error.

## Required fixups (compile breaks)

### 1. `CommandInteraction` has no `options` — since **14.20.0**

```
src/command/GamePoll.ts(90,34):  error TS2339: Property 'options' does not exist on type 'CommandInteraction<CacheType>'.
… also lines 91, 96, 97, 98, 99, 100
```

- Cause: [discordjs/discord.js#10908 "feat: backport entrypoint command"](https://github.com/discordjs/discord.js/pull/10908) (14.20.0 release notes: "Backport entrypoint command"). It added `PrimaryEntryPointCommandInteraction`, which has no options, as a `CommandInteraction` subclass. `options` therefore moved off the abstract base and onto `ChatInputCommandInteraction` / `ContextMenuCommandInteraction` (`typings/index.d.ts` 14.27.0: `abstract class CommandInteraction` at l.640 has no `options`; `ChatInputCommandInteraction` declares it at l.1372).
- GamePoll uses the base type in three places:
  - `src/command/Command.ts:5`: `run: (client, interaction: CommandInteraction) => void`
  - `src/handleInteractionCreate.ts:9`: `interaction.isCommand() || interaction.isContextMenuCommand()` dispatches to `handleSlashCommand(client, interaction: CommandInteraction)` (l.19-22)
  - `src/command/GamePoll.ts:88`: `run: async (client, interaction: CommandInteraction)`
- **Fix**: type `run` with `ChatInputCommandInteraction` and dispatch with `interaction.isChatInputCommand()`. GamePoll only has one slash command and no context-menu commands. The typed resolver also lets `GamePoll.ts:90-100` use `options.getRole("role", true)`, `options.getString("time", true)` and `options.getBoolean(opPoem) ?? false` in place of the `get(...).value as boolean` casts. This is optional but tidier.

### 2. `interaction.component.label` — since **14.16.0**

```
src/handleInteractionCreate.ts(13,61): error TS2339: Property 'label' does not exist on type 'APIButtonComponent | ButtonComponent'.
  Property 'label' does not exist on type 'APIButtonComponentWithSKUId'.
```

- Cause: premium (SKU) buttons, which have no label, joined the `APIButtonComponent` union ([#10353 "feat: Premium buttons"](https://github.com/discordjs/discord.js/pull/10353), 14.16.0; the union comes from `discord-api-types`, pinned to `0.37.97` from 14.16.0). The error also showed up briefly on 14.12.x, whose `discord-api-types` range was unpinned (`^0.37.50`).
- Line: `src/handleInteractionCreate.ts:13`, `LOG.info(\`Handle button ${interaction.component.label ?? ""}\`)`
- **Fix**: log `interaction.customId`, which carries more information anyway. Alternatively, narrow with `"label" in interaction.component`.

Both errors appear with the repo's TypeScript 5.0.4 under `skipLibCheck: true`. No other file fails to compile.

## Deprecations worth acting on (runtime warnings)

These still work on 14.27.0, but each one prints a `process.emitWarning` to the journal once per process. Each one is removed in v15.

| Where | What | Since | Replace with | Source |
|---|---|---|---|---|
| `src/bot.ts:21` | `client.on("ready", …)` | 14.22.0 | `client.once(Events.ClientReady, …)` (`"clientReady"`) | [#10969](https://github.com/discordjs/discord.js/pull/10969); `WebSocketManager.js` emits *"The ready event has been renamed to clientReady … will only emit under that name in v15"* |
| `src/handleInteractionCreate.ts:42` | `interaction.reply({ ephemeral: true, … })` | 14.17.0 | `flags: MessageFlags.Ephemeral` | [#10574](https://github.com/discordjs/discord.js/pull/10574); `InteractionResponses.js#reply` warns *"Supplying \"ephemeral\" … is deprecated. Utilize flags instead."* |
| `src/command/GamePoll.ts:147` | `followUp({ ephemeral: false, … })` | 14.17.0 | delete the line, since `false` is the default | typed `@deprecated` (`InteractionReplyOptions.ephemeral`, typings l.7226). `followUp` doesn't emit the runtime warning (`InteractionResponses.js:274` goes straight to `webhook.send`) |
| `src/command/GamePoll.ts:181` | `.setColor(role.color)` | 14.22.0 | `role.colors.primaryColor` | [#10986 "Role gradient colours"](https://github.com/discordjs/discord.js/pull/10986); `Role.js`: `@deprecated Use Role#colors instead` (reading it emits no runtime warning) |

Not deprecated, no action needed: `MessageMentions.RolesPattern` (unchanged, see below), `ActionRowBuilder` / `ButtonBuilder` / `ButtonStyle`, `EmbedBuilder` / `EmbedBuilder.from` / `setFields` / `addFields`, `ApplicationCommandType` / `ApplicationCommandOptionType`, `client.application.commands.set(Commands, guildId)`, `new Client({ intents: [] })`, `ActivityType.Watching`, `interaction.update`, `deferReply()` with no options, `isCommand()` (still present: typings l.2210), `Message#embeds[0].fields`.

A few deprecations GamePoll doesn't touch: `fetchReply` → `withResponse` (14.17), `Message#interaction` → `interactionMetadata` (14.16), `fetchPinned` → `fetchPins` (14.22), guild-ownership APIs (14.23), `Role#setColor` → `setColors` (14.22).

## Minimum Node version for 14.27

- `discord.js@14.27.0` `engines.node` is **`>=18`**. The jump from `>=16.11.0` happened in **14.16.0**. For history: 14.11–14.12 needed `>=16.9.0` and 14.13–14.15 needed `>=16.11.0` (release note 14.13.0: "Update Node.js requirement to 16.11.0 (#9764)").
- The effective floor is **Node 18.17**, because 14.27.0 depends on `undici@^6.27.0`, whose `engines.node` is `>=18.17`. Other packages: `@discordjs/rest@2.6.2` needs `>=18` and `@discordjs/ws@1.2.3` needs `>=16.11.0`.
- Node 18 is end-of-life, so use **Node 22 LTS**. The VPS already runs it: `SirMoM/vps` `ansible/gamepoll-deploy.yml` notes "the VPS's Node 22" and runs `/usr/bin/node`. Consider adding `"engines": { "node": ">=22" }` to `package.json` so the requirement is written down.
- TypeScript: the 14.27 typings (and `@discordjs/ws`) reference `AsyncDisposable` / `Symbol.asyncDispose` (the `using` support added in 14.15.0). With the repo's TS 5.0.4 this compiles only because `skipLibCheck: true`. With lib checking on, it fails with 8 errors in `node_modules`. Bumping to TS ≥ 5.2 removes the dependency on `skipLibCheck` but isn't required.

## `MessageMentions.RolesPattern` and a pre-existing bug

`RolesPattern` is identical in both versions (`static RolesPattern = FormattingPatterns.Role`). It is `/<@&(?<id>\d{17,20})>/` in both `discord-api-types@0.37.41` and `@0.38.49`: non-global, with a named capture group. The upgrade doesn't change it.

The usage at `src/handleInteractionCreate.ts:50-52` is broken on both versions, though:

```ts
const roleAsString = message.content.match(MessageMentions.RolesPattern)?.pop() // -> "273804549234622464" (the capture group, not "<@&…>")
const roleID = roleAsString.substring(3, roleAsString.length-1)                  // -> "8045492346224646" (truncated)
```

A non-global `match` returns `[fullMatch, id]`, so `.pop()` returns the bare ID. The code then strips 3+1 characters it assumes are `<@&` and `>`. I checked this in Node: `"<@&273804549234622464> um 20 Uhr!".match(/<@&(?<id>\d{17,20})>/).pop().substring(3)` returns `"804549234622464"`. So `getGameConfigFromTag(roleID)` never matches, and every button press uses `defaultGameConfig`, which means per-game `rosterSize` limits never apply. **Fix**: `const roleID = message.content.match(MessageMentions.RolesPattern)?.groups?.id`. This parsing goes away anyway once Poll state is persisted (the map replaces the embed-as-database with stored state). Until then it's a one-line fix that can go in with the upgrade.

## Other observations (not upgrade-related)

- `src/command/GamePoll.ts:40` declares `autocomplete: true` on the `time` option, but nothing handles `isAutocomplete()` interactions, so Discord shows "Loading options failed" while the user types. Either drop the flag or add a handler. This belongs with the UI-improvements ticket.
- `src/bot.ts:24-27`: `setActivity(…, { url })` only has an effect for `ActivityType.Streaming`. The URL is ignored for `Watching`. Harmless.

## New in 14.12–14.27 that's relevant to the UI-improvements ticket

- **Components v2** (14.19.0, "Components v2 in v14 (#10781)"): containers, sections, text displays, media galleries. Most relevant to replacing the embed-based Roster/Backup layout.
- **Modals**: text display and select menus in modals (14.23.0), file upload (14.24.0), radio group and checkbox (14.26.0).
- **Native Discord polls** (14.15.0; overhaul in 14.23.0): `Message#poll`, `PollAnswer#fetchVoters`.
- `Events.ClientReady` / `clientReady`, `MessageFlags.Ephemeral`, and `withResponse` are the current idioms for the persistence and UI rework.

## How this affects sequencing

1. **Upgrade first, as its own small ticket, in one direct jump 14.11 → 14.27.** No release in between needs a stop: every break is type-only, and I bisected them to exactly two releases (14.16, 14.20). Bump `discord.js`, regenerate `package-lock.json`, and apply fixups 1-2 plus the four deprecation swaps in the **same commit**.
2. **The lockfile bump and the code fixes must ship together.** `gamepoll-deploy.yml` runs `npm ci --include=dev` followed by `./node_modules/.bin/tsc`. `tsc` exits non-zero on the two TS2339 errors, which fails the play. Because of `^14.11.0`, anyone who runs plain `npm install` or `npm run upg` without a lockfile gets 14.27 and the same failure.
3. **Do the upgrade before the persistence, expiry and UI work.** That work rewrites `handleInteractionCreate.ts` and `GamePoll.ts`, so it should be written straight against `ChatInputCommandInteraction`, `clientReady`, `MessageFlags`, and (if chosen) Components v2, not against APIs that are already deprecated.
4. Nothing to do on the VPS for Node (already on 22). If the deploy ever changes Node, keep it at ≥ 18.17. Use 22 LTS.

## Sources

- Releases: https://github.com/discordjs/discord.js/releases (tags `14.12.0` … `14.27.0`, read via `gh release view`)
- npm registry metadata: `npm view discord.js@<v> engines.node dependencies`; `npm view undici@6.27.0 engines`; `npm view @discordjs/rest@2.6.2 engines`; `npm view @discordjs/ws@1.2.3 engines`
- Package source/typings: `discord.js-14.27.0.tgz` and `discord.js-14.11.0.tgz` from npm; `discord-api-types` `0.37.41` / `0.38.49` `globals.js` (`FormattingPatterns.Role`)
- PRs: [#10908](https://github.com/discordjs/discord.js/pull/10908), [#10353](https://github.com/discordjs/discord.js/pull/10353), [#10969](https://github.com/discordjs/discord.js/pull/10969), [#10574](https://github.com/discordjs/discord.js/pull/10574), [#10986](https://github.com/discordjs/discord.js/pull/10986)
- Docs: https://discord.js.org/docs/packages/discord.js/14.27.0 (`CommandInteraction`, `ChatInputCommandInteraction`, `Role#colors`, `Events.ClientReady`)
- Deploy: `SirMoM/vps` `ansible/gamepoll-deploy.yml`
