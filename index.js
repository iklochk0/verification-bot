const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
require('dotenv').config(); // якщо використовуєш .env для токена

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: ['CHANNEL'] // щоб працювали DM
});

client.on('ready', () => {
  console.log(`Бот запущений як ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  const verificationChannelId = 'ID_ВЕРИФІКАЦІЙНОГО_КАНАЛУ';
  const logChannelId = 'ID_АДМІН_ЛОГ_КАНАЛУ';

  if (message.channel.id !== verificationChannelId) return;
  if (message.author.bot) return;

  const hasImage = message.attachments.some(att => att.contentType?.startsWith('image/'));
  const hasText = message.content.trim().length > 0;

  if (!hasImage || hasText) {
    try {
      const attachments = Array.from(message.attachments.values());
      await message.delete();

      // DM користувачу
      await message.author.send(
        `Привіт! У верифікаційному каналі дозволено надсилати **лише скріншоти без тексту**. Будь ласка, спробуй ще раз.`
      );

      // Embed лог
      const embed = new EmbedBuilder()
        .setTitle('Некоректне повідомлення у верифікації')
        .setColor(0xff0000)
        .setAuthor({
          name: `${message.author.tag}`,
          iconURL: message.author.displayAvatarURL({ dynamic: true })
        })
        .addFields(
          { name: 'Користувач', value: `<@${message.author.id}> (${message.author.id})`, inline: false },
          { name: 'Час', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false },
          { name: 'Було порушено', value: [
              hasText ? '– Надіслано текст разом із зображенням.' : '',
              !hasImage ? '– Відсутні прикріплені зображення.' : ''
            ].join('\n').trim(), inline: false }
        );

      const logChannel = await message.guild.channels.fetch(logChannelId);
      if (logChannel && logChannel.isTextBased()) {
        await logChannel.send({ embeds: [embed] });

        if (attachments.length > 0) {
          for (const att of attachments) {
            await logChannel.send({
              content: `Скріншот від <@${message.author.id}>:`,
              files: [att.url]
            });
          }
        }
      }

    } catch (error) {
      console.error('Помилка при обробці повідомлення:', error);
    }
  }
});

// Запуск бота
client.login(process.env.TOKEN);
