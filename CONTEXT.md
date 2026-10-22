# GamePoll

A Discord bot for asking a group who's playing a game at a given time, and collecting the answers.

## Language

**Poll**:
One `/gp` message asking a Discord role whether they'll play its game at a given time, plus the answers collected on it.
_Avoid_: vote, survey, message

**Game**:
What a Poll is about, identified by the Discord role it pings (with per-game settings such as colour and image).
_Avoid_: role (the role is how a Game is addressed, not the Game itself)

**Player**:
A Discord user who has answered a Poll, either on its Roster or its Backup.

**Roster**:
The Players on a Poll who committed to play ("Bin dabei").
_Avoid_: team, lineup

**Backup**:
The Players on a Poll who are undecided ("Ich weiß nicht") — maybe in, not committed. Always this list, never a copy of data.
_Avoid_: stand-in, reserve, data backup

**Backup-only Poll**:
A Poll where every answer lands on the Backup; nobody commits to a Roster.

**Expiry**:
The moment a Poll stops accepting answers (default lifetime 24h).
_Avoid_: persistence, timeout

**Join history**:
The recorded record of which Players answered which Polls, kept after the Poll expires.
_Avoid_: stats (stats are a view over the Join history)

## Relationships

- A **Poll** is about exactly one **Game**
- A **Poll** has one **Roster** and one **Backup**; a **Player** is on at most one of them per Poll
- A **Poll** belongs to one Discord server (guild)
- **Join history** outlives the **Poll** it was recorded from

## Flagged ambiguities

- "Backup" was briefly read as a stand-in player, and could be confused with data backups — resolved: it means only the undecided list. Data backups are not a GamePoll concept.
