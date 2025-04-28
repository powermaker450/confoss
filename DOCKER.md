# Using Docker (recommended)

1. Clone and enter the repo:
```bash
git clone https://codeberg.org/povario/confoss

cd confoss
```

2. Create the env file and enter the token and ID you got from the Discord Developer Portal here:
```bash
mv example.env .env

# open the env file with your text editor
```

```
BOT_TOKEN=your-token-here
BOT_ID=your-id-here
```

3. Build the image and start the container:
```bash
docker compose up -d
```

4. You can add your bot to a guild by obtaining a link in the "Installation" tab and ticking "Guild Install"
