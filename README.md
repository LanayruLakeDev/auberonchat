# Auberon Chat

*Just another AI chat app, but with some cool tricks*

## What's This?

Built this chat app because why not. Has some neat features that make it stand out from the usual boring chat interfaces.

### Cool Stuff It Does
- **Dual User Support**: Full experience for both guests and authenticated users
- **Guest Mode**: No signup required - just start chatting with full feature access
- Chat with multiple AI models at once (consensus mode is pretty fun)
- Upload images and PDFs - works with models that actually support it (guests and authenticated)
- Pick from 20+ different AI models 
- Saves your chat history (localStorage for guests, cloud for authenticated users)
- Clean, dark interface that doesn't hurt your eyes
- Secure auth with Supabase (optional - guest mode available)

A modern AI chat app with multi-model consensus, file attachments, and a decent interface.

## Tech Stack

Nothing fancy, just solid tools:
- **Next.js 15** with App Router
- **TypeScript** (because sanity)
- **Tailwind CSS 4** for styling
- **Supabase** for auth & database (PostgreSQL)
- **OpenRouter API** for all the AI models
- **Framer Motion** for smooth animations
- **React Markdown** with syntax highlighting
- **Lucide React** for icons

## Setup

### Getting Started

1. **Choose your experience**:
   - **Guest Mode**: Click "Continue as Guest" - no signup, full features, local storage
   - **Authenticated Mode**: Sign up for cloud sync and cross-device access

2. **Add your OpenRouter API key** in the onboarding modal or settings
   - Get one at [openrouter.ai](https://openrouter.ai) (it's free)
   - Your key stays encrypted and secure

3. **Start chatting** - upload files, try consensus mode, explore different models

### Local Setup

```bash
git clone [this-repo]
npm install
# Copy .env.example to .env.local and add your Supabase keys
npm run dev
```

You'll need to set up Supabase with the right tables, but that's pretty standard stuff.

## Features Worth Mentioning

### Consensus Chat
The fun part - ask the same question to multiple AI models and see how they all think differently. Sometimes they agree, sometimes they don't. It's interesting.
- Select multiple AI models simultaneously
- Get responses from all selected models in parallel
- Compare different AI perspectives on the same question
- Perfect for complex problems requiring multiple viewpoints

### Smart File Handling
Upload images or PDFs and it'll only let you use models that actually support them. No more "this model doesn't support files" errors.
- **Image Support:** JPEG, PNG, GIF, WebP (up to 32MB depending on model)
- **PDF Support:** Full document analysis for supported models
- **Smart Validation:** Only allows uploads for models that support the file type
- **Visual Indicators:** Clear capability icons showing what each model supports

### Chat Management
- **Auto-generated Titles:** Conversations get intelligent titles based on content
- **Persistent History:** All conversations saved and synced across devices
- **Resumable Streams:** Continue interrupted conversations seamlessly
- **Search & Organization:** Find past conversations quickly

### The Usual Stuff (But Done Well)
- **Real-time Streaming:** See responses as they're generated
- **Optimistic Updates:** Instant UI feedback for better user experience
- **Keyboard Shortcuts:** Efficient navigation and interaction
- **Loading States:** Clear feedback during all operations
- **Dark Theme:** Eye-friendly interface that doesn't burn your retinas

## AI Models

Supports 20+ models from the usual suspects:

### Google Models
- Gemini 2.0 Flash (001 & Lite)
- Gemini 2.5 Flash Preview
- Gemini 2.5 Pro Preview

### OpenAI Models
- GPT-4o Mini & GPT-4o (2024-11-20)
- GPT-4.1 (Full, Mini, Nano)
- o3-mini
- o4-mini

### Anthropic Models
- Claude Opus 4
- Claude Sonnet 4
- Claude 3.7 Sonnet
- Claude 3.5 Sonnet

### Meta Models
- Llama 3.3 70B Instruct
- Llama 4 Scout & Maverick

### Other Providers
- DeepSeek Chat V3 & R1 (Free)
- X.AI Grok 3 Beta & Mini

Nothing revolutionary, just good coverage of what's available.

## User Modes

### 🎭 Guest Mode
- **No signup required** - start chatting immediately
- **Full feature access** - same AI models, file uploads, consensus mode
- **Local storage** - all data stored in browser (conversations, settings, API keys)
- **Privacy focused** - nothing stored on servers
- **Session persistence** - data survives browser restarts
- **5MB file upload limit** - reasonable for browser storage

### 🔐 Authenticated Mode  
- **Account required** - email signup or OAuth (GitHub, Google)
- **Cloud storage** - conversations synced across devices
- **Higher file limits** - based on model capabilities (up to 20MB+)
- **Profile management** - customize your account
- **Data persistence** - never lose your conversations

**Note**: Both modes have complete feature parity - guests get the full experience without any limitations except storage location.

## Architecture

### Frontend
- Component-based design with React
- Context API for state management
- Custom hooks for reusable logic
- Full TypeScript coverage

### Backend
- API routes for all operations
- Optimized PostgreSQL schema
- JWT-based authentication with Supabase
- File upload and storage system

### Performance
- Lazy loading components
- Next.js image optimization
- Intelligent caching strategies
- Minimal bundle size with tree shaking

## Security & Privacy

- Secure authentication with Supabase
- API keys encrypted and stored securely
- User data properly protected
- HTTPS only, input validation, the works

## License

MIT - do whatever you want with it.
