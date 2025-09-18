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
    const { telegramUserId, channelType } = await req.json()
    
    console.log('🔍 check-membership function called with:', { telegramUserId, channelType })

    if (!telegramUserId || !channelType) {
      console.log('❌ Missing parameters:', { telegramUserId, channelType })
      return new Response(
        JSON.stringify({ error: 'Missing telegramUserId or channelType' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Channel configurations (same as post-to-channel)
    const channelConfigs = {
      'brightfresh': {
        id: '-1003004502647',
        name: 'BrightFresh'
      },
      'brighttrial': {
        id: '-1003037484094',
        name: 'Bright fo trial'
      }
    }

    const channel = channelConfigs[channelType]
    if (!channel) {
      return new Response(
        JSON.stringify({ error: 'Invalid channel type. Use "brightfresh" or "brighttrial"' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get bot token from environment
    const botToken = Deno.env.get('BOT_TOKEN')
    console.log('🔍 Bot token available:', !!botToken)
    if (!botToken) {
      console.log('❌ Bot token not configured')
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
    console.log('🔍 Calling Telegram API:', { 
      url: telegramApiUrl, 
      chat_id: channel.id, 
      user_id: parseInt(telegramUserId) 
    })
    
    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: channel.id,
        user_id: parseInt(telegramUserId)
      })
    })

    const data = await response.json()
    console.log('📋 Telegram API response:', data)

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
        channelName: channel.name,
        channelType: channelType,
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
