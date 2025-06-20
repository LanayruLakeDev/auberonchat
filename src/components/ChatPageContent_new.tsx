'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useChat } from '@/contexts/ChatContext';
import { ChatSidebar } from '@/components/ChatSidebar';
import { ChatMessages } from '@/components/ChatMessages';
import { ChatInput } from '@/components/ChatInput';
import { SettingsModal } from '@/components/SettingsModal';
import { useDynamicTitle } from '@/lib/useDynamicTitle';
import { Key, Sparkles } from 'lucide-react';

interface ChatPageContentProps {
  chatId?: string;
}

export function ChatPageContent({ chatId }: ChatPageContentProps) {
  const { profile, isLoading, conversations, setActiveConversation, activeConversation, user } = useChat();
  const [showSettings, setShowSettings] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  useDynamicTitle(activeConversation);

  // NOTE: activeConversation management is now handled in ChatContext
  // This useEffect was removed to prevent conflicts with the ChatContext URL effect
  // The ChatContext properly handles conversation switching based on URL changes

  useEffect(() => {
    if (!isLoading) {
      // For authenticated users - require API key
      if (profile && !profile.openrouter_api_key && !user?.is_guest) {
        setShowSettings(true);
      }
      // For guest users - prompt for API key if not in localStorage
      else if (user?.is_guest) {
        const guestApiKey = localStorage.getItem('guest_openrouter_api_key');
        if (!guestApiKey) {
          setShowSettings(true);
        }
      }
    }
  }, [profile, isLoading, user]);

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

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </motion.div>
  );
}
