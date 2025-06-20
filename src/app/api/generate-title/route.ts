import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { TitleGenerator } from '@/lib/titleGenerator';

export async function POST(request: NextRequest) {
  try {
    const { userMessage, assistantResponse, conversationId, isGuest } = await request.json();

    if (!userMessage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let apiKey: string;

    // Handle guest users
    if (isGuest) {
      const guestApiKey = request.headers.get('X-Guest-API-Key');
      if (!guestApiKey) {
        return NextResponse.json({ error: 'Guest API key required' }, { status: 400 });
      }
      apiKey = guestApiKey;
    } else {
      // Handle regular authenticated users
      const supabase = await createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      if (!conversationId) {
        return NextResponse.json({ error: 'Conversation ID required for authenticated users' }, { status: 400 });
      }

      // Get user's OpenRouter API key
      const { data: profile } = await supabase
        .from('profiles')
        .select('openrouter_api_key')
        .eq('id', user.id)
        .single();

      if (!profile?.openrouter_api_key) {
        return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 400 });
      }

      apiKey = profile.openrouter_api_key;
    }

    // Generate the title
    const titleGenerator = new TitleGenerator(apiKey);
    const generatedTitle = await titleGenerator.generateTitle(userMessage, assistantResponse);

    // For guest users, just return the title (no database update)
    if (isGuest) {
      return NextResponse.json({ title: generatedTitle });
    }

    // For regular users, update the conversation in database
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: updatedConversation, error: updateError } = await supabase
      .from('conversations')
      .update({ title: generatedTitle })
      .eq('id', conversationId)
      .eq('user_id', user!.id)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update conversation title:', updateError);
      return NextResponse.json({ error: 'Failed to update title' }, { status: 500 });
    }

    return NextResponse.json({ 
      title: generatedTitle,
      conversation: updatedConversation 
    });
  } catch (error) {
    console.error('Error generating title:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 