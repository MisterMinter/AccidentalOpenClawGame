import { Bot, InlineKeyboard } from 'grammy';

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('BOT_TOKEN environment variable is required');
  process.exit(1);
}

const WEBAPP_URL = process.env.WEBAPP_URL || 'https://openclaw.example.com';

const bot = new Bot(BOT_TOKEN);

bot.command('start', async (ctx) => {
  const keyboard = new InlineKeyboard().webApp('Play OpenClaw!', WEBAPP_URL);

  await ctx.reply(
    '🏴‍☠️ *Welcome to OpenClaw!*\n\n' +
    'Captain Claw needs your help to escape from La Roca prison and recover the Amulet of Nine Lives!\n\n' +
    '⚔️ Fight enemies, collect treasure, and defeat powerful bosses across 14 levels.\n\n' +
    'Tap the button below to start playing!',
    {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    }
  );
});

bot.command('scores', async (ctx) => {
  const keyboard = new InlineKeyboard().webApp('View Leaderboard', `${WEBAPP_URL}?view=leaderboard`);
  await ctx.reply('🏆 Check out the leaderboard!', { reply_markup: keyboard });
});

bot.command('help', async (ctx) => {
  await ctx.reply(
    '🎮 *OpenClaw - Controls*\n\n' +
    '*Mobile:*\n' +
    '• D-pad (left): Move\n' +
    '• Green button (right): Jump\n' +
    '• Red button (right): Attack\n\n' +
    '*Desktop:*\n' +
    '• Arrow keys / WASD: Move\n' +
    '• Space / Up: Jump\n' +
    '• Z / X: Attack\n' +
    '• Tab: Switch weapon\n' +
    '• Esc: Pause\n\n' +
    'Use /start to play!',
    { parse_mode: 'Markdown' }
  );
});

bot.on('inline_query', async (ctx) => {
  await ctx.answerInlineQuery([
    {
      type: 'article',
      id: 'play',
      title: 'Play OpenClaw',
      description: 'Challenge your friends to beat your score!',
      input_message_content: {
        message_text: '🏴‍☠️ I\'m playing OpenClaw! Can you beat my score?',
      },
      reply_markup: new InlineKeyboard().webApp('Play Now!', WEBAPP_URL),
    },
  ]);
});

console.log('Starting OpenClaw bot...');
bot.start();
