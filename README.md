# AI Form Assistant

AI intermediary that fills forms through conversation. Speak or type naturally, AI handles the fields.

## Why

Forms suck. Users skip them, make mistakes, or struggle with validation. This puts AI in the middle—users talk naturally, AI fills everything correctly.

**Use cases:**
- Easy data structurization (dump a resume → AI fills fields → correct what you want)
- Complex multi-step forms
- Mobile users who hate typing
- Voice form filling

## What it does

- **Conversational form filling**: Chat with AI, it fills fields as you answer
- **Voice input**: Browser speech recognition (works offline)
- **Voice output**: Text-to-speech with auto-playback
- **Dynamic forms**: Build forms in UI, no code
- **Smart parsing**: AI extracts info from natural language ("My name is John Doe" → firstName + lastName)
- **Validation**: Real-time per-field validation with retry logic
- **Multi-field updates**: Fill several fields at once

## Demo

### Form Builder
<!-- [Demo: Form Builder UI - drag fields, configure types, validation rules] -->

### AI Conversation
<!-- [Demo: AI dialogue filling form - user speaks/types, AI fills fields in real-time] -->

## What it can do

Currently focuses on form filling. With custom system prompts and tool extensions, you can:

- **Sales nurturing**: Guide users toward purchases, highlight benefits as they fill
- **Onboarding assistance**: Explain options/fields before users choose, answer questions in context
- **Smart defaults**: Suggest values based on previous answers or user context
- **Multi-step workflows**: Chain forms, conditionally show fields, collect data across sessions

Extend by modifying the system prompt in `src/app/api/chat/route.ts` and adding custom tools.

## Field types
- [x] **Text** - Single-line text input
- [x] **Textarea** - Multi-line text input
- [x] **Email** - Email address with validation
- [x] **Phone** - Phone number with pattern validation
- [x] **URL** - Website URL with protocol validation
- [x] **Number** - Numeric input with min/max validation
- [x] **Date** - Date picker
- [x] **Time** - Time picker
- [x] **Checkbox** - Boolean true/false values
- [x] **Single choice** (Select) - Choose one option from a list
- [x] **Multiple choice** (Multi-select) - Choose multiple options from a list
- [x] **Range/Slider** - Numeric range selector
- [ ] **File upload** - File selection and upload

---

## Quick start

```bash
# Clone
git clone <repo-url>
cd ai-form

# Install
bun install

# Setup env (see below)
cp .env.example .env

# Run
bun dev
```

Open http://localhost:3000

## Environment variables

Copy `.env.example` to `.env` and fill:

```
# form filling chat (cheaper, fast)
GOOGLE_GENERATIVE_AI_API_KEY="your-google-api-key"

# text-to-speech
OPENAI_API_KEY="your-openai-api-key"
```

## How it works

1. **Build form**: Use form builder (gear icon) → add fields, set types/validation
2. **Start chat**: Click "Start Conversation"
3. **Talk to AI**: Answer questions naturally (voice or text)
4. **AI fills form**: Fields update automatically as you talk
5. **Submit**: AI validates and submits when complete

Form definition lives in localStorage. Export/import coming soon.

## Note

This is a demo/educational repo. Tool execution (form field updates) happens client-side. In production, data saves would typically happen server-side before passing to the client for security and data integrity.

## Tech

- Next.js 16 (App Router)
- AI SDK
- Google Gemini 2.5 Flash (chat)
- OpenAI TTS-1 (speech)
- React Hook Form + Zod (validation)
- shadcn/ui
- Browser SpeechRecognition API

## License

MIT
