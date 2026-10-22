# SQLite as GamePoll's store

Poll state, Expiry and Join history are persisted in a single SQLite file (`/var/lib/gamepoll/gamepoll.db`, path from `.env`), accessed through Node's built-in `node:sqlite`. GamePoll is one process with tiny volume, the VPS runs no Postgres (its MySQL serves only MediaWiki), and Forgejo on the same box already uses SQLite — so a file-backed store is the lightest to operate, manage with Ansible, and move between providers. Decided on [Store choice: Postgres vs SQLite](https://github.com/SirMoM/GamePoll/issues/26).

## Considered Options

- **Postgres**: matches the `pg` dependency, but means installing and upgrading a new database server for one small bot. `pg` stays in `package.json` (all deps are kept) but is deliberately unused.
- **The existing MySQL**: nothing to install, but couples GamePoll to MediaWiki's unmanaged server and still needs a new driver.
- **`better-sqlite3`**: more mature, but a native module; `node:sqlite` was chosen to avoid native builds.

## Consequences

- Requires Node ≥ 22.13. On Node 22 `node:sqlite` is experimental: it logs an `ExperimentalWarning` and its API may change, so the deploy pins the Node major.
- The app creates the database file itself on first start; systemd `StateDirectory=gamepoll` provides `/var/lib/gamepoll`, outside the `/opt/gamepoll` checkout so redeploys never touch it.
- Migrations are hand-rolled: numbered `migrations/NNN-*.sql` files applied in transactions, versioned with `PRAGMA user_version`, run by `npm run migrate` and on startup. No migration library is expected to replace it.
