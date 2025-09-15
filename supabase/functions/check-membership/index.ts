import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const { telegramUserId, channelId } = await req.json()

    if (!telegramUserId || !channelId) {
      return new Response(
        JSON.stringify({ error: 'Missing telegramUserId or channelId' }),
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

    // Check if user is a member of the channel
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/getChatMember`
    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: channelId,
        user_id: parseInt(telegramUserId)
      })
    })

    const data = await response.json()

    if (!data.ok) {
      console.error('Telegram API error:', data)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to check membership',
          details: data.description 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const member = data.result
    const isMember = member.status === 'member' || member.status === 'administrator' || member.status === 'creator'

    return new Response(
      JSON.stringify({ 
        success: true, 
        isMember,
        memberStatus: member.status,
        user: {
          id: member.user.id,
          username: member.user.username,
          first_name: member.user.first_name,
          last_name: member.user.last_name
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error checking membership:', error)
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
