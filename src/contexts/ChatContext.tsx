'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Conversation, Message, Profile } from '@/types/chat';
import { createClient } from '@/lib/supabase-client';

interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  profile: Profile | null;
  user: any | null;
  isLoading: boolean;
  setActiveConversation: (conversation: Conversation | null) => void;
  refreshConversations: () => Promise<void>;
  refreshMessages: (conversationId: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshUser: () => Promise<void>;
  createNewConversation: () => void;
  deleteConversation: (conversationId: string) => Promise<void>;
  updateConversationTitle: (conversationId: string, newTitle: string) => void;
  addNewConversation: (conversation: Conversation) => void;
  addOptimisticMessage: (message: Omit<Message, 'id' | 'created_at'>) => string;
  updateStreamingMessage: (messageId: string, content: string) => void;
  finalizeMessage: (messageId: string, finalContent: string) => void;
  removeOptimisticMessage: (messageId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newConversationIds, setNewConversationIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handlePopState = () => {
      const pathname = window.location.pathname;
      const chatIdMatch = pathname.match(/^\/chat\/(.+)$/);
      
      if (chatIdMatch && chatIdMatch[1] && conversations.length > 0) {
        const chatId = chatIdMatch[1];
        const conversation = conversations.find(conv => conv.id === chatId);
        if (conversation && conversation.id !== activeConversation?.id) {
          setActiveConversation(conversation);
        }
      } else if (pathname === '/chat' && activeConversation) {
        setActiveConversation(null);
        setMessages([]);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [conversations, activeConversation]);

  useEffect(() => {
    console.log('🔄 URL_EFFECT: Pathname changed:', window.location.pathname);
    const pathname = window.location.pathname;
    const chatIdMatch = pathname.match(/^\/chat\/(.+)$/);
    
    if (chatIdMatch && chatIdMatch[1] && conversations.length > 0) {
      const chatId = chatIdMatch[1];
      const conversation = conversations.find(conv => conv.id === chatId);
      
      console.log('🔍 URL_EFFECT: Looking for conversation ID:', chatId);
      console.log('🔍 URL_EFFECT: Found conversation:', !!conversation);
      console.log('🔍 URL_EFFECT: Current active ID:', activeConversation?.id);
      console.log('🔍 URL_EFFECT: New conversation IDs:', Array.from(newConversationIds));
      
      // Only set active conversation if:
      // 1. We found a conversation with the URL ID
      // 2. It's different from the current active conversation
      if (conversation && (!activeConversation || activeConversation.id !== conversation.id)) {
        console.log('✅ URL_EFFECT: Setting active conversation to:', conversation.id);
        setActiveConversation(conversation);
      } else {
        console.log('⏸️ URL_EFFECT: Not setting active conversation');
      }
    } else {
      console.log('⏸️ URL_EFFECT: No matching conversation or empty list');
    }
  }, [conversations, activeConversation]);

  const refreshConversations = async () => {
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const refreshMessages = async (conversationId: string) => {
    console.log('🔄 REFRESH_MESSAGES: Starting for conversation:', conversationId);
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        const serverMessages = data.messages || [];
        console.log('🔄 REFRESH_MESSAGES: Got', serverMessages.length, 'messages from server');
        
        setMessages(prev => {
          console.log('🔄 REFRESH_MESSAGES: Current messages count:', prev.length);
          // Keep optimistic messages that are actively streaming/loading
          const activeOptimisticMessages = prev.filter(msg => 
            msg.isOptimistic && 
            msg.conversation_id === conversationId &&
            (msg.isStreaming || msg.isLoading)
          );
          console.log('🔄 REFRESH_MESSAGES: Keeping', activeOptimisticMessages.length, 'active optimistic messages');
          
          // Keep finalized optimistic messages to prevent animation replay
          const finalizedOptimisticMessages = prev.filter(msg =>
            msg.isOptimistic && 
            msg.conversation_id === conversationId &&
            !msg.isStreaming && 
            !msg.isLoading &&
            msg.content && 
            msg.content.trim() !== ''
          );
          console.log('🔄 REFRESH_MESSAGES: Keeping', finalizedOptimisticMessages.length, 'finalized optimistic messages');
          
          // Only add server messages that don't have corresponding finalized optimistic messages
          const newServerMessages = serverMessages.filter((serverMsg: Message) => {
            return !finalizedOptimisticMessages.some(optMsg => {
              // Check if content matches (indicating same message)
              return optMsg.content === serverMsg.content && 
                     optMsg.role === serverMsg.role &&
                     Math.abs(new Date(optMsg.created_at).getTime() - new Date(serverMsg.created_at).getTime()) < 30000; // Within 30 seconds
            });
          });
          console.log('🔄 REFRESH_MESSAGES: Adding', newServerMessages.length, 'new server messages');
          
          const finalMessages = [...newServerMessages, ...finalizedOptimisticMessages, ...activeOptimisticMessages];
          console.log('🔄 REFRESH_MESSAGES: Final message count:', finalMessages.length);
          return finalMessages;
        });
      }
    } catch (error) {
      console.error('❌ REFRESH_MESSAGES: Error fetching messages:', error);
    }
  };

  const refreshProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
      } else if (response.status === 404 || response.status === 500) {
        const createResponse = await fetch('/api/profile/create', {
          method: 'POST',
        });
        if (createResponse.ok) {
          const retryResponse = await fetch('/api/profile');
          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            setProfile(retryData.profile);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const refreshUser = async () => {
    try {
      const supabase = createClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) {
        setUser(user);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const createNewConversation = () => {
    setActiveConversation(null);
    setMessages([]);
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations?id=${conversationId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await refreshConversations();
        if (activeConversation?.id === conversationId) {
          createNewConversation();
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const addOptimisticMessage = (message: Omit<Message, 'id' | 'created_at'>): string => {
    const optimisticId = `optimistic-${Date.now()}-${Math.random()}`;
    const optimisticMessage: Message = {
      ...message,
      id: optimisticId,
      created_at: new Date().toISOString(),
      isOptimistic: true,
    };
    
    console.log('➕ ADD_OPTIMISTIC: Adding message:', optimisticId, 'Role:', message.role, 'ConversationID:', message.conversation_id);
    setMessages(prev => {
      const newMessages = [...prev, optimisticMessage];
      console.log('➕ ADD_OPTIMISTIC: Total messages now:', newMessages.length);
      return newMessages;
    });
    return optimisticId;
  };

  const updateStreamingMessage = (messageId: string, content: string) => {
    console.log('🌊 UPDATE_STREAMING: Updating message:', messageId, 'Content length:', content.length);
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, content, isStreaming: true, isLoading: false }
        : msg
    ));
  };

  const finalizeMessage = (messageId: string, finalContent: string) => {
    console.log('✅ FINALIZE_MESSAGE: Finalizing message:', messageId, 'Content length:', finalContent.length);
    setMessages(prev => {
      const updated = prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: finalContent, isOptimistic: false, isStreaming: false, isLoading: false }
          : msg
      );
      console.log('✅ FINALIZE_MESSAGE: Total messages after finalize:', updated.length);
      return updated;
    });
  };

  const removeOptimisticMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  const updateConversationTitle = (conversationId: string, newTitle: string) => {
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId 
        ? { ...conv, title: newTitle }
        : conv
    ));
    
    // Also update active conversation if it's the one being updated
    if (activeConversation?.id === conversationId) {
      setActiveConversation(prev => prev ? { ...prev, title: newTitle } : null);
    }
  };

  const addNewConversation = (conversation: Conversation) => {
    console.log('🆕 ADD_NEW_CONVERSATION: Adding conversation:', conversation.id);
    setConversations(prev => {
      const newConvs = [conversation, ...prev];
      console.log('🆕 ADD_NEW_CONVERSATION: Total conversations:', newConvs.length);
      return newConvs;
    });
    setNewConversationIds(prev => {
      const newSet = new Set([...prev, conversation.id]);
      console.log('🆕 ADD_NEW_CONVERSATION: New conversation IDs:', Array.from(newSet));
      return newSet;
    });
  };

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      await Promise.all([
        refreshConversations(),
        refreshProfile(),
        refreshUser(),
      ]);
      setIsLoading(false);
    };

    initializeData();
  }, []);

  useEffect(() => {
    console.log('🎯 ACTIVE_EFFECT: Active conversation changed to:', activeConversation?.id || 'null');
    console.log('🎯 ACTIVE_EFFECT: Current messages count:', messages.length);
    console.log('🎯 ACTIVE_EFFECT: New conversation IDs:', Array.from(newConversationIds));
    
    if (activeConversation) {
      // Check if this is a new conversation that shouldn't be refreshed yet
      if (newConversationIds.has(activeConversation.id)) {
        console.log('🆕 ACTIVE_EFFECT: NEW CONVERSATION detected, filtering messages only');
        // For new conversations, just filter messages but don't refresh
        const filteredMessages = messages.filter(msg => 
          msg.conversation_id === activeConversation.id
        );
        console.log('🆕 ACTIVE_EFFECT: Filtered messages count:', filteredMessages.length);
        setMessages(filteredMessages);
        
        // Remove from new conversations set after a delay to ensure optimistic messages are complete
        setTimeout(() => {
          console.log('⏰ ACTIVE_EFFECT: Removing from new conversation set:', activeConversation.id);
          setNewConversationIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(activeConversation.id);
            return newSet;
          });
        }, 1000); // Give enough time for streaming to complete
        return;
      }
      
      console.log('🔄 ACTIVE_EFFECT: EXISTING CONVERSATION detected, refreshing from DB');
      // For existing conversations, refresh normally
      const optimisticMessages = messages.filter(msg => 
        msg.isOptimistic && msg.conversation_id === activeConversation.id
      );
      console.log('🔄 ACTIVE_EFFECT: Keeping optimistic messages:', optimisticMessages.length);
      setMessages(optimisticMessages);
      
      console.log('🔄 ACTIVE_EFFECT: Calling refreshMessages for:', activeConversation.id);
      refreshMessages(activeConversation.id);
    } else {
      console.log('🗑️ ACTIVE_EFFECT: Clearing all messages (no active conversation)');
      setMessages([]);
    }
  }, [activeConversation]); // Don't include messages as dependency to avoid loops

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        messages,
        profile,
        user,
        isLoading,
        setActiveConversation,
        refreshConversations,
        refreshMessages,
        refreshProfile,
        refreshUser,
        createNewConversation,
        deleteConversation,
        updateConversationTitle,
        addNewConversation,
        addOptimisticMessage,
        updateStreamingMessage,
        finalizeMessage,
        removeOptimisticMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
} 