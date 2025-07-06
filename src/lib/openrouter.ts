import { ChatMessage, OpenRouterModel } from '@/types/chat';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const CHUTES_BASE_URL = 'https://api.chutes.ai/v1';

// Model name mappings from OpenRouter format to Chutes format
const OPENROUTER_TO_CHUTES_MODEL_MAP: Record<string, string> = {
  // Meta LLaMA models - Confirmed Chutes AI naming
  'meta-llama/llama-4-maverick': 'chutesai/Llama-4-Maverick-17B-128E-Instruct-FP8',
  
  // DeepSeek models - Only ones that exist in OpenRouter
  'deepseek/deepseek-chat-v3-0324:free': 'deepseek-ai/DeepSeek-V3-0324',
  'deepseek/deepseek-r1-0528:free': 'deepseek-ai/DeepSeek-R1-0528',
};

// Confirmed Chutes AI available models (includes both mapped and Chutes-only models)
const CHUTES_AVAILABLE_MODELS: string[] = [
  // Models that exist in OpenRouter (will be mapped)
  'meta-llama/llama-4-maverick',
  'deepseek/deepseek-chat-v3-0324:free',
  'deepseek/deepseek-r1-0528:free',
  
  // Chutes-only models (not available in OpenRouter)
  'tngtech/DeepSeek-TNG-R1T2-Chimera',
  'Qwen/QwQ-32B',
  'Qwen/Qwen2.5-VL-32B-Instruct',
  'Qwen/Qwen3-235B-A22B',
  'NousResearch/DeepHermes-3-Mistral-24B-Preview',
];

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
    // If using Chutes AI
    if (this.useChutesAI) {
      // Check if it's an OpenRouter model that needs mapping
      if (OPENROUTER_TO_CHUTES_MODEL_MAP[model]) {
        const mappedName = OPENROUTER_TO_CHUTES_MODEL_MAP[model];
        console.log(`[Chutes] Mapping OpenRouter model "${model}" to Chutes model "${mappedName}"`);
        return mappedName;
      }
      // If it's already a Chutes-only model name, use it as-is
      console.log(`[Chutes] Using Chutes-only model: "${model}"`);
      return model;
    }
    // Otherwise use the original model name for OpenRouter
    console.log(`[OpenRouter] Using model name as-is: "${model}"`);
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
      
      console.log(`[${this.useChutesAI ? 'Chutes' : 'OpenRouter'}] Creating chat completion with model: ${mappedModel}`);
      console.log(`[${this.useChutesAI ? 'Chutes' : 'OpenRouter'}] API URL: ${this.baseUrl}/chat/completions`);
      
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
        const errorText = await response.text();
        let errorMessage = 'Failed to create completion';
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error?.message || errorData.message || errorMessage;
        } catch {
          // If not JSON, use the raw text
          errorMessage = errorText || errorMessage;
        }
        
        // Add more context to common errors
        if (errorMessage.includes('Invalid API key') || errorMessage.includes('authentication')) {
          if (this.useChutesAI) {
            errorMessage = 'Chutes AI service authentication failed. Please contact the administrator.';
          } else {
            errorMessage = 'OpenRouter API key is invalid. Please check your API key in settings.';
          }
        } else if (errorMessage.includes('model') && errorMessage.includes('not found')) {
          errorMessage = `Model "${model}" is not available${this.useChutesAI ? ' on Chutes AI' : ' on OpenRouter'}. Please try a different model.`;
        }
        
        throw new Error(errorMessage);
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
  if (!chutesKey || chutesKey.trim() === '' || chutesKey === 'your_chutes_ai_api_key_here') {
    throw new Error('Chutes AI service is not configured. Please add your OpenRouter API key in settings to use AI models, or contact the administrator to configure the Chutes service.');
  }
  
  return new OpenRouterService(chutesKey, true);
}

// Helper function to check if a model is supported by Chutes AI
export function isModelSupportedByChutes(model: string): boolean {
  // Only models in our confirmed list are supported
  return CHUTES_AVAILABLE_MODELS.includes(model);
}

// Get models list based on provider (OpenRouter vs Chutes)
export const getPopularModels = (): string[] => [
  // Full OpenRouter model list (when user has their own API key)
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

// Get Chutes available models (when using our provider)
export const getChutesModels = (): string[] => CHUTES_AVAILABLE_MODELS; 