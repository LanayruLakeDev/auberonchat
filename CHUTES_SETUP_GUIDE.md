# Chutes AI Setup Guide

## Overview

The Chutes AI system provides free access to various AI models as a fallback when users don't have their own OpenRouter API key. This allows users to start chatting immediately after creating an account.

## Supported Models

The following models are supported by the Chutes AI system:

### Meta LLaMA Models
- `meta-llama/llama-3.3-70b-instruct` → `llama-3.3-70b-instruct`
- `meta-llama/llama-4-scout` → `llama-4-scout`
- `meta-llama/llama-4-maverick` → `llama-4-maverick` ⭐ **This is Llama 4 Maverick**

### Google Gemini Models
- `google/gemini-2.0-flash-001` → `gemini-2.0-flash`
- `google/gemini-2.0-flash-lite-001` → `gemini-2.0-flash-lite`
- `google/gemini-2.5-flash-preview-05-20` → `gemini-2.5-flash-preview`
- `google/gemini-2.5-pro-preview` → `gemini-2.5-pro-preview`

### DeepSeek Models
- `deepseek/deepseek-chat-v3-0324:free` → `deepseek-chat-v3`
- `deepseek/deepseek-r1-0528:free` → `deepseek-r1`

### X.AI Grok Models
- `x-ai/grok-3-beta` → `grok-3-beta`
- `x-ai/grok-3-mini-beta` → `grok-3-mini-beta`

### Mistral Models
- `mistralai/mistral-large-2412` → `mistral-large-2412`
- `mistralai/mistral-small-2412` → `Mistral-Small-3.1-24B-Instruct-2503`
- `mistralai/pixtral-large-2412` → `pixtral-large-2412`
- `mistralai/mistral-7b-instruct` → `mistral-7b-instruct`

## Environment Configuration

To enable the Chutes AI system, you need to set the following environment variable:

```bash
CHUTES_KEY=your_actual_chutes_ai_api_key_here
```

**Important:** 
- Do NOT use the placeholder value `your_chutes_ai_api_key_here`
- The system will detect placeholder values and show an error
- Contact your Chutes AI provider to get a valid API key

## Error Messages

### Common Errors and Solutions

1. **"Chutes AI service is not configured"**
   - Solution: Set a valid `CHUTES_KEY` environment variable

2. **"Model [model] requires an OpenRouter API key"**
   - Solution: Either set up the Chutes system or ask users to add their OpenRouter API key

3. **"Model [model] is not available on Chutes AI"**
   - Solution: The requested model is not supported by Chutes. Use a supported model from the list above.

4. **"Chutes AI service authentication failed"**
   - Solution: Check that your `CHUTES_KEY` is valid and active

## How It Works

1. **User without API key**: System automatically uses Chutes AI for supported models
2. **User with API key**: System uses OpenRouter with their personal key
3. **Model compatibility**: System checks if the requested model is supported by Chutes
4. **Automatic fallback**: If Chutes is not configured, users are prompted to add their own API key

## Testing

To test if the Chutes system is working:

1. Create a new account (or use guest mode)
2. Don't add an OpenRouter API key in settings
3. Try chatting with `meta-llama/llama-4-maverick`
4. The system should automatically use Chutes AI

## Troubleshooting

If you're getting "Failed to create completion" errors:

1. Check that `CHUTES_KEY` is set and valid
2. Verify the model name is correctly mapped
3. Check the console logs for detailed error messages
4. Ensure the Chutes AI service is accessible from your deployment environment
