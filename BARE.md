# Using NodeJS

> [!WARNING]
> You must have the correct version of `OpenSSL`, `zlib`, `libgcc` and `glibc`/`musl` installed, per the [Prisma System Requirements](https://www.prisma.io/docs/orm/reference/system-requirements#operating-systems)

1. Clone and enter the repo:
```bash
git clone https://codeberg.org/povario/confoss

cd confoss
```

2. Install the dependencies and build the project:
```bash
pnpm i
pnpm prisma generate
pnpm build
```

3. Create the env file and enter the token and ID you got from the Discord Developer Portal here:
```bash
mv example.env .env

# open the env file with your text editor
```

```
BOT_TOKEN=your-token-here
BOT_ID=your-id-here
```

4. Start the bot. On the first run, it will generate the database if it does not exist already.
```bash
pnpm start
```

5. You can add your bot to a guild by obtaining a link in the "Installation" tab and ticking "Guild Install"
