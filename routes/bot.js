const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const { query } = require('../config/database');
const auth = require('./auth');
const verifyToken = auth.verifyToken;
const router = express.Router();

// Initialize Telegram bot
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });

// Send course to channel
router.post('/send-course', verifyToken, async (req, res) => {
  try {
    const { courseId, message } = req.body;

    if (!courseId) {
      return res.status(400).json({ error: 'Course ID is required' });
    }

    // Get course details
    const courseResult = await query(
      'SELECT * FROM courses WHERE course_id = $1',
      [courseId]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const course = courseResult.rows[0];

    // Get course token
    const tokenResult = await query(
      'SELECT token FROM tokens WHERE course_id = $1',
      [courseId]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ error: 'No access token found for this course. Generate a token first.' });
    }

    const token = tokenResult.rows[0].token;
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const courseLink = `${baseUrl}#/course/${courseId}?token=${token}`;

    // Prepare message
    const channelMessage = message || `📚 **${course.title}**\n\n📖 Subject: ${course.subject}\n\n🔗 [View Course](${courseLink})`;

    // Send to channel
    const channelId = process.env.CHANNEL_CHAT_ID;
    
    const sentMessage = await bot.sendMessage(channelId, channelMessage, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          {
            text: '📖 View Course',
            url: courseLink
          }
        ]]
      }
    });

    res.json({
      success: true,
      message: 'Course sent to channel successfully',
      messageId: sentMessage.message_id,
      courseLink
    });

  } catch (error) {
    console.error('Send course error:', error);
    res.status(500).json({ error: 'Failed to send course to channel' });
  }
});

// Bot webhook for handling messages
router.post('/webhook', async (req, res) => {
  try {
    const update = req.body;

    // Handle different types of updates
    if (update.message) {
      await handleMessage(update.message);
    } else if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Handle incoming messages
async function handleMessage(message) {
  try {
    const chatId = message.chat.id;
    const text = message.text;

    // Handle /start command
    if (text === '/start') {
      await bot.sendMessage(chatId, 
        '👋 Welcome to the Course Management Bot!\n\n' +
        'This bot helps you access educational courses. ' +
        'Use the course links shared in the channel to view content.'
      );
    }

    // Handle course links
    if (text && text.includes('/course/')) {
      await handleCourseLink(chatId, text);
    }

  } catch (error) {
    console.error('Handle message error:', error);
  }
}

// Handle callback queries (inline keyboard buttons)
async function handleCallbackQuery(callbackQuery) {
  try {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;

    // Answer callback query
    await bot.answerCallbackQuery(callbackQuery.id);

    // Handle different callback data
    if (data === 'view_course') {
      // Course viewing logic can be added here
    }

  } catch (error) {
    console.error('Handle callback query error:', error);
  }
}

// Handle course link access
async function handleCourseLink(chatId, link) {
  try {
    // Extract course ID and token from link
    const courseMatch = link.match(/\/course\/([^\/\?]+)\?token=([^&\s]+)/);
    
    if (!courseMatch) {
      await bot.sendMessage(chatId, '❌ Invalid course link format.');
      return;
    }

    const [, courseId, token] = courseMatch;

    // Verify course and token
    const courseResult = await query(
      'SELECT c.*, t.token FROM courses c JOIN tokens t ON c.course_id = t.course_id WHERE c.course_id = $1 AND t.token = $2',
      [courseId, token]
    );

    if (courseResult.rows.length === 0) {
      await bot.sendMessage(chatId, '❌ Course not found or invalid access token.');
      return;
    }

    const course = courseResult.rows[0];

    if (!course.is_active) {
      await bot.sendMessage(chatId, '❌ This course has been deactivated.');
      return;
    }

    // Check if user is channel member
    const channelId = process.env.CHANNEL_CHAT_ID;
    try {
      const member = await bot.getChatMember(channelId, chatId);
      
      if (member.status === 'left' || member.status === 'kicked') {
        await bot.sendMessage(chatId, 
          '❌ You must be a member of our channel to access courses.\n\n' +
          `Join here: ${process.env.CHANNEL_INVITE_LINK}`
        );
        return;
      }
    } catch (error) {
      console.error('Channel membership check error:', error);
      await bot.sendMessage(chatId, '❌ Unable to verify channel membership.');
      return;
    }

    // Send course access confirmation
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const courseLink = `${baseUrl}#/course/${courseId}?token=${token}`;

    await bot.sendMessage(chatId, 
      `✅ Access granted!\n\n` +
      `📚 **${course.title}**\n` +
      `📖 Subject: ${course.subject}\n\n` +
      `🔗 [Open Course](${courseLink})`,
      { parse_mode: 'Markdown' }
    );

    // Log user access
    await logUserAccess(chatId, courseId);

  } catch (error) {
    console.error('Handle course link error:', error);
    await bot.sendMessage(chatId, '❌ An error occurred while processing your request.');
  }
}

// Log user access
async function logUserAccess(telegramId, courseId) {
  try {
    // Get user info from Telegram
    const user = await bot.getChat(telegramId);
    
    // Insert or update user record
    await query(
      `INSERT INTO users (telegram_id, username, first_name, last_name, is_channel_member, last_accessed)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       ON CONFLICT (telegram_id) 
       DO UPDATE SET 
         username = EXCLUDED.username,
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         is_channel_member = EXCLUDED.is_channel_member,
         last_accessed = CURRENT_TIMESTAMP`,
      [
        telegramId,
        user.username || null,
        user.first_name || null,
        user.last_name || null,
        true
      ]
    );

  } catch (error) {
    console.error('Log user access error:', error);
  }
}

// Get bot info
router.get('/info', verifyToken, async (req, res) => {
  try {
    const botInfo = await bot.getMe();
    res.json({
      success: true,
      bot: botInfo
    });
  } catch (error) {
    console.error('Get bot info error:', error);
    res.status(500).json({ error: 'Failed to get bot info' });
  }
});

module.exports = router;
