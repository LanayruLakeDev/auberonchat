import { ChatMessage } from '@/types/chat';

const CHUTES_API_URL = 'https://api.llm7.io/v1/chat/completions';

// This is the list of models we know are available on the Chutes AI system provider.
// This should be updated if the provider changes their model offerings.
export const CHUTES_SYSTEM_MODELS = [
  // DeepSeek models (shared with OpenRouter)
  'deepseek/deepseek-chat-v3-0324:free',
  'deepseek/deepseek-r1-0528:free',
  
  // LLM7-exclusive models
  'deepseek-v3-0324',
  'deepseek-r1-0528', 
  'grok-3-mini-high',
  'llama-fast-roblox',
  'llama-4-scout-17b-16e-instruct',
  'mistral-small-3.1-24b-instruct-2503',
  'gpt-4o-mini-2024-07-18',
  'gpt-4.1-nano-2025-04-14',
  'openai-reasoning',
  'phi-4-multilmodal-instruct',
  'qwen2.5-coder-32b-instruct',
  'mistral-large-2411',
  'codestral-2501',
  'mistral-medium',
  'open-mixtral-8x22b',
  'pixtral-large-2411',
];

// Model name mappings from the standard OpenRouter format to the specific format LLM7 requires.
const MODEL_MAPPINGS: Record<string, string> = {
  'deepseek/deepseek-chat-v3-0324:free': 'deepseek-v3-0324',
  'deepseek/deepseek-r1-0528:free': 'deepseek-r1-0528',
};

/**
 * A dedicated service for interacting with the Chutes AI API.
 */
export class ChutesService {
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey || apiKey.trim() === '' || apiKey === 'your_chutes_ai_api_key_here') {
      throw new Error('ChutesService: A valid API key is required.');
    }
    this.apiKey = apiKey;
    console.log('✅ ChutesService instantiated (using LLM7)', apiKey === 'unused' ? 'with default key' : 'with custom key');
  }

  /**
   * Get the list of available models for this service
   */
  async getAvailableModels(): Promise<string[]> {
    return CHUTES_SYSTEM_MODELS;
  }

  /**
   * Check if a model is supported by this service
   */
  static isModelSupported(model: string): boolean {
    return CHUTES_SYSTEM_MODELS.includes(model);
  }

  /**
   * Creates a chat completion stream from the Chutes AI API.
   */
  async createChatCompletion({
    model,
    messages,
    onChunk,
  }: {
    model: string;
    messages: ChatMessage[];
    onChunk: (chunk: string) => void;
  }): Promise<string> {
    const mappedModel = MODEL_MAPPINGS[model] || model;
    console.log(`[ChutesService] Requesting completion for model: ${model} (mapped to: ${mappedModel}) via LLM7`);

    const requestBody = {
      model: mappedModel,
      messages,
      stream: true,
      max_tokens: 4000,
      temperature: 0.7,
    };

    try {
      const response = await fetch(CHUTES_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-Title': 'Auberon Chat via LLM7',
        },
        body: JSON.stringify(requestBody),
      });

      console.log(`[ChutesService] Response status: ${response.status}`);

      if (!response.ok || !response.body) {
        const errorText = await response.text();
        console.error(`[ChutesService] API Error - Status: ${response.status}, Body: ${errorText}`);
        throw new Error(`Chutes AI API Error: ${errorText}`);
      }
      
      // The response is OK, but it could still be a JSON error instead of a stream.
      // We will read the stream and handle both cases.
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('[ChutesService] Stream finished.');
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last, possibly incomplete line

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data.trim() === '[DONE]') {
              continue;
            }
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullResponse += content;
                onChunk(content);
              }
            } catch (e) {
              console.error('[ChutesService] Failed to parse stream JSON:', e, 'Data:', data);
            }
          }
        }
      }
      
      // After the loop, check if the full response is a JSON error
      if (fullResponse.trim().startsWith('{')) {
        try {
            const potentialError = JSON.parse(fullResponse);
            if (potentialError.error) {
                console.error('[ChutesService] Received JSON error in stream:', potentialError.error);
                throw new Error(`Chutes AI API Error: ${potentialError.error.message || fullResponse}`);
            }
        } catch (e) {
            // It wasn't a JSON error, so we assume the stream was valid.
        }
      }

      if (fullResponse.trim() === '') {
        console.warn('[ChutesService] Stream was empty.');
      }

      return fullResponse;

    } catch (error) {
      console.error('[ChutesService] Fatal error in createChatCompletion:', error);
      if (error instanceof Error) {
        throw error; // Re-throw the original error
      }
      throw new Error('An unknown error occurred in the Chutes service.');
    }
  }
}
