![GitHub](https://img.shields.io/github/license/SirMoM/GamePoll?style=for-the-badge)
# GamePoll

A discord bot for polling/finding people to play with.


Commands: !gp, !gpg, !gpp, !gphelp
```
usage:
    !gp <time> <game_tag>
        Creates a message with a game poll and reactions!
        The arguments are:
            time        The time when you want to play the game.
                        Examples: 21:00, now
            game_tag    The tag that specifies who gehts notified.
                        Examples: @Sir.MoM

    !gp --help
        Shows the help for the !gp command

    !gpp <time> <game_tag>
        Creates a message with a game poll and reactions!
        This command persists the poll so it can be used after the bot was restarted/logged out!
        The arguments are:
            time        The time when you want to play the game.
                        Examples: 21:00, now
            game_tag    The tag that specifies who gehts notified.
                        Examples: @Sir.MoM

    !gpg --help
        Shows the help for the !gp command
            !gp <time> <game_tag>
        Creates a message with a game poll and reactions!
        This command adds a poem to the poll. (This is an inside joke don't use it...) 
        The arguments are:
            time        The time when you want to play the game.
                        Examples: 21:00, now
            game_tag    The tag that specifies who gehts notified.
                        Examples: @Sir.MoM

    !gpg --help
        Shows the help for the !gp command
```

# Manipulation the data via REST-endpoints

You can see the endpoints [here](https://petstore.swagger.io/?url=https://raw.githubusercontent.com/SirMoM/GamePoll/main/openapi.yaml).

## Endpoints

* /config
  * get
* /past_messages
  * get
  * post
  * delete
  
# Bot configuration
Json file with the following attributes:

* generic-game-poll: generic information for the polls
  * title: The title of the Poll
  <br> Example: `"Who want's to play"`
  * time-text: The text encapsulating the time to poll for. The place for the time is marked by **`{time}`**.
  <br> Example: `"Let's play at {time}!"`
  * additional-text: Flavor text for the poll
  * explain-emojis: Text to explay the use of the reaction emojis
  <br> Example: `"✅ = bin dabei!\n🅱️ = ich weiß nicht (Backup)!"`
* games: Configuration for specefic games
  * `<EntryName>`
    * tag: id for the people to tag, the game is determined by this
    * thumbnails: An array full of thumbnails to use for the poll banner (this is game specific)
    * roster-size: Number of people for the roster, the accses are put in backup
    * color: Color of the Poll as a hex string

Example: 
```
"LOL": {
    "tag": "714530690988769281",
    "thumbnails": ["https://pbs.twimg.com/media/D7wrK9pXoAEKfxh.png"],
    "roster-size": 5,
    "color": "#FFFFFF"
}
```
