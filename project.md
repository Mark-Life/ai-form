# AI Conversational Form System

## Architecture Overview

Split-view interface with form preview (left) and AI chat (right). AI agent uses tool calls to fill form fields via Zod-validated schemas. Both UI button and AI tool can trigger submission.

## Implementation Plan

### 1. Core Infrastructure

**API Route** (`app/api/chat/route.ts`)

- Create Next.js API route using Vercel AI SDK
- Use `generateText` with `model: 'openai/gpt-5'` via Vercel AI Gateway
- Handle tool calls for field updates and form submission
- Stream responses using AI SDK streaming utilities

**Form Schema System** (`lib/form-schema.ts`)

- Define base types for form schemas using Zod
- Create form field types (text, email, number, select, etc.)
- Build schema parser that converts Zod schema to form field definitions
- Generate validation functions from Zod schemas

**Form State Management** (`lib/form-state.ts`)

- Create React context/hooks for form state
- Track form field values and validation status
- Provide functions to update fields (called by tool handlers)
- Manage form completion status

### 2. Tool System

**Field Update Tool** (`lib/tools/update-field.ts`)

- Tool definition for updating form fields
- Accepts field name and value
- Validates against Zod schema before updating
- Returns success/error status to AI

**Submit Tool** (`lib/tools/submit-form.ts`)

- Tool definition for form submission
- Validates all required fields before submission
- Triggers form completion state
- Returns submission status

**Tool Registry** (`lib/tools/index.ts`)

- Central registry of available tools
- Provides tool execution handlers
- Maps tool calls to state updates

### 3. UI Components

**Main Form Chat Component** (`components/form-chat.tsx`)

- Split-view layout (form left, chat right)
- Integrates Conversation, Message, PromptInput from ai-elements
- Connects chat to form state updates
- Handles tool call execution and streaming

**Form Preview Component** (`components/form-preview.tsx`)

- Renders form fields based on schema
- Auto-updates as fields are filled via tool calls
- Shows validation errors inline
- Submit button that triggers submission (disabled until valid)

**Form Result Component** (`components/form-result.tsx`)

- Displays completed form data
- Shows reset button to start over
- Nice layout for reviewing submitted data

**Field Components** (`components/form-fields/`)

- Individual field components (TextInput, Select, etc.)
- Connected to form state
- Display validation errors
- Read-only when filled via AI

### 4. Demo Setup

**Demo Page** (`app/page.tsx`)

- Replace boilerplate with demo form chat
- Example Zod schema (onboarding form: name, email, role, etc.)
- Initialize form chat component with schema

**Demo Schema** (`lib/demo-schema.ts`)

- Example Zod schema for onboarding form
- Multiple field types to showcase capabilities

## File Structure

```
app/
  api/
    chat/
      route.ts           # AI chat API endpoint
  page.tsx               # Demo page
lib/
  form-schema.ts         # Schema types and parsers
  form-state.ts          # Form state management
  tools/
    index.ts             # Tool registry
    update-field.ts      # Field update tool
    submit-form.ts       # Submit tool
  demo-schema.ts         # Demo form schema
components/
  form-chat.tsx          # Main split-view component
  form-preview.tsx       # Form preview (left side)
  form-result.tsx        # Result display
  form-fields/
    text-field.tsx       # Text input field
    select-field.tsx     # Select dropdown field
    # ... other field types
```

## Key Implementation Details

- Use `useChat` or `useChatCore` from AI SDK for chat state
- Tools use `executeTool` pattern from AI SDK v5
- Form state updates trigger re-renders via React context
- Validation happens in tool handlers before state updates
- Submit button enabled when all required fields pass validation
- Form result shown on successful submission (via tool or button)