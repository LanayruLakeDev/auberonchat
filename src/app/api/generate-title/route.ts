import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { TitleGenerator } from '@/lib/titleGenerator';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    // Check for guest user with API key
    const guestApiKey = request.headers.get('X-Guest-API-Key');
    const isGuest = !!guestApiKey;

    // For authenticated users, keep existing validation
    if (!isGuest && (userError || !user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userMessage, assistantResponse, conversationId, isGuest: bodyIsGuest } = await request.json();

    if (!userMessage || !conversationId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get API key based on user type
    let userApiKey: string | undefined;
    
    if (isGuest) {
      // For guest users, use the API key from header (if provided)
      userApiKey = guestApiKey || undefined;
    } else {
      // For authenticated users, get API key from profile (if configured)
      const { data: profile } = await supabase
        .from('profiles')
        .select('openrouter_api_key')
        .eq('id', user!.id)
        .single();

      userApiKey = profile?.openrouter_api_key || undefined;
    }

    // Generate the title
    const titleGenerator = new TitleGenerator(userApiKey);
    const generatedTitle = await titleGenerator.generateTitle(userMessage, assistantResponse);

    // Update the conversation with the new title (authenticated users only)
    if (!isGuest) {
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
    } else {
      // For guest users, just return the title (client will handle storage)
      return NextResponse.json({ 
        title: generatedTitle
      });
    }
  } catch (error) {
    console.error('Error generating title:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 