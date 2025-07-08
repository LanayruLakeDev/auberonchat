import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAIService, OpenRouterService } from '@/lib/openrouter';
import { ChutesService, CHUTES_SYSTEM_MODELS } from '@/lib/chutes';
import { ConsensusResponse } from '@/types/chat';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    // Check for guest user with API key
    const guestApiKey = request.headers.get('X-Guest-API-Key');
    const isGuest = !!guestApiKey;

    // For authenticated users, keep existing validation
    if (!isGuest && (userError || !user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId, message, models, attachments = [], isGuest: bodyIsGuest } = await request.json();

    if ((!message || message.trim() === '') && attachments.length === 0) {
      return NextResponse.json({ error: 'Message or attachments required' }, { status: 400 });
    }

    if (!models || !Array.isArray(models) || models.length === 0) {
      return NextResponse.json({ error: 'At least one model is required' }, { status: 400 });
    }

    // Get API key based on user type
    let userApiKey: string | undefined;
    
    if (isGuest) {
      // For guest users, use the API key from header (if provided)
      userApiKey = guestApiKey || undefined;
    } else {
      // For authenticated users, get API key from profile (if configured)
      const { data: profile } = await supabase
        .from('profiles')
        .select('openrouter_api_key')
        .eq('id', user!.id)
        .single();

      userApiKey = profile?.openrouter_api_key || undefined;
    }

    // Check if all models are supported when no user API key is provided
    if (!userApiKey) {
      const unsupportedModels = models.filter((model: string) => !CHUTES_SYSTEM_MODELS.includes(model));
      if (unsupportedModels.length > 0) {
        return NextResponse.json({ 
          error: `Models ${unsupportedModels.join(', ')} require an OpenRouter API key. Please add your OpenRouter API key in settings, or choose different models.` 
        }, { status: 400 });
      }
    }

    let conversation = null;
    let messages = [];

    if (isGuest) {
      // For guest users, we don't store conversations/messages in DB
      // The client will handle conversation/message storage via localStorage
      conversation = {
        id: conversationId || `guest-consensus-${Date.now()}`,
        title: 'Guest Consensus Chat',
        model: `consensus:${models.join(',')}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Guest messages are handled client-side
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
            model: `consensus:${models.join(',')}`,
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

    // Build conversation history with proper attachment formatting
    const formattedMessages = await Promise.all(
      messages.map(async (msg: any) => ({
        role: msg.role,
        content: await formatMessageContent(msg)
      }))
    );

    const conversationHistory = formattedMessages;

    // Add current user message with proper content format
    const currentMessageContent = contentParts.length > 1 || (contentParts.length === 1 && contentParts[0].type !== 'text') 
      ? contentParts 
      : contentParts[0]?.text || message || '';

    conversationHistory.push({
      role: 'user',
      content: currentMessageContent,
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          const consensusResponses: ConsensusResponse[] = models.map((model: string) => ({
            model,
            content: '',
            isLoading: true,
            responseTime: 0,
          }));

          // Send initial state
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'consensus_start',
            models: models,
            responses: consensusResponses
          })}\n\n`));

          // Create promises for all model requests
          const modelPromises = models.map(async (model: string, index: number) => {
            const startTime = Date.now();
            try {
              let fullResponse = '';
              const aiService = createAIService(userApiKey);

              const onChunk = (chunk: string) => {
                fullResponse += chunk;
                consensusResponses[index] = {
                  ...consensusResponses[index],
                  content: fullResponse,
                  isStreaming: true,
                  isLoading: false,
                };
                
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  type: 'consensus_update',
                  modelIndex: index,
                  model: model,
                  content: fullResponse,
                  isStreaming: true
                })}\n\n`));
              };

              if (aiService instanceof OpenRouterService) {
                await aiService.createChatCompletion(
                  model,
                  conversationHistory,
                  onChunk,
                  request.headers.get('referer') || undefined
                );
              } else if (aiService instanceof ChutesService) {
                await aiService.createChatCompletion({
                  model,
                  messages: conversationHistory,
                  onChunk,
                });
              }

              const responseTime = Date.now() - startTime;
              consensusResponses[index] = {
                ...consensusResponses[index],
                content: fullResponse,
                isStreaming: false,
                isLoading: false,
                responseTime,
              };

              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'consensus_complete',
                modelIndex: index,
                model: model,
                content: fullResponse,
                responseTime
              })}\n\n`));

            } catch (error) {
              const responseTime = Date.now() - startTime;
              consensusResponses[index] = {
                ...consensusResponses[index],
                error: error instanceof Error ? error.message : 'Unknown error',
                isLoading: false,
                isStreaming: false,
                responseTime,
              };

              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'consensus_error',
                modelIndex: index,
                model: model,
                error: error instanceof Error ? error.message : 'Unknown error',
                responseTime
              })}\n\n`));
            }
          });

          // Track completion and send final event as soon as all models are done
          let completedCount = 0;
          const totalModels = models.length;
          let finalEventSent = false;
          
          const checkCompletion = () => {
            completedCount++;
            if (completedCount === totalModels && !finalEventSent) {
              finalEventSent = true;
              sendFinalEvent();
            }
          };

          const sendFinalEvent = async () => {
            // Save the consensus message to database (authenticated users only)
            let assistantMessage = null;
            if (!isGuest) {
              const consensusContent = JSON.stringify(consensusResponses);
              
              const { data: savedMessage } = await supabase
                .from('messages')
                .insert({
                  conversation_id: conversation.id,
                  role: 'assistant',
                  content: consensusContent,
                })
                .select()
                .single();
                
              assistantMessage = savedMessage;
            }

            // Generate title for new conversations after first response
            if (messages.length === 0) {
              try {
                // Use the best response for title generation (first successful one)
                const bestResponse = consensusResponses.find(r => r.content && !r.error)?.content || '';
                
                const titleRequestHeaders: Record<string, string> = {
                  'Content-Type': 'application/json',
                };
                
                const titleRequestBody: any = {
                  userMessage: message,
                  assistantResponse: bestResponse,
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
                    type: 'title_update',
                    title: titleData.title,
                    conversationId: conversation.id
                  })}\n\n`));
                }
              } catch (titleError) {
                console.error('Failed to generate title:', titleError);
                // Don't fail the main request if title generation fails
              }
            }

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'consensus_final',
              messageId: assistantMessage?.id,
              responses: consensusResponses
            })}\n\n`));

            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          };

          // Start all model requests and handle completion tracking
          modelPromises.forEach(async (promise, index) => {
            try {
              await promise;
            } catch (error) {
              // Error is already handled in the promise itself
            } finally {
              checkCompletion();
            }
          });

          // Add a timeout to ensure we don't hang indefinitely
          // After 3 minutes, force completion with whatever responses we have
          setTimeout(() => {
            if (!finalEventSent) {
              console.warn('Consensus timeout reached, forcing completion');
              
              // Mark any still-loading responses as timed out
              consensusResponses.forEach((response, index) => {
                if (response.isLoading) {
                  consensusResponses[index] = {
                    ...response,
                    error: 'Response timeout (3 minutes)',
                    isLoading: false,
                    isStreaming: false,
                    responseTime: 180000,
                  };
                }
              });
              
              finalEventSent = true;
              sendFinalEvent();
            }
          }, 180000); // 3 minute timeout

          // Send a "taking longer than expected" notification after 30 seconds
          setTimeout(() => {
            if (!finalEventSent) {
              // Check if any models are still loading
              const stillLoading = consensusResponses.some(r => r.isLoading);
              if (stillLoading) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  type: 'consensus_taking_long',
                  message: 'Some models are taking longer than expected. This is normal for thinking models. Please wait...'
                })}\n\n`));
              }
            }
          }, 30000); // 30 second notification



        } catch (error) {
          console.error('Consensus error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
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
    console.error('Error in consensus endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}