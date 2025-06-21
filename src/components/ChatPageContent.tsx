'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useChat } from '@/contexts/ChatContext';
import { ChatSidebar } from '@/components/ChatSidebar';
import { ChatMessages } from '@/components/ChatMessages';
import { ChatInput } from '@/components/ChatInput';
import { useDynamicTitle } from '@/lib/useDynamicTitle';
import { LocalStorage } from '@/lib/localStorage';
import { Key, Sparkles } from 'lucide-react';

interface ChatPageContentProps {
  chatId?: string;
}

export function ChatPageContent({ chatId }: ChatPageContentProps) {
  const { profile, isLoading, conversations, setActiveConversation, activeConversation, user, isGuest } = useChat();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const router = useRouter();
  
  useDynamicTitle(activeConversation);
  useEffect(() => {
    if (!isLoading) {
      // Check if user needs to set up API key - redirect to settings
      const needsApiKey = isGuest 
        ? !LocalStorage.getApiKey()
        : !profile?.openrouter_api_key;
        
      if (needsApiKey) {
        // Redirect to settings page for API key setup
        router.push('/settings');
      }
    }
  }, [profile, isLoading, user, isGuest, router]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center animated-bg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="loading-dots mb-4">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p className="text-white/60">Loading chat...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-screen flex animated-bg overflow-hidden"
    >
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <ChatSidebar 
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 30 }}
        className="flex-1 flex flex-col relative"
      >
        <ChatMessages isSidebarCollapsed={isSidebarCollapsed} />
          <ChatInput />
      </motion.div>
    </motion.div>
  );
}
