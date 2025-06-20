// Simple storage manager that detects if user is local/guest or authenticated
import { LocalStorage, LocalUser } from './localStorage';
import { Conversation, Message, Profile } from '@/types/chat';

export interface UserContext {
  isGuest: boolean;
  isPremium: boolean;
  user: LocalUser | any;
}

export const StorageManager = {
  // Detect user context
  getUserContext: async (): Promise<UserContext> => {
    const localUser = LocalStorage.getUser();
    
    if (localUser) {
      // Local/guest user
      return {
        isGuest: localUser.is_guest,
        isPremium: localUser.is_premium,
        user: localUser
      };
    }

    // Check for authenticated Supabase user
    try {
      const { createClient } = await import('./supabase-client');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        return {
          isGuest: false,
          isPremium: true, // For now, all authenticated users are premium
          user: user
        };
      }
    } catch (error) {
      console.error('Error checking auth user:', error);
    }

    return {
      isGuest: false,
      isPremium: false,
      user: null
    };
  },

  // Conversations
  getConversations: async (): Promise<Conversation[]> => {
    const context = await StorageManager.getUserContext();
    
    if (context.isGuest || !context.isPremium) {
      return LocalStorage.getConversations();
    }

    // Premium authenticated users use API
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        return data.conversations;
      }
    } catch (error) {
      console.error('Error fetching conversations from API:', error);
    }
    
    return [];
  },

  // Messages  
  getMessages: async (conversationId: string): Promise<Message[]> => {
    const context = await StorageManager.getUserContext();
    
    if (context.isGuest || !context.isPremium) {
      return LocalStorage.getMessages(conversationId);
    }

    // Premium authenticated users use API
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        return data.messages;
      }
    } catch (error) {
      console.error('Error fetching messages from API:', error);
    }
    
    return [];
  },

  // Create conversation
  createConversation: async (conversation: Conversation): Promise<void> => {
    const context = await StorageManager.getUserContext();
    
    if (context.isGuest || !context.isPremium) {
      LocalStorage.addConversation(conversation);
      return;
    }

    // Premium authenticated users use API
    try {
      await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conversation)
      });
    } catch (error) {
      console.error('Error creating conversation via API:', error);
    }
  },

  // Update conversation
  updateConversation: async (id: string, updates: Partial<Conversation>): Promise<void> => {
    const context = await StorageManager.getUserContext();
    
    if (context.isGuest || !context.isPremium) {
      LocalStorage.updateConversation(id, updates);
      return;
    }

    // Premium authenticated users use API
    try {
      await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch (error) {
      console.error('Error updating conversation via API:', error);
    }
  },

  // Delete conversation
  deleteConversation: async (id: string): Promise<void> => {
    const context = await StorageManager.getUserContext();
    
    if (context.isGuest || !context.isPremium) {
      LocalStorage.deleteConversation(id);
      return;
    }

    // Premium authenticated users use API
    try {
      await fetch(`/api/conversations/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting conversation via API:', error);
    }
  }
};
