// Local storage utilities for conversations and messages
import { Conversation, Message, Profile } from '@/types/chat';

export interface LocalUser {
  id: string;
  email?: string;
  display_name: string;
  is_guest: boolean;
  is_premium: boolean;
  created_at: string;
}

const STORAGE_KEYS = {
  USER: 'auberon_local_user',
  CONVERSATIONS: (userId: string) => `auberon_conversations_${userId}`,
  MESSAGES: (userId: string) => `auberon_messages_${userId}`,
  PROFILE: (userId: string) => `auberon_profile_${userId}`,
  API_KEY: (userId: string) => `auberon_api_key_${userId}`,
  LAST_SYNC: 'auberon_last_sync'
};

// User management
export const LocalStorage = {
  // Helper to get current user ID
  getCurrentUserId: (): string | null => {
    const user = LocalStorage.getUser();
    return user?.id || null;
  },
  // User operations
  setUser: (user: LocalUser): void => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    // Dispatch custom event for same-tab updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auberonUserChange', { detail: user }));
    }
  },

  getUser: (): LocalUser | null => {
    const userData = localStorage.getItem(STORAGE_KEYS.USER);
    return userData ? JSON.parse(userData) : null;
  },
  clearUser: (): void => {
    localStorage.removeItem(STORAGE_KEYS.USER);
  },
  createGuestUser: (): LocalUser => {
    const guestUser = {
      id: generateId(),
      display_name: 'Guest User',
      is_guest: true,
      is_premium: false,
      created_at: new Date().toISOString()
    };
    LocalStorage.setUser(guestUser);
    return guestUser;
  },

  updateGuestName: (newName: string): LocalUser | null => {
    const user = LocalStorage.getUser();
    if (user?.is_guest) {
      const updatedUser = { ...user, display_name: newName };
      LocalStorage.setUser(updatedUser);
      return updatedUser;
    }
    return null;
  },

  clearGuestData: (): void => {
    const user = LocalStorage.getUser();
    if (user?.is_guest) {
      const userId = user.id;
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.CONVERSATIONS(userId));
      localStorage.removeItem(STORAGE_KEYS.MESSAGES(userId));
      localStorage.removeItem(STORAGE_KEYS.PROFILE(userId));
      localStorage.removeItem(STORAGE_KEYS.API_KEY(userId));
    }
  },
  // Conversation operations
  setConversations: (conversations: Conversation[]): void => {
    const userId = LocalStorage.getCurrentUserId();
    if (userId) {
      localStorage.setItem(STORAGE_KEYS.CONVERSATIONS(userId), JSON.stringify(conversations));
    }
  },

  getConversations: (): Conversation[] => {
    const userId = LocalStorage.getCurrentUserId();
    if (!userId) return [];
    const data = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS(userId));
    return data ? JSON.parse(data) : [];
  },

  addConversation: (conversation: Conversation): void => {
    const conversations = LocalStorage.getConversations();
    conversations.unshift(conversation);
    LocalStorage.setConversations(conversations);
  },

  updateConversation: (id: string, updates: Partial<Conversation>): void => {
    const conversations = LocalStorage.getConversations();
    const index = conversations.findIndex(conv => conv.id === id);
    if (index !== -1) {
      conversations[index] = { ...conversations[index], ...updates };
      LocalStorage.setConversations(conversations);
    }
  },

  deleteConversation: (id: string): void => {
    const conversations = LocalStorage.getConversations().filter(conv => conv.id !== id);
    LocalStorage.setConversations(conversations);
    // Also delete associated messages
    LocalStorage.deleteMessagesByConversation(id);
  },
  // Message operations
  setMessages: (conversationId: string, messages: Message[]): void => {
    const allMessages = LocalStorage.getAllMessages();
    allMessages[conversationId] = messages;
    const userId = LocalStorage.getCurrentUserId();
    if (userId) {
      localStorage.setItem(STORAGE_KEYS.MESSAGES(userId), JSON.stringify(allMessages));
    }
  },

  getMessages: (conversationId: string): Message[] => {
    const allMessages = LocalStorage.getAllMessages();
    return allMessages[conversationId] || [];
  },

  getAllMessages: (): Record<string, Message[]> => {
    const userId = LocalStorage.getCurrentUserId();
    if (!userId) return {};
    const data = localStorage.getItem(STORAGE_KEYS.MESSAGES(userId));
    return data ? JSON.parse(data) : {};
  },

  addMessage: (conversationId: string, message: Message): void => {
    const messages = LocalStorage.getMessages(conversationId);
    messages.push(message);
    LocalStorage.setMessages(conversationId, messages);
  },

  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>): void => {
    const messages = LocalStorage.getMessages(conversationId);
    const index = messages.findIndex(msg => msg.id === messageId);
    if (index !== -1) {
      messages[index] = { ...messages[index], ...updates };
      LocalStorage.setMessages(conversationId, messages);
    }
  },

  deleteMessage: (conversationId: string, messageId: string): void => {
    const messages = LocalStorage.getMessages(conversationId).filter(msg => msg.id !== messageId);
    LocalStorage.setMessages(conversationId, messages);
  },

  deleteMessagesByConversation: (conversationId: string): void => {
    const allMessages = LocalStorage.getAllMessages();
    delete allMessages[conversationId];
    const userId = LocalStorage.getCurrentUserId();
    if (userId) {
      localStorage.setItem(STORAGE_KEYS.MESSAGES(userId), JSON.stringify(allMessages));
    }
  },
  // Profile operations
  setProfile: (profile: Profile): void => {
    const userId = LocalStorage.getCurrentUserId();
    if (userId) {
      localStorage.setItem(STORAGE_KEYS.PROFILE(userId), JSON.stringify(profile));
    }
  },

  getProfile: (): Profile | null => {
    const userId = LocalStorage.getCurrentUserId();
    if (!userId) return null;
    const data = localStorage.getItem(STORAGE_KEYS.PROFILE(userId));
    return data ? JSON.parse(data) : null;
  },

  // API Key operations
  setApiKey: (apiKey: string): void => {
    const userId = LocalStorage.getCurrentUserId();
    if (userId) {
      localStorage.setItem(STORAGE_KEYS.API_KEY(userId), apiKey);
    }
  },

  getApiKey: (): string | null => {
    const userId = LocalStorage.getCurrentUserId();
    if (!userId) return null;
    return localStorage.getItem(STORAGE_KEYS.API_KEY(userId));
  },

  // Sync operations
  setLastSync: (timestamp: string): void => {
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, timestamp);
  },

  getLastSync: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
  },
  // Utility operations
  clearAll: (): void => {
    // Clear all localStorage keys that start with 'auberon_'
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('auberon_')) {
        localStorage.removeItem(key);
      }
    });
  },

  // Export/Import for premium migration
  exportAllData: () => {
    return {
      user: LocalStorage.getUser(),
      conversations: LocalStorage.getConversations(),
      messages: LocalStorage.getAllMessages(),
      profile: LocalStorage.getProfile(),
      lastSync: LocalStorage.getLastSync()
    };
  },
  importAllData: (data: any): void => {
    if (data.user) LocalStorage.setUser(data.user);
    if (data.conversations) LocalStorage.setConversations(data.conversations);
    if (data.messages) {
      const userId = LocalStorage.getCurrentUserId();
      if (userId) {
        localStorage.setItem(STORAGE_KEYS.MESSAGES(userId), JSON.stringify(data.messages));
      }
    }
    if (data.profile) LocalStorage.setProfile(data.profile);
    if (data.lastSync) LocalStorage.setLastSync(data.lastSync);
  }
};

// Utility functions
export const generateId = (): string => {
  return crypto.randomUUID();
};

export const createGuestUser = (displayName: string): LocalUser => {
  return {
    id: generateId(),
    display_name: displayName,
    is_guest: true,
    is_premium: false,
    created_at: new Date().toISOString()
  };
};

export const createLocalUser = (email: string, displayName: string): LocalUser => {
  return {
    id: generateId(),
    email,
    display_name: displayName,
    is_guest: false,
    is_premium: false,
    created_at: new Date().toISOString()
  };
};
