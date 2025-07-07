import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAIService, isModelSupportedByChutes } from '@/lib/openrouter';
import { ChutesService } from '@/lib/chutes';

export async function POST(request: NextRequest) {
  console.log('🎯 CHAT_API: Route called');
  
  try {
    const supabase = await createClient();
    console.log('🎯 CHAT_API: Supabase client created');
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('🎯 CHAT_API: User auth result - error:', !!userError, 'user:', !!user);

    // Check for guest user with API key
    const guestApiKey = request.headers.get('X-Guest-API-Key');
    const isGuest = !!guestApiKey;
    console.log('🎯 CHAT_API: Guest detection - guestApiKey:', !!guestApiKey, 'isGuest:', isGuest);

    // For authenticated users, keep existing validation
    if (!isGuest && (userError || !user)) {
      console.log('🎯 CHAT_API: Unauthorized - returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId, message, model, attachments = [], isGuest: bodyIsGuest } = await request.json();
    console.log('🎯 CHAT_API: Request parsed - conversationId:', !!conversationId, 'message:', !!message, 'model:', model);

    if ((!message || message.trim() === '') && attachments.length === 0) {
      console.log('🎯 CHAT_API: Missing message/attachments - returning 400');
      return NextResponse.json({ error: 'Message or attachments required' }, { status: 400 });
    }

    if (!model) {
      console.log('🎯 CHAT_API: Missing model - returning 400');
      return NextResponse.json({ error: 'Model is required' }, { status: 400 });
    }

    console.log('🎯 CHAT_API: Basic validation passed');
    
    // CHUTES_KEY DEBUG - Add this temporary check
    const chutesKey = process.env.CHUTES_KEY;
    console.log('🔑 CHAT_API: CHUTES_KEY exists:', !!chutesKey);
    console.log('🔑 CHAT_API: CHUTES_KEY length:', chutesKey?.length || 0);
    console.log('🔑 CHAT_API: CHUTES_KEY value preview:', chutesKey ? chutesKey.substring(0, 10) + '...' : 'undefined');
    console.log('🔑 CHAT_API: Is placeholder?', chutesKey === 'your_chutes_ai_api_key_here');

    // Get API key based on user type
    let userApiKey: string | undefined;
    
    if (isGuest) {
      // For guest users, use the API key from header (if provided)
      userApiKey = guestApiKey || undefined;
      console.log('🔑 CHAT_API: Guest user - API key from header:', !!userApiKey);
    } else {
      // For authenticated users, get API key from profile (if configured)
      const { data: profile } = await supabase
        .from('profiles')
        .select('openrouter_api_key')
        .eq('id', user!.id)
        .single();

      userApiKey = profile?.openrouter_api_key || undefined;
      console.log('🔑 CHAT_API: Authenticated user - API key from profile:', !!userApiKey);
    }

    console.log('🎯 CHAT_API: Selected model:', model);
    console.log('🎯 CHAT_API: Will use Chutes AI:', !userApiKey);
    console.log('🎯 CHAT_API: isModelSupportedByChutes result:', isModelSupportedByChutes(model));
    
    // Check if the model is supported by Chutes when no user API key is provided
    if (!userApiKey && !isModelSupportedByChutes(model)) {
      console.log('❌ CHAT_API: Model not supported by Chutes:', model);
      return NextResponse.json({ 
        error: `Model ${model} requires an OpenRouter API key. Please add your OpenRouter API key in settings, or choose a Chutes-supported model like Llama, Gemini, DeepSeek, or Grok.` 
      }, { status: 400 });
    }

    console.log('✅ CHAT_API: Model validation passed, proceeding with chat completion');

    let conversation = null;
    let messages = [];

    if (isGuest) {
      // For guest users, we don't store conversations/messages in DB
      // The client will handle conversation/message storage via localStorage
      // We just need to process the chat request and return the response
      
      // If conversationId is provided, it means the guest wants to continue an existing conversation
      // But since we don't have access to guest's localStorage here, we'll rely on the client
      // to provide the conversation context if needed in future iterations
      
      // For now, we'll create a temporary conversation object for the response
      conversation = {
        id: conversationId || `guest-${Date.now()}`,
        title: 'Guest Chat',
        model,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Guest messages are handled client-side, so we start with empty array
      messages = [];
    } else {
      // Existing authenticated user logic - unchanged
      if (conversationId) {
        const { data: existingConversation } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', conversationId)
          .eq('user_id', user!.id)
          .single();

        if (existingConversation) {
          conversation = existingConversation;
          
          const { data: existingMessages } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

          messages = existingMessages || [];
        }
      }

      if (!conversation) {
        const { data: newConversation, error: conversationError } = await supabase
          .from('conversations')
          .insert({
            user_id: user!.id,
            title: 'New Chat',
            model,
          })
          .select()
          .single();

        if (conversationError || !newConversation) {
          return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
        }

        conversation = newConversation;
      }

      const { data: userMessage, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          role: 'user',
          content: message || '',
        })
        .select()
        .single();

      if (messageError || !userMessage) {
        return NextResponse.json({ error: 'Failed to save user message' }, { status: 500 });
      }

      // Save attachments if any
      if (attachments.length > 0) {
        const attachmentInserts = attachments.map((attachment: any) => ({
          message_id: userMessage.id,
          filename: attachment.filename,
          file_type: attachment.file_type,
          file_size: attachment.file_size,
          file_url: attachment.file_url,
        }));

        const { error: attachmentError } = await supabase
          .from('attachments')
          .insert(attachmentInserts);

        if (attachmentError) {
          console.error('Failed to save attachments:', attachmentError);
          // Continue anyway, don't fail the entire request
        }
      }
    }

    // Build the current message content array format for OpenRouter Vision API
    const contentParts: any[] = [];
    
    // Add text content if present
    if (message && message.trim()) {
      contentParts.push({
        type: "text",
        text: message
      });
    }

    // Add attachments in proper OpenRouter format
    if (attachments.length > 0) {
      for (const attachment of attachments) {
        if (attachment.file_type.startsWith('image/')) {
          // For images, use image_url format
          contentParts.push({
            type: "image_url",
            image_url: {
              url: attachment.file_url
            }
          });
        } else if (attachment.file_type === 'application/pdf') {
          // For PDFs, we need to fetch and encode as base64
          try {
            const response = await fetch(attachment.file_url);
            const arrayBuffer = await response.arrayBuffer();
            const base64Data = Buffer.from(arrayBuffer).toString('base64');
            const dataUrl = `data:application/pdf;base64,${base64Data}`;
            
            contentParts.push({
              type: "file",
              file: {
                filename: attachment.filename,
                file_data: dataUrl
              }
            });
          } catch (error) {
            console.error('Failed to process PDF attachment:', error);
            // Fallback to text description if PDF processing fails
            contentParts.push({
              type: "text",
              text: `[PDF Document: ${attachment.filename} - Unable to process file content]`
            });
          }
        } else {
          // For other file types, add as text description
          contentParts.push({
            type: "text",
            text: `[File: ${attachment.filename}]`
          });
        }
      }
    }

    // Helper function to format message content with attachments
    const formatMessageContent = async (msg: any) => {
      if (msg.role === 'assistant' || !msg.attachments || msg.attachments.length === 0) {
        return msg.content;
      }

      const msgContentParts: any[] = [];
      
      // Add text content if present
      if (msg.content && msg.content.trim()) {
        msgContentParts.push({
          type: "text",
          text: msg.content
        });
      }

      // Add attachments in proper OpenRouter format
      for (const attachment of msg.attachments) {
        if (attachment.file_type.startsWith('image/')) {
          msgContentParts.push({
            type: "image_url",
            image_url: {
              url: attachment.file_url
            }
          });
        } else if (attachment.file_type === 'application/pdf') {
          try {
            const response = await fetch(attachment.file_url);
            const arrayBuffer = await response.arrayBuffer();
            const base64Data = Buffer.from(arrayBuffer).toString('base64');
            const dataUrl = `data:application/pdf;base64,${base64Data}`;
            
            msgContentParts.push({
              type: "file",
              file: {
                filename: attachment.filename,
                file_data: dataUrl
              }
            });
          } catch (error) {
            console.error('Failed to process PDF attachment:', error);
            msgContentParts.push({
              type: "text",
              text: `[PDF Document: ${attachment.filename} - Unable to process file content]`
            });
          }
        } else {
          msgContentParts.push({
            type: "text",
            text: `[File: ${attachment.filename}]`
          });
        }
      }

      return msgContentParts.length > 1 || (msgContentParts.length === 1 && msgContentParts[0].type !== 'text') 
        ? msgContentParts 
        : msgContentParts[0]?.text || msg.content;
    };

    // Build chat messages array with proper attachment formatting
    const formattedMessages = await Promise.all(
      messages.map(async (msg: any) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: await formatMessageContent(msg)
      }))
    );

    const chatMessages = [
      ...formattedMessages,
      { 
        role: 'user' as const, 
        content: contentParts.length > 1 || (contentParts.length === 1 && contentParts[0].type !== 'text') 
          ? contentParts 
          : contentParts[0]?.text || message || ''
      }
    ];

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let assistantResponse = '';

          if (userApiKey) {
            // Use the existing OpenRouter service if a user key is provided
            const aiService = createAIService(userApiKey);
            console.log('🤖 CHAT_API: Using OpenRouter service for user with API key.');
            await aiService.createChatCompletion(
              model,
              chatMessages,
              (chunk: string) => {
                assistantResponse += chunk;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
              },
              request.headers.get('origin') || undefined
            );
          } else {
            // Use the new, dedicated Chutes service for system provider
            const chutesKey = process.env.CHUTES_KEY;
            if (!chutesKey) throw new Error('Chutes API key is not configured on the server.');
            
            const chutesService = new ChutesService(chutesKey);
            console.log('🤖 CHAT_API: Using dedicated Chutes service for system provider.');
            await chutesService.createChatCompletion({
              model,
              messages: chatMessages,
              onChunk: (chunk: string) => {
                assistantResponse += chunk;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
              },
            });
          }

          // Save assistant response for authenticated users only
          if (!isGuest) {
            await supabase
              .from('messages')
              .insert({
                conversation_id: conversation.id,
                role: 'assistant',
                content: assistantResponse,
              });
          }

          // Generate title for new conversations after first response
          if (messages.length === 0) {
            try {
              const titleRequestHeaders: Record<string, string> = {
                'Content-Type': 'application/json',
              };
              
              const titleRequestBody: any = {
                userMessage: message,
                assistantResponse,
                conversationId: conversation.id,
              };

              if (isGuest) {
                // For guest users, pass the API key if available
                if (userApiKey) {
                  titleRequestHeaders['X-Guest-API-Key'] = userApiKey;
                }
                titleRequestBody.isGuest = true;
              } else {
                // For authenticated users, pass auth headers
                titleRequestHeaders['Authorization'] = request.headers.get('Authorization') || '';
                titleRequestHeaders['Cookie'] = request.headers.get('Cookie') || '';
              }

              const titleResponse = await fetch(`${request.headers.get('origin') || 'http://localhost:3000'}/api/generate-title`, {
                method: 'POST',
                headers: titleRequestHeaders,
                body: JSON.stringify(titleRequestBody),
              });
              
              if (titleResponse.ok) {
                const titleData = await titleResponse.json();
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  titleUpdate: true, 
                  title: titleData.title,
                  conversationId: conversation.id 
                })}\n\n`));
              }
            } catch (titleError) {
              console.error('Failed to generate title:', titleError);
              // Don't fail the main request if title generation fails
            }
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, conversationId: conversation.id })}\n\n`));
          controller.close();
        } catch (error) {
          console.error('Error in chat completion:', error);
          
          // Extract meaningful error message
          let errorMessage = 'Failed to generate response';
          if (error instanceof Error) {
            errorMessage = error.message;
          }
          
          // Save error message as assistant response for authenticated users only
          if (!isGuest) {
            try {
              await supabase
                .from('messages')
                .insert({
                  conversation_id: conversation.id,
                  role: 'assistant',
                  content: `❌ **Error**: ${errorMessage}`,
                });
            } catch (dbError) {
              console.error('Failed to save error message:', dbError);
            }
          }
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            error: errorMessage,
            errorContent: `❌ **Error**: ${errorMessage}`
          })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in chat route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}