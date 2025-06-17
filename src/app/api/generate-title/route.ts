import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TitleGenerator } from '@/lib/titleGenerator';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userMessage, assistantResponse, conversationId } = await request.json();

    if (!userMessage || !conversationId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }    // Get user's OpenRouter API key
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { openrouter_api_key: true },
    });

    if (!profile?.openrouter_api_key) {
      return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 400 });
    }

    // Generate the title
    const titleGenerator = new TitleGenerator(profile.openrouter_api_key);
    const generatedTitle = await titleGenerator.generateTitle(userMessage, assistantResponse);    // Update the conversation with the new title
    const updatedConversation = await prisma.conversation.update({
      where: { 
        id: conversationId,
        userId: session.user.id 
      },
      data: { title: generatedTitle },
    });

    if (!updatedConversation) {
      console.error('Failed to update conversation title');
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