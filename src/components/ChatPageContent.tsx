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
  const { profile, isLoading, conversations, setActiveConversation, activeConversation, user, isGuest, refreshProfile } = useChat();  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showApiKeyPrompt, setShowApiKeyPrompt] = useState(false);
  
  // DEV: Set to true to enable API Key Onboarding Modal
  // This will be re-enabled once integrated AI is implemented
  const ENABLE_API_KEY_MODAL = false;
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isSubmittingKey, setIsSubmittingKey] = useState(false);
  const router = useRouter();
  
  useDynamicTitle(activeConversation);

  const handleApiKeySubmit = async () => {
    if (!apiKeyInput.trim()) return;
    
    setIsSubmittingKey(true);
    try {
      if (isGuest) {
        // For guest users, save to localStorage
        LocalStorage.setApiKey(apiKeyInput.trim());
        setShowApiKeyPrompt(false);
        setApiKeyInput('');
      } else {
        // For authenticated users, save to profile
        const response = await fetch('/api/profile', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            openrouter_api_key: apiKeyInput.trim(),
          }),
        });
        
        if (response.ok) {
          await refreshProfile();
          setShowApiKeyPrompt(false);
          setApiKeyInput('');
        } else {
          console.error('Failed to save API key');
        }
      }
    } catch (error) {
      console.error('Error saving API key:', error);
    } finally {
      setIsSubmittingKey(false);
    }
  };

  useEffect(() => {
    if (!isLoading && ENABLE_API_KEY_MODAL) {
      // Check if user needs to set up API key - show onboarding prompt
      const needsApiKey = isGuest 
        ? !LocalStorage.getApiKey()
        : !profile?.openrouter_api_key;
        
      if (needsApiKey) {
        setShowApiKeyPrompt(true);
      } else {
        setShowApiKeyPrompt(false);
      }
    } else {
      // If modal is disabled, ensure it's never shown
      setShowApiKeyPrompt(false);
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
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 max-w-lg mx-4"
            >
              <h3 className="text-xl font-bold text-white mb-4">Welcome to Auberon Chat! 🚀</h3>
              <p className="text-white/80 mb-6">
                To start chatting with AI, you need to enter your OpenRouter API key. This key stays on your device and is never shared.
              </p>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  OpenRouter API Key
                </label>                <input
                  type="password"
                  placeholder="sk-or-..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && apiKeyInput.trim() && !isSubmittingKey) {
                      handleApiKeySubmit();
                    }
                  }}
                  disabled={isSubmittingKey}
                />
                <p className="text-xs text-white/60 mt-2">
                  Get your free API key at <a href="https://openrouter.ai/keys" target="_blank" className="text-blue-400 hover:underline">openrouter.ai/keys</a>
                </p>
              </div>
                <div className="flex gap-3">
                <button
                  onClick={handleApiKeySubmit}
                  disabled={!apiKeyInput.trim() || isSubmittingKey}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {isSubmittingKey ? 'Saving...' : 'Start Chatting'}
                </button>
                <button
                  onClick={() => setShowApiKeyPrompt(false)}
                  disabled={isSubmittingKey}
                  className="px-4 py-2 text-white/60 hover:text-white transition-colors disabled:opacity-50"
                >
                  Skip for Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
