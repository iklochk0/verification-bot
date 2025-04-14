const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
require('dotenv').config(); // Load token from .env

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: ['CHANNEL'] // Required to handle DMs
});

client.on('ready', () => {
  console.log(`Bot is running as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  const verificationChannelId = '1354860576429576404';
  const logChannelId = '1355887364920316125';

  if (message.channel.id !== verificationChannelId) return;
  if (message.author.bot) return;

  const hasImage = message.attachments.some(att => att.contentType?.startsWith('image/'));
  const hasText = message.content.trim().length > 0;

  if (!hasImage || hasText) {
    try {
      const attachments = Array.from(message.attachments.values());
      await message.delete();

      // Send a DM to the user
      await message.author.send(
        `Hi! Only **screenshots without text** are allowed in the verification channel. Please try again.`
      );

      // Log message for admins
      const embed = new EmbedBuilder()
        .setTitle('Invalid Message in Verification Channel')
        .setColor(0xff0000)
        .setAuthor({
          name: `${message.author.tag}`,
          iconURL: message.author.displayAvatarURL({ dynamic: true })
        })
        .addFields(
          { name: 'User', value: `<@${message.author.id}> (${message.author.id})`, inline: false },
          { name: 'Time', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false },
          { name: 'Violation', value: [
              hasText ? '– Sent text along with an image.' : '',
              !hasImage ? '– No attached image found.' : ''
            ].join('\n').trim(), inline: false }
        );

      const logChannel = await message.guild.channels.fetch(logChannelId);
      if (logChannel && logChannel.isTextBased()) {
        await logChannel.send({ embeds: [embed] });

        if (attachments.length > 0) {
          for (const att of attachments) {
            await logChannel.send({
              content: `Screenshot from <@${message.author.id}>:`,
              files: [att.url]
            });
          }
        }
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }
});

// Start the bot
client.login(process.env.TOKEN);