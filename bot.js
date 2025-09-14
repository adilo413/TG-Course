const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

// Initialize bot
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

console.log('🤖 Telegram Bot started...');

// Handle /start command
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const welcomeMessage = `
👋 Welcome to the Course Management Bot!

This bot helps you access educational courses. 

📚 To view courses:
• Use the course links shared in our channel
• Make sure you're a member of our channel

🔗 Channel: ${process.env.CHANNEL_INVITE_LINK}

Need help? Contact the admin.
    `;
    
    bot.sendMessage(chatId, welcomeMessage);
});

// Handle course links
bot.onText(/\/course\/([^\/\?]+)\?token=([^&\s]+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const courseId = match[1];
    const token = match[2];
    
    try {
        // Check if user is channel member
        const channelId = process.env.CHANNEL_CHAT_ID;
        const member = await bot.getChatMember(channelId, chatId);
        
        if (member.status === 'left' || member.status === 'kicked') {
            await bot.sendMessage(chatId, 
                '❌ You must be a member of our channel to access courses.\n\n' +
                `Join here: ${process.env.CHANNEL_INVITE_LINK}`
            );
            return;
        }
        
        // Send course access confirmation
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        const courseLink = `${baseUrl}#/course/${courseId}?token=${token}`;
        
        await bot.sendMessage(chatId, 
            `✅ Access granted!\n\n` +
            `🔗 [Open Course](${courseLink})`,
            { parse_mode: 'Markdown' }
        );
        
    } catch (error) {
        console.error('Course link error:', error);
        await bot.sendMessage(chatId, '❌ An error occurred while processing your request.');
    }
});

// Handle any other messages
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    
    // Ignore commands and course links
    if (text.startsWith('/') || text.includes('/course/')) {
        return;
    }
    
    // Send help message for other messages
    bot.sendMessage(chatId, 
        'Hi! 👋\n\n' +
        'Use /start to see available commands.\n' +
        'Use course links from our channel to access content.'
    );
});

// Error handling
bot.on('error', (error) => {
    console.error('Bot error:', error);
});

bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

console.log('✅ Bot is running and listening for messages...');
