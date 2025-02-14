# Confoss

## Anonymous confessions bot for Discord, free as in freedom and price!

This is a fun little side-project I started after wanting to have my own Discord confessions bot, as an alternative to some that already exist.

### Features:
- Anonymous confessions that users can submit and delete
- Moderator controls: ban users or confessions
- Optional moderator channel, so you can punish those that abuse or disregard the rules of your guild through confessions
- Entirely free, open-source and self-hostable


## Usage

You can add the bot to your guild by simply [installing the app.](https://discord.com/oauth2/authorize?client_id=1294342313941794900)
Alternatively, you can also [host the bot yourself.](https://codeberg.org/powermaker450/confoss/src/branch/main/HOSTING.md)

After adding the bot to your guild, simply run `/setup`. The bot will ask questions about what channels you want to use.

### Basic User Commands
- `/confess [message]`
- `/confessdel [id]`

### Basic Moderator Commands
- `/confessmod ban [id]`
- `/confessmod banuser [user]`
- `/confessmod pardon [id]`
- `/confessmod pardonuser [user]`
- `/confessdel [id]`
- `/confessmod list`