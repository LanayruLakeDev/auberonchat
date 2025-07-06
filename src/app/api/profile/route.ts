import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAIService } from '@/lib/openrouter';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, email, openrouter_api_key, created_at, updated_at')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Profile fetch error:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { openrouter_api_key } = await request.json();

    if (!openrouter_api_key) {
      return NextResponse.json({ error: 'OpenRouter API key is required' }, { status: 400 });
    }

    // Validate API key first
    console.log('Validating API key...');
    const aiService = createAIService(openrouter_api_key);
    const isValid = await aiService.validateApiKey();

    if (!isValid) {
      console.log('API key validation failed');
      return NextResponse.json({ error: 'Invalid OpenRouter API key' }, { status: 400 });
    }

    console.log('API key validation successful, updating profile...');
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        openrouter_api_key,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Database error updating profile:', error);
      return NextResponse.json({ 
        error: 'Failed to update profile', 
        details: error.message,
        code: error.code 
      }, { status: 500 });
    }

    console.log('Profile updated successfully');
    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 