import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { courseTitle, courseLink, channelId } = await req.json()

    if (!courseTitle || !courseLink || !channelId) {
      return new Response(
        JSON.stringify({ error: 'Missing courseTitle, courseLink, or channelId' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get bot token from environment
    const botToken = Deno.env.get('BOT_TOKEN')
    if (!botToken) {
      return new Response(
        JSON.stringify({ error: 'Bot token not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create the message with HTML formatting (more reliable than Markdown)
    const escapedTitle = courseTitle.replace(/[<>&"]/g, (match) => {
        switch (match) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '"': return '&quot;';
            default: return match;
        }
    });
    
    const message = `📚 <b>New Course Available!</b>

🎯 <b>${escapedTitle}</b>

🔗 Access the course: <a href="${courseLink}">${escapedTitle}</a>

💡 Click the link above to start learning!`;

    // Send message to channel
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`
    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: channelId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: false
      })
    })

    const data = await response.json()

    if (!data.ok) {
      console.error('Telegram API error:', data)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to post to channel',
          details: data.description 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: data.result.message_id,
        message: 'Course link posted to channel successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error posting to channel:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
