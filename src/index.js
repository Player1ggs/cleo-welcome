const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  presence: {
    activities: [{ name: 'for new members 👋', type: 3 }],
    status: 'online',
  },
});

// ========== HEALTH CHECK SERVER (for Render) ==========
const http = require('http');
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'online',
      bot: client.user?.tag || 'starting',
      uptime: process.uptime(),
      guilds: client.guilds?.cache.size || 0
    }));
  } else {
    res.writeHead(200);
    res.end('Discord Welcome Bot is running!');
  }
});
server.listen(process.env.PORT || 3000, () => {
  console.log(`🌐 Health check server running on port ${process.env.PORT || 3000}`);
});

// ========== WELCOME CARD GENERATOR ==========
async function generateWelcomeCard(member, guild) {
  const canvas = createCanvas(1200, 600);
  const ctx = canvas.getContext('2d');

  // Load background image
  let bgImage;
  try {
    bgImage = await loadImage(path.join(__dirname, 'assets', 'welcome-bg.png'));
  } catch (e) {
    // Fallback: create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 1200, 600);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 600);
  }

  if (bgImage) {
    ctx.drawImage(bgImage, 0, 0, 1200, 600);
  }

  // Add dark overlay for better text readability
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(0, 0, 1200, 600);

  // Draw avatar circle
  const avatarSize = 180;
  const avatarX = 600;
  const avatarY = 200;

  // Avatar circle background (white border)
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarSize / 2 + 8, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.closePath();

  // Load and draw avatar
  try {
    const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 256 });
    const avatarImage = await loadImage(avatarURL);

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatarImage, avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);
    ctx.restore();
  } catch (e) {
    // Fallback if avatar fails to load
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#5865F2';
    ctx.fill();
    ctx.closePath();
  }

  // Draw "WELCOME" text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 80px Arial';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 4;
  ctx.fillText('WELCOME', 600, 380);

  // Draw username
  ctx.font = 'bold 50px Arial';
  ctx.fillStyle = '#f0f0f0';
  const username = member.user.username.length > 20
    ? member.user.username.substring(0, 20) + '...'
    : member.user.username;
  ctx.fillText(username.toUpperCase(), 600, 450);

  // Draw member count
  ctx.font = '30px Arial';
  ctx.fillStyle = '#cccccc';
  ctx.fillText(`Member #${guild.memberCount}`, 600, 500);

  // Draw subtitle
  ctx.font = '25px Arial';
  ctx.fillStyle = '#aaaaaa';
  ctx.fillText("LET'S START YOUR JOURNEY!", 600, 540);

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  return canvas.toBuffer('image/png');
}

// ========== BOT READY + REGISTER SLASH COMMANDS ==========
client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}!`);
  console.log(`📊 Serving ${client.guilds.cache.size} guild(s)`);

  const commands = [
    { name: 'ping', description: 'Check bot latency and status' },
    {
      name: 'welcome',
      description: 'Configure welcome settings',
      options: [
        { name: 'info', description: 'Show current welcome configuration', type: 1 },
        { name: 'test', description: 'Send a test welcome message', type: 1 },
      ],
    },
  ];

  try {
    for (const guild of client.guilds.cache.values()) {
      await guild.commands.set(commands);
      console.log(`📋 Registered commands in ${guild.name}`);
    }
    console.log('✅ All slash commands registered!');
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
});

// ========== WELCOME NEW MEMBERS ==========
client.on('guildMemberAdd', async (member) => {
  try {
    const welcomeChannelId = process.env.WELCOME_CHANNEL_ID;
    const welcomeChannel = member.guild.channels.cache.get(welcomeChannelId);

    if (!welcomeChannel) {
      console.warn(`⚠️ Welcome channel not found: ${welcomeChannelId}`);
      return;
    }

    console.log(`🎨 Generating welcome card for ${member.user.tag}...`);

    // Generate the welcome image
    const welcomeImageBuffer = await generateWelcomeCard(member, member.guild);
    const attachment = new AttachmentBuilder(welcomeImageBuffer, { name: 'welcome.png' });

    // Send welcome message with image
    await welcomeChannel.send({
      content: `${member}`,
      files: [attachment],
      allowedMentions: { users: [member.id] }
    });

    console.log(`👋 Welcomed ${member.user.tag} to ${member.guild.name}`);

    // Auto-assign role
    const autoRoleId = process.env.AUTO_ROLE_ID;
    if (autoRoleId && autoRoleId !== 'value') {
      const autoRole = member.guild.roles.cache.get(autoRoleId);
      if (autoRole && autoRole.position < member.guild.members.me.roles.highest.position) {
        await member.roles.add(autoRole);
        console.log(`🏷️ Assigned ${autoRole.name} to ${member.user.tag}`);
      }
    }

    // DM welcome
    if (process.env.SEND_DM_WELCOME === 'true') {
      try {
        await member.send({
          content: `Welcome to **${member.guild.name}**! 🎉 We're glad to have you!`
        });
      } catch (dmError) {
        console.log(`📩 Could not DM ${member.user.tag}`);
      }
    }

  } catch (error) {
    console.error('❌ Error in guildMemberAdd:', error);
  }
});

