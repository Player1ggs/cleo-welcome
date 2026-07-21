# 🤖 Discord Welcome Bot

A beautiful Discord welcome bot with custom image cards, built with Node.js and Discord.js v14.

## ✨ Features

- 🎨 **Custom Welcome Cards** — Beautiful image-based welcomes with user avatar
- 👋 **Goodbye Messages** — Optional farewell messages
- 🏷️ **Auto-Role Assignment** — Automatically assign roles to new members
- 📩 **DM Welcome** — Optional direct message welcome
- ⚙️ **Slash Commands** — `/ping`, `/welcome info`, `/welcome test`
- 🐳 **Docker Ready** — Easy deployment
- 🔄 **GitHub Actions** — Auto-deploy on push

## 🚀 Setup

### 1. Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application** → Name your bot
3. Go to **Bot** tab → Click **Add Bot**
4. Enable these **Privileged Gateway Intents**:
   - ✅ Server Members Intent
   - ✅ Message Content Intent
5. Copy your **Token**

### 2. Invite Bot to Server

Go to **OAuth2 → URL Generator**:
- Scopes: `bot`, `applications.commands`
- Bot Permissions: `Administrator`

Copy the URL and open it in your browser.

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
DISCORD_TOKEN=YOUR_BOT_TOKEN
WELCOME_CHANNEL_ID=1234567890123456789
GOODBYE_CHANNEL_ID=1234567890123456789
AUTO_ROLE_ID=1234567890123456789
SEND_DM_WELCOME=true
```

### 4. Add Welcome Background

Place your custom background image at:
```
src/assets/welcome-bg.png
```

Recommended size: **1200x600 pixels**

### 5. Deploy to Render

1. Push this repo to GitHub
2. Connect to [Render.com](https://render.com)
3. Add environment variables in Render dashboard
4. Deploy!

## 📁 File Structure

```
discord-welcome-bot/
├── src/
│   ├── index.js              # Main bot code
│   └── assets/
│       └── welcome-bg.png    # Custom background
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── package.json
├── render.yaml
└── README.md
```

## 🛡️ Security Tips

- **Never commit `.env`** — It's in `.gitignore`
- **Never share your token** — Reset it immediately if leaked
- **Use environment variables** — Never hardcode secrets

## 📜 License

MIT License