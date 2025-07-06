import { ChatMessage, OpenRouterModel } from '@/types/chat';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const CHUTES_BASE_URL = 'https://api.chutes.ai/v1';

// Model name mappings from OpenRouter format to Chutes format
const OPENROUTER_TO_CHUTES_MODEL_MAP: Record<string, string> = {
  // Google models
  'google/gemini-2.0-flash-001': 'gemini-2.0-flash',
  'google/gemini-2.0-flash-lite-001': 'gemini-2.0-flash-lite',
  'google/gemini-2.5-flash-preview-05-20': 'gemini-2.5-flash-preview',
  'google/gemini-2.5-pro-preview': 'gemini-2.5-pro-preview',
  
  // Meta LLaMA models
  'meta-llama/llama-3.3-70b-instruct': 'llama-3.3-70b-instruct',
  'meta-llama/llama-4-scout': 'llama-4-scout',
  'meta-llama/llama-4-maverick': 'llama-4-maverick',
  
  // DeepSeek models
  'deepseek/deepseek-chat-v3-0324:free': 'deepseek-chat-v3',
  'deepseek/deepseek-r1-0528:free': 'deepseek-r1',
  
  // X.AI Grok models
  'x-ai/grok-3-beta': 'grok-3-beta',
  'x-ai/grok-3-mini-beta': 'grok-3-mini-beta',
  
  // Mistral models
  'mistralai/mistral-large-2412': 'mistral-large-2412',
  'mistralai/mistral-small-2412': 'Mistral-Small-3.1-24B-Instruct-2503',
  'mistralai/pixtral-large-2412': 'pixtral-large-2412',
  'mistralai/mistral-7b-instruct': 'mistral-7b-instruct'
};

export class OpenRouterService {
  private apiKey: string;
  private useChutesAI: boolean;
  private baseUrl: string;

  constructor(apiKey: string, useChutesAI: boolean = false) {
    this.apiKey = apiKey;
    this.useChutesAI = useChutesAI;
    this.baseUrl = useChutesAI ? CHUTES_BASE_URL : OPENROUTER_BASE_URL;
  }

  async getModels(): Promise<OpenRouterModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  }

  private mapModelName(model: string): string {
    // If using Chutes AI and the model has a mapping, use the mapped name
    if (this.useChutesAI && OPENROUTER_TO_CHUTES_MODEL_MAP[model]) {
      return OPENROUTER_TO_CHUTES_MODEL_MAP[model];
    }
    // Otherwise use the original model name
    return model;
  }

  async createChatCompletion(
    model: string,
    messages: ChatMessage[],
    onChunk?: (chunk: string) => void,
    referer?: string
  ): Promise<string> {
    try {
      const mappedModel = this.mapModelName(model);
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...(referer && { 'HTTP-Referer': referer }),
          'X-Title': 'T3 Cloneathon Chat',
        },
        body: JSON.stringify({
          model: mappedModel,
          messages,
          stream: !!onChunk,
          max_tokens: 4000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create completion');
      }

      if (onChunk && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    fullResponse += content;
                    onChunk(content);
                  }
                } catch (e) {
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }

        return fullResponse;
      } else {
        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
      }
    } catch (error) {
      console.error('Error creating chat completion:', error);
      throw error;
    }
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

// Helper function to create the appropriate service based on API key availability
export function createAIService(userApiKey?: string): OpenRouterService {
  // If user has provided their own API key, use OpenRouter
  if (userApiKey && userApiKey.trim()) {
    return new OpenRouterService(userApiKey, false);
  }
  
  // Otherwise, fallback to Chutes AI with our internal key
  const chutesKey = process.env.CHUTES_KEY;
  if (!chutesKey) {
    throw new Error('No API key available. Please provide an OpenRouter API key or configure CHUTES_KEY environment variable.');
  }
  
  return new OpenRouterService(chutesKey, true);
}

// Helper function to check if a model is supported by Chutes AI
export function isModelSupportedByChutes(model: string): boolean {
  // Claude and OpenAI models are not supported by Chutes
  if (model.startsWith('anthropic/') || model.startsWith('openai/')) {
    return false;
  }
  
  // Check if the model has a mapping or is supported
  return OPENROUTER_TO_CHUTES_MODEL_MAP.hasOwnProperty(model) || 
         !model.includes('/'); // Simple heuristic for already-mapped models
}

export const getPopularModels = (): string[] => [
  'google/gemini-2.0-flash-001',
  'google/gemini-2.0-flash-lite-001',
  'google/gemini-2.5-flash-preview-05-20',
  'google/gemini-2.5-pro-preview',
  'openai/gpt-4o-mini',
  'openai/gpt-4o-2024-11-20',
  'openai/gpt-4.1',
  'openai/gpt-4.1-mini',
  'openai/gpt-4.1-nano',
  'openai/o3-mini',
  'openai/o4-mini',
  'anthropic/claude-opus-4',
  'anthropic/claude-sonnet-4',
  'anthropic/claude-3.7-sonnet',
  'anthropic/claude-3.5-sonnet',
  'meta-llama/llama-3.3-70b-instruct',
  'meta-llama/llama-4-scout',
  'meta-llama/llama-4-maverick',
  'deepseek/deepseek-chat-v3-0324:free',
  'deepseek/deepseek-r1-0528:free',
  'x-ai/grok-3-beta',
  'x-ai/grok-3-mini-beta',
  'mistralai/mistral-large-2412',
  'mistralai/mistral-small-2412',
  'mistralai/pixtral-large-2412',
  'mistralai/mistral-7b-instruct'
]; 