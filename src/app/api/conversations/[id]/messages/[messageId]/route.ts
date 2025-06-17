import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: conversationId, messageId } = await params;

    // Verify the conversation belongs to the user
    const conversation = await prisma.conversation.findFirst({
      where: { 
        id: conversationId,
        userId: session.user.id 
      },
      select: { id: true },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Delete the specific message
    await prisma.message.delete({
      where: {
        id: messageId,
        conversationId: conversationId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in delete message route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}