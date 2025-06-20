// Hybrid storage system that works with both localStorage and Supabase
import { Conversation, Message, Profile } from '@/types/chat';
import { LocalStorage, LocalUser } from './localStorage';
import { createClient } from './supabase-client';

export interface StorageContext {
  isLocal: boolean;
  isPremium: boolean;
  isGuest: boolean;
  user: LocalUser | any;
}

export class HybridStorage {
  private context: StorageContext;

  constructor(context: StorageContext) {
    this.context = context;
  }

  // Conversations
  async getConversations(): Promise<Conversation[]> {
    if (this.context.isLocal || !this.context.isPremium) {
      return LocalStorage.getConversations();
    }

    try {
      // Premium users: try online first, fallback to local
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        // Cache in localStorage for offline access
        LocalStorage.setConversations(data.conversations);
        return data.conversations;
      } else {
        // Fallback to local storage
        return LocalStorage.getConversations();
      }
    } catch (error) {
      console.error('Error fetching online conversations, using local:', error);
      return LocalStorage.getConversations();
    }
  }

  async createConversation(conversation: Conversation): Promise<Conversation> {
    // Always save locally first for speed
    LocalStorage.addConversation(conversation);

    if (!this.context.isLocal && this.context.isPremium) {
      try {
        // Premium users: also save online
        const response = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(conversation)
        });

        if (response.ok) {
          const data = await response.json();
          // Update local storage with server response
          LocalStorage.updateConversation(conversation.id, data.conversation);
          return data.conversation;
        }
      } catch (error) {
        console.error('Error creating conversation online, saved locally:', error);
      }
    }

    return conversation;
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<void> {
    // Always update locally first
    LocalStorage.updateConversation(id, updates);

    if (!this.context.isLocal && this.context.isPremium) {
      try {
        // Premium users: also update online
        await fetch(`/api/conversations/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
      } catch (error) {
        console.error('Error updating conversation online, updated locally:', error);
      }
    }
  }

  async deleteConversation(id: string): Promise<void> {
    // Always delete locally first
    LocalStorage.deleteConversation(id);

    if (!this.context.isLocal && this.context.isPremium) {
      try {
        // Premium users: also delete online
        await fetch(`/api/conversations/${id}`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.error('Error deleting conversation online, deleted locally:', error);
      }
    }
  }

  // Messages
  async getMessages(conversationId: string): Promise<Message[]> {
    if (this.context.isLocal || !this.context.isPremium) {
      return LocalStorage.getMessages(conversationId);
    }

    try {
      // Premium users: try online first, fallback to local
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        // Cache in localStorage for offline access
        LocalStorage.setMessages(conversationId, data.messages);
        return data.messages;
      } else {
        // Fallback to local storage
        return LocalStorage.getMessages(conversationId);
      }
    } catch (error) {
      console.error('Error fetching online messages, using local:', error);
      return LocalStorage.getMessages(conversationId);
    }
  }

  async createMessage(conversationId: string, message: Message): Promise<Message> {
    // Always save locally first for speed
    LocalStorage.addMessage(conversationId, message);

    if (!this.context.isLocal && this.context.isPremium) {
      try {
        // Premium users: also save online
        const response = await fetch(`/api/conversations/${conversationId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message)
        });

        if (response.ok) {
          const data = await response.json();
          // Update local storage with server response
          LocalStorage.updateMessage(conversationId, message.id, data.message);
          return data.message;
        }
      } catch (error) {
        console.error('Error creating message online, saved locally:', error);
      }
    }

    return message;
  }

  async updateMessage(conversationId: string, messageId: string, updates: Partial<Message>): Promise<void> {
    // Always update locally first
    LocalStorage.updateMessage(conversationId, messageId, updates);

    if (!this.context.isLocal && this.context.isPremium) {
      try {
        // Premium users: also update online
        await fetch(`/api/conversations/${conversationId}/messages/${messageId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
      } catch (error) {
        console.error('Error updating message online, updated locally:', error);
      }
    }
  }

  async deleteMessage(conversationId: string, messageId: string): Promise<void> {
    // Always delete locally first
    LocalStorage.deleteMessage(conversationId, messageId);

    if (!this.context.isLocal && this.context.isPremium) {
      try {
        // Premium users: also delete online
        await fetch(`/api/conversations/${conversationId}/messages/${messageId}`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.error('Error deleting message online, deleted locally:', error);
      }
    }
  }

  // Profile operations
  async getProfile(): Promise<Profile | null> {
    if (this.context.isLocal || !this.context.isPremium) {
      return LocalStorage.getProfile();
    }

    try {
      // Premium users: try online first, fallback to local
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        // Cache in localStorage for offline access
        LocalStorage.setProfile(data.profile);
        return data.profile;
      } else {
        // Fallback to local storage
        return LocalStorage.getProfile();
      }
    } catch (error) {
      console.error('Error fetching online profile, using local:', error);
      return LocalStorage.getProfile();
    }
  }

  async updateProfile(updates: Partial<Profile>): Promise<void> {
    // Always update locally first
    const currentProfile = LocalStorage.getProfile();
    if (currentProfile) {
      LocalStorage.setProfile({ ...currentProfile, ...updates });
    }

    if (!this.context.isLocal && this.context.isPremium) {
      try {
        // Premium users: also update online
        await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
      } catch (error) {
        console.error('Error updating profile online, updated locally:', error);
      }
    }
  }

  // Migration functions for upgrading to premium
  async migrateToOnline(): Promise<boolean> {
    try {
      const localData = LocalStorage.exportAllData();
      
      // Upload conversations
      for (const conversation of localData.conversations || []) {
        await this.createConversation(conversation);
      }

      // Upload messages
      const allMessages = localData.messages || {};
      for (const [conversationId, messages] of Object.entries(allMessages)) {
        for (const message of messages as Message[]) {
          await this.createMessage(conversationId, message);
        }
      }

      // Upload profile
      if (localData.profile) {
        await this.updateProfile(localData.profile);
      }

      // Mark as synced
      LocalStorage.setLastSync(new Date().toISOString());
      
      return true;
    } catch (error) {
      console.error('Error migrating to online storage:', error);
      return false;
    }
  }

  // Sync local changes to online for premium users
  async syncToOnline(): Promise<void> {
    if (this.context.isLocal || !this.context.isPremium) {
      return;
    }

    try {
      const lastSync = LocalStorage.getLastSync();
      const localData = LocalStorage.exportAllData();
      
      // Only sync if we have data and haven't synced recently
      if (!lastSync || new Date(lastSync).getTime() < Date.now() - 60000) { // 1 minute
        await this.migrateToOnline();
      }
    } catch (error) {
      console.error('Error syncing to online:', error);
    }
  }
}
