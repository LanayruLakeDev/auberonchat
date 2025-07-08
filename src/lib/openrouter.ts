import { ChatMessage, OpenRouterModel } from '@/types/chat';
import { ChutesService } from './chutes';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export class OpenRouterService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = OPENROUTER_BASE_URL;
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

  async getAvailableModels(): Promise<string[]> {
    // For OpenRouter, return the popular models list
    return getPopularModels();
  }

  private mapModelName(model: string): string {
    // For OpenRouter, use model name as-is
    console.log(`[OpenRouter] Using model name as-is: "${model}"`);
    return model;
  }

  async createChatCompletion(
    model: string,
    messages: ChatMessage[],
    onChunk?: (chunk: string) => void,
    referer?: string
  ): Promise<string> {
    console.log(`🚀 STARTING createChatCompletion - Provider: OpenRouter`);
    console.log(`🚀 STARTING - Model: ${model}`);
    console.log(`🚀 STARTING - Messages count: ${messages.length}`);
    console.log(`🚀 STARTING - Has onChunk: ${!!onChunk}`);
    console.log(`🚀 STARTING - Base URL: ${this.baseUrl}`);
    
    try {
      const mappedModel = this.mapModelName(model);
      
      console.log(`[OpenRouter] Creating chat completion with model: ${mappedModel}`);
      console.log(`[OpenRouter] Original model name: ${model}`);
      console.log(`[OpenRouter] API URL: ${this.baseUrl}/chat/completions`);
      
      const requestBody = {
        model: mappedModel,
        messages,
        stream: !!onChunk,
        max_tokens: 4000,
        temperature: 0.7,
      };
      
      console.log(`[OpenRouter] Request body:`, JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...(referer && { 'HTTP-Referer': referer }),
          'X-Title': 'T3 Cloneathon Chat',
        },
        body: JSON.stringify(requestBody),
      });

      console.log(`[OpenRouter] Response status: ${response.status}`);
      console.log(`[OpenRouter] Response ok: ${response.ok}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`[OpenRouter] Error response text:`, errorText);
        
        let errorMessage = 'Failed to create completion';
        
        try {
          const errorData = JSON.parse(errorText);
          console.log(`[OpenRouter] Error data parsed:`, errorData);
          errorMessage = errorData.error?.message || errorData.message || errorMessage;
        } catch {
          console.log(`[OpenRouter] Error response not JSON, using raw text`);
          errorMessage = errorText || errorMessage;
        }
        
        // Add more context to common errors
        if (errorMessage.includes('Invalid API key') || errorMessage.includes('authentication')) {
          errorMessage = 'OpenRouter API key is invalid. Please check your API key in settings.';
        } else if (errorMessage.includes('model') && errorMessage.includes('not found')) {
          errorMessage = `Model "${model}" is not available on OpenRouter. Please try a different model.`;
        }
        
        throw new Error(errorMessage);
      }

      if (onChunk && response.body) {
        console.log(`[OpenRouter] Starting streaming response parsing`);
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.log(`[OpenRouter] Streaming complete. Full response length:`, fullResponse.length);
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            console.log(`[OpenRouter] Raw chunk received:`, chunk);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                console.log(`[OpenRouter] Processing data line:`, data);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  console.log(`[OpenRouter] Parsed data:`, parsed);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    console.log(`[OpenRouter] Content chunk:`, content);
                    fullResponse += content;
                    onChunk(content);
                  }
                } catch (e) {
                  console.log(`[OpenRouter] Failed to parse JSON:`, e, 'Data:', data);
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
      console.error('❌ FATAL ERROR in createChatCompletion:', error);
      console.error('❌ ERROR TYPE:', typeof error);
      console.error('❌ ERROR NAME:', error instanceof Error ? error.name : 'Unknown');
      console.error('❌ ERROR MESSAGE:', error instanceof Error ? error.message : String(error));
      console.error('❌ ERROR STACK:', error instanceof Error ? error.stack : 'No stack');
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
export function createAIService(userApiKey?: string): OpenRouterService | ChutesService {
  console.log('🔧 CREATE_AI_SERVICE: Called with userApiKey:', !!userApiKey);
  
  // If user has provided their own API key, use OpenRouter
  if (userApiKey && userApiKey.trim()) {
    console.log('✅ CREATE_AI_SERVICE: Using OpenRouter with user API key');
    return new OpenRouterService(userApiKey);
  }
  
  // Otherwise, fall back to the system's Chutes provider
  console.log('✅ CREATE_AI_SERVICE: Using Chutes service as fallback');
  const chutesKey = process.env.CHUTES_KEY;
  if (!chutesKey) {
    throw new Error('Chutes API key is not configured on the server.');
  }
  return new ChutesService(chutesKey);
}

// Get models list for OpenRouter - Cleaned up to include only frontier, strong, and big models
export const getPopularModels = (): string[] => [
  // Google - Pro version only
  'google/gemini-2.5-pro-preview',
  
  // OpenAI - Frontier models only (no mini/nano)
  'openai/gpt-4o-2024-11-20',
  'openai/gpt-4.1',
  
  // Anthropic - All strong models
  'anthropic/claude-opus-4',
  'anthropic/claude-sonnet-4',
  'anthropic/claude-3.7-sonnet',
  'anthropic/claude-3.5-sonnet',
  
  // Meta Llama - Large models only (no 8B/70B variants)
  'meta-llama/llama-3.3-70b-instruct',
  'meta-llama/llama-4-scout',
  'meta-llama/llama-4-maverick',
  'meta-llama/llama-3.1-405b-instruct:free',
  
  // DeepSeek - Keep both variants
  'deepseek/deepseek-chat-v3-0324:free',
  'deepseek/deepseek-r1-0528:free',
  
  // X.AI - Frontier only (no mini)
  'x-ai/grok-3-beta',
  
  // Mistral - Large only (no small)
  'mistralai/mistral-large-2412',
  
  // NousResearch - Strong models
  'nousresearch/hermes-3-llama-3.1-405b:free',
  'tngtech/DeepSeek-TNG-R1T2-Chimera',
  'NousResearch/DeepHermes-3-Mistral-24B-Preview',
  
  // Qwen - All variants (as requested exception)
  'Qwen/QwQ-32B',
  'Qwen/Qwen2.5-VL-32B-Instruct',
  'Qwen/Qwen3-235B-A22B',
  'qwen/qwen-2.5-72b-instruct:free',
  
  // Sophosympatheia - Keep Rose (as requested exception)
  'sophosympatheia/midnight-rose-70b:free'
];