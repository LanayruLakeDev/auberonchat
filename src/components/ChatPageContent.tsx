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
  const { profile, isLoading, conversations, setActiveConversation, activeConversation, user, isGuest } = useChat();  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showApiKeyPrompt, setShowApiKeyPrompt] = useState(false);
  const router = useRouter();
  
  useDynamicTitle(activeConversation);
  useEffect(() => {
    if (!isLoading) {
      // Check if user needs to set up API key - show onboarding prompt
      const needsApiKey = isGuest 
        ? !LocalStorage.getApiKey()
        : !profile?.openrouter_api_key;
        
      if (needsApiKey) {
        setShowApiKeyPrompt(true);
      } else {
        setShowApiKeyPrompt(false);
      }
    }
  }, [profile, isLoading, user, isGuest]);

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
        
        {/* API Key Onboarding Modal */}
        {showApiKeyPrompt && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 max-w-md mx-4"
            >
              <h3 className="text-xl font-bold text-white mb-4">Setup Required</h3>
              <p className="text-white/80 mb-6">
                To start chatting, you need to configure your API key in settings.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/settings')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Go to Settings
                </button>
                <button
                  onClick={() => setShowApiKeyPrompt(false)}
                  className="px-4 py-2 text-white/60 hover:text-white transition-colors"
                >
                  Later
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
