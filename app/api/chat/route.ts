import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { formSchema } from "@/lib/demo-schema";
import { updateFieldTool } from "@/lib/tools/update-field";

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
    model,
    messages: convertToModelMessages(messages),
    system: getSystemPrompt(),
    tools: {
      updateField: updateFieldTool,
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
    The form schema is: ${JSON.stringify(formSchema)}
  `;
}
