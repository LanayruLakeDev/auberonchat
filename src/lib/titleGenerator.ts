import { createAIService } from './openrouter';
import { ChutesService } from './chutes';
import { OpenRouterService } from './openrouter';

export class TitleGenerator {
  private userApiKey?: string;

  constructor(userApiKey?: string) {
    this.userApiKey = userApiKey;
  }

  async generateTitle(userMessage: string, assistantResponse?: string): Promise<string> {
    try {
      console.log('[TitleGenerator] Starting title generation');
      const prompt = this.buildTitlePrompt(userMessage, assistantResponse);
      const aiService = createAIService(this.userApiKey);
      
      console.log(`[TitleGenerator] AI Service type: ${aiService.constructor.name}`);
      console.log(`[TitleGenerator] User API Key provided: ${!!this.userApiKey}`);
      
      let title = '';
      if (aiService instanceof OpenRouterService) {
        // Use a fast model for title generation on OpenRouter
        const model = 'google/gemini-2.0-flash-lite-001';
        console.log(`[TitleGenerator] Using OpenRouter model: ${model}`);
        title = await aiService.createChatCompletion(
          model,
          [{ role: 'user', content: prompt }]
        );
      } else if (aiService instanceof ChutesService) {
        // Use a fast, free model for title generation on LLM7
        const model = 'deepseek-v3-0324'; // Use LLM7 format model name
        console.log(`[TitleGenerator] Using LLM7 model: ${model}`);
        title = await aiService.createChatCompletion({
          model,
          messages: [{ role: 'user', content: prompt }],
          onChunk: () => {}, // Title generation doesn't need streaming chunks
        });
      }
      
      console.log(`[TitleGenerator] Raw title received: "${title}"`);
      
      if (!title) {
        console.log('[TitleGenerator] No title generated, using fallback');
        throw new Error('No title generated');
      }

      // Clean up the title - remove quotes and ensure it's not too long
      const cleanTitle = title
        .replace(/^["\']|["\']$/g, '') // Remove surrounding quotes
        .substring(0, 60) // Max 60 characters
        .trim();

      console.log(`[TitleGenerator] Final cleaned title: "${cleanTitle}"`);
      return cleanTitle || this.getFallbackTitle(userMessage);
    } catch (error) {
      console.error('[TitleGenerator] Error generating title:', error);
      const fallbackTitle = this.getFallbackTitle(userMessage);
      console.log(`[TitleGenerator] Using fallback title: "${fallbackTitle}"`);
      return fallbackTitle;
    }
  }

  private buildTitlePrompt(userMessage: string, assistantResponse?: string): string {
    const context = assistantResponse 
      ? `User: ${userMessage}\n\nAssistant: ${assistantResponse.substring(0, 200)}...`
      : `User: ${userMessage}`;

    return `Generate a very short, concise title (max 6 words) for this conversation. The title should capture the main topic or task. Do not use quotes or punctuation. Examples:
- "Python data analysis help"
- "React component debugging"
- "Travel planning for Japan"
- "Math homework assistance"

Conversation:
${context}

Title:`;
  }

  private getFallbackTitle(userMessage: string): string {
    // Clean fallback - remove common prefixes and create a meaningful short title
    const cleaned = userMessage
      .replace(/^(hi|hello|hey|can you|could you|please|help me|i need|how do i|what is|explain)/i, '')
      .trim();
    
    const words = cleaned.split(' ').slice(0, 6); // Max 6 words
    const title = words.join(' ');
    
    return title.length > 3 
      ? title.substring(0, 50) + (title.length > 50 ? '...' : '')
      : userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : '');
  }
}