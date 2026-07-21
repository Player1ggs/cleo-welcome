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
  const canvas = createCanvas(1200, 850);
  const ctx = canvas.getContext('2d');

  // ========== TOP INFO SECTION (350px height) ==========
  // Dark background for info section
  ctx.fillStyle = '#0d0700';
  ctx.fillRect(0, 0, 1200, 350);

  // Top gold accent line
  ctx.fillStyle = '#d4a017';
  ctx.fillRect(0, 0, 1200, 4);

  // "PLEASE READ BELOW" text
  ctx.font = 'bold 42px Arial';
  ctx.fillStyle = '#f5d78e';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(212, 160, 23, 0.5)';
  ctx.shadowBlur = 15;
  ctx.fillText('PLEASE READ BELOW ⚠️', 600, 70);

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // Info items - now just labels, channel mentions go in message text
  const infoItems = [
    { icon: '📖', label: 'Must Read', color: '#f5d78e' },
    { icon: '📢', label: 'Daily Updates', color: '#c9a84c' },
    { icon: '💬', label: 'Community Chat', color: '#b8956a' },
  ];

  let yPos = 130;
  for (const item of infoItems) {
    // Arrow
    ctx.font = '28px Arial';
    ctx.fillStyle = '#d4a017';
    ctx.fillText('➡️', 280, yPos);

    // Label
    ctx.font = 'bold 26px Arial';
    ctx.fillStyle = item.color;
    ctx.textAlign = 'left';
    ctx.fillText(`${item.icon} ${item.label}`, 330, yPos);

    yPos += 75;
  }

  // Divider line between sections
  ctx.fillStyle = '#d4a017';
  ctx.fillRect(0, 348, 1200, 4);

  // ========== WELCOME SECTION (500px height, starting at y=350) ==========
  // Load background image
  let bgImage;
  try {
    bgImage = await loadImage(path.join(__dirname, 'assets', 'welcome-bg.png'));
  } catch (e) {
    // Fallback: warm dark gradient
    const gradient = ctx.createLinearGradient(0, 350, 1200, 850);
    gradient.addColorStop(0, '#1a0f00');
    gradient.addColorStop(0.3, '#2d1a00');
    gradient.addColorStop(0.6, '#1c1000');
    gradient.addColorStop(1, '#0d0700');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 350, 1200, 500);
  }

  if (bgImage) {
    ctx.drawImage(bgImage, 0, 350, 1200, 500);
  }

  // Subtle warm overlay
  ctx.fillStyle = 'rgba(60, 30, 0, 0.15)';
  ctx.fillRect(0, 350, 1200, 500);

  // Draw avatar circle with gold glow
  const avatarSize = 180;
  const avatarX = 600;
  const avatarY = 520;

  // Outer glow ring
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarSize / 2 + 15, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(212, 160, 23, 0.3)';
  ctx.fill();
  ctx.closePath();

  // Gold border ring
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarSize / 2 + 6, 0, Math.PI * 2);
  ctx.fillStyle = '#d4a017';
  ctx.fill();
  ctx.closePath();

  // Inner dark ring
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarSize / 2 + 2, 0, Math.PI * 2);
  ctx.fillStyle = '#1a0f00';
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
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#3d2200';
    ctx.fill();
    ctx.closePath();

    ctx.fillStyle = '#d4a017';
    ctx.font = 'bold 80px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(member.user.username.charAt(0).toUpperCase(), avatarX, avatarY);
  }

  // ========== TEXT SECTION ==========
  ctx.textAlign = 'center';

  // "WELCOME" text
  ctx.font = 'bold 72px Arial';
  ctx.fillStyle = '#f5d78e';
  ctx.shadowColor = 'rgba(212, 160, 23, 0.6)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillText('WELCOME', 600, 690);

  // Username
  ctx.font = 'bold 44px Arial';
  ctx.fillStyle = '#ffe4b5';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  const username = member.user.username.length > 22
    ? member.user.username.substring(0, 22) + '...'
    : member.user.username;
  ctx.fillText(username.toUpperCase(), 600, 750);

  // Member count
  ctx.font = '28px Arial';
  ctx.fillStyle = '#c9a84c';
  ctx.shadowBlur = 4;
  ctx.fillText(`MEMBER #${guild.memberCount}`, 600, 795);

  // Subtitle
  ctx.font = '22px Arial';
  ctx.fillStyle = '#b8956a';
  ctx.shadowBlur = 2;
  ctx.fillText("LET'S START YOUR JOURNEY!", 600, 835);

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Bottom gold accent line
  ctx.fillStyle = '#d4a017';
  ctx.fillRect(0, 846, 1200, 4);

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

    // Get channel IDs from environment or use defaults
    const rulesChannelId = process.env.RULES_CHANNEL_ID || '';
    const announcementsChannelId = process.env.ANNOUNCEMENTS_CHANNEL_ID || '';
    const generalChatChannelId = process.env.GENERAL_CHAT_CHANNEL_ID || '';

    console.log(`🎨 Generating welcome card for ${member.user.tag}...`);

    const welcomeImageBuffer = await generateWelcomeCard(member, member.guild);
    const attachment = new AttachmentBuilder(welcomeImageBuffer, { name: 'welcome.png' });

    // Build channel mentions text
    let channelMentions = '';
    if (rulesChannelId) channelMentions += `📖 <#${rulesChannelId}>\\n`;
    if (announcementsChannelId) channelMentions += `📢 <#${announcementsChannelId}>\\n`;
    if (generalChatChannelId) channelMentions += `💬 <#${generalChatChannelId}>\\n`;

    // Send welcome message with image and channel mentions
    await welcomeChannel.send({
      content: `${member}\\n\\n${channelMentions}`,
      files: [attachment],
      allowedMentions: { users: [member.id] }
    });

    console.log(`👋 Welcomed ${member.user.tag} to ${member.guild.name}`);

    const autoRoleId = process.env.AUTO_ROLE_ID;
    if (autoRoleId && autoRoleId !== 'value' && autoRoleId.trim() !== '') {
      const autoRole = member.guild.roles.cache.get(autoRoleId);
      if (autoRole && autoRole.position < member.guild.members.me.roles.highest.position) {
        await member.roles.add(autoRole);
        console.log(`🏷️ Assigned ${autoRole.name} to ${member.user.tag}`);
      }
    }

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
        description: `**Bot Latency:** ${latency}ms\n**API Latency:** ${apiLatency}ms`,
        color: 0xd4a017,
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
          color: 0xd4a017,
          fields: [
            { name: 'Welcome Channel', value: `<#${process.env.WELCOME_CHANNEL_ID || 'Not set'}>`, inline: true },
            { name: 'Goodbye Channel', value: `<#${process.env.GOODBYE_CHANNEL_ID || 'Not set'}>`, inline: true },
            { name: 'Auto Role', value: `<@&${process.env.AUTO_ROLE_ID || 'Not set'}>`, inline: true },
            { name: 'DM Welcome', value: process.env.SEND_DM_WELCOME === 'true' ? '✅ Enabled' : '❌ Disabled', inline: true },
          ],
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

          // Get channel IDs for test
          const rulesChannelId = process.env.RULES_CHANNEL_ID || '';
          const announcementsChannelId = process.env.ANNOUNCEMENTS_CHANNEL_ID || '';
          const generalChatChannelId = process.env.GENERAL_CHAT_CHANNEL_ID || '';

          let channelMentions = '';
          if (rulesChannelId) channelMentions += `📖 <#${rulesChannelId}>\\n`;
          if (announcementsChannelId) channelMentions += `📢 <#${announcementsChannelId}>\\n`;
          if (generalChatChannelId) channelMentions += `💬 <#${generalChatChannelId}>\\n`;

          await welcomeChannel.send({
            content: `**TEST WELCOME** (triggered by ${interaction.user})\\n\\n${channelMentions}`,
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
