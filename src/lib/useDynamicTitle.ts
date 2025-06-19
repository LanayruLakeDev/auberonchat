import { useEffect } from 'react';
import { Conversation } from '@/types/chat';

const DEFAULT_TITLE = 'Auberon Chat - Advanced AI with Consensus Intelligence';

export function useDynamicTitle(activeConversation: Conversation | null) {
  useEffect(() => {
    if (activeConversation?.title) {
      document.title = `${activeConversation.title} - Auberon Chat`;
    } else {
      document.title = DEFAULT_TITLE;
    }
  }, [activeConversation]);
} 