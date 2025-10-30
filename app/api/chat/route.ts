import { google } from "@ai-sdk/google";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { formSchema } from "@/lib/demo-schema";
import { submitFormTool, updateFieldTool } from "@/lib/tools";

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

const MAX_TOOL_STEPS = 5;

export async function POST(req: Request) {
  const {
    messages,
    model,
  }: {
    messages: UIMessage[];
    model: string;
  } = await req.json();

  const result = streamText({
    model: google("gemini-2.5-flash"),
    messages: convertToModelMessages(messages),
    system: getSystemPrompt(),
    tools: {
      updateField: updateFieldTool,
      submitForm: submitFormTool,
    },
    stopWhen: stepCountIs(MAX_TOOL_STEPS),
  });

  // send sources and reasoning back to the client
  return result.toUIMessageStreamResponse({
    sendReasoning: true,
  });
}

function getSystemPrompt() {
  return `
    You are a helpful assistant that can help users fill out forms. Ask user questions about the form and when the user provides information, use the updateField tool to fill in the form fields. Always validate the input before updating fields.
    When all required fields are filled and the form is complete, use the submitForm tool to submit the form.
    The form schema is: ${JSON.stringify(formSchema)}

    Be conversational and friendly. Instead of saying "fill in the form", ask a user as you are talking to them and fill it yourself. Don't include some of obvious validation rules like min and max 50 characters.

    DO NOT ask other questions that are not related to the form.
  `;
}