// ========== GOODBYE MESSAGES ==========
client.on('guildMemberRemove', async (member) => {
  try {
    const goodbyeChannelId = process.env.GOODBYE_CHANNEL_ID;
    if (!goodbyeChannelId) return;

    const goodbyeChannel = member.guild.channels.cache.get(goodbyeChannelId);
    if (!goodbyeChannel) return;

    await goodbyeChannel.send({
      content: `👋 **${member.user.tag}** has left the server. We'll miss them!`
    });
    console.log(`👋 ${member.user.tag} left ${member.guild.name}`);

  } catch (error) {
    console.error('❌ Error in guildMemberRemove:', error);
  }
});

// ========== SLASH COMMAND HANDLER ==========
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'ping') {
    const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true, ephemeral: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(client.ws.ping);

    await interaction.editReply({
      embeds: [{
        title: '🏓 Pong!',
        description: `**Bot Latency:** ${latency}ms
**API Latency:** ${apiLatency}ms`,
        color: 0x57F287,
        timestamp: new Date()
      }]
    });
  }

  if (interaction.commandName === 'welcome') {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'info') {
      await interaction.reply({
        embeds: [{
          title: '⚙️ Welcome Bot Configuration',
          fields: [
            { name: 'Welcome Channel', value: `<#${process.env.WELCOME_CHANNEL_ID || 'Not set'}>`, inline: true },
            { name: 'Goodbye Channel', value: `<#${process.env.GOODBYE_CHANNEL_ID || 'Not set'}>`, inline: true },
            { name: 'Auto Role', value: `<@&${process.env.AUTO_ROLE_ID || 'Not set'}>`, inline: true },
            { name: 'DM Welcome', value: process.env.SEND_DM_WELCOME === 'true' ? '✅ Enabled' : '❌ Disabled', inline: true },
          ],
          color: 0x5865F2,
          timestamp: new Date()
        }],
        ephemeral: true
      });
    }

    if (subcommand === 'test') {
      await interaction.deferReply({ ephemeral: true });
      const welcomeChannel = interaction.guild.channels.cache.get(process.env.WELCOME_CHANNEL_ID);
      if (welcomeChannel) {
        try {
          const welcomeImageBuffer = await generateWelcomeCard(interaction.member, interaction.guild);
          const attachment = new AttachmentBuilder(welcomeImageBuffer, { name: 'welcome-test.png' });

          await welcomeChannel.send({
            content: `**TEST WELCOME** (triggered by ${interaction.user})`,
            files: [attachment]
          });
          await interaction.editReply('✅ Test welcome card sent!');
        } catch (err) {
          await interaction.editReply(`❌ Error: ${err.message}`);
        }
      } else {
        await interaction.editReply('❌ Welcome channel not configured!');
      }
    }
  }
});

// ========== GRACEFUL SHUTDOWN ==========
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down...');
  client.destroy();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down...');
  client.destroy();
  process.exit(0);
});

// ========== LOGIN ==========
client.login(process.env.DISCORD_TOKEN);