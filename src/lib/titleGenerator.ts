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
      const prompt = this.buildTitlePrompt(userMessage, assistantResponse);
      const aiService = createAIService(this.userApiKey);
      
      let title = '';
      if (aiService instanceof OpenRouterService) {
        // Use a fast model for title generation on OpenRouter
        const model = 'google/gemini-2.0-flash-lite-001';
        title = await aiService.createChatCompletion(
          model,
          [{ role: 'user', content: prompt }]
        );
      } else if (aiService instanceof ChutesService) {
        // Use a fast, free model for title generation on Chutes
        const model = 'deepseek/deepseek-chat-v3-0324:free'; 
        title = await aiService.createChatCompletion({
          model,
          messages: [{ role: 'user', content: prompt }],
          onChunk: () => {}, // Title generation doesn't need streaming chunks
        });
      }
      
      if (!title) {
        throw new Error('No title generated');
      }

      // Clean up the title - remove quotes and ensure it's not too long
      const cleanTitle = title
        .replace(/^["\']|["\']$/g, '') // Remove surrounding quotes
        .substring(0, 60) // Max 60 characters
        .trim();

      return cleanTitle || this.getFallbackTitle(userMessage);
    } catch (error) {
      console.error('Error generating title:', error);
      return this.getFallbackTitle(userMessage);
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