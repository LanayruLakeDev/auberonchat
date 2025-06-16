import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { OpenRouterService } from '@/lib/openrouter';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { openrouter_api_key } = await request.json();

    if (!openrouter_api_key) {
      return NextResponse.json({ error: 'OpenRouter API key is required' }, { status: 400 });
    }

    const openRouter = new OpenRouterService(openrouter_api_key);
    const isValid = await openRouter.validateApiKey();

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid OpenRouter API key' }, { status: 400 });
    }

    const profile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: {
        openrouter_api_key,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        openrouter_api_key,
      },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
