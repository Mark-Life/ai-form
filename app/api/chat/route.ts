import { google } from "@ai-sdk/google";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import type { z } from "zod";
import { formSchema as demoFormSchema } from "@/lib/demo-schema";
import { createTools } from "@/lib/tools";
import type { FormDefinition } from "@/lib/utils";
import { formDefinitionToZodSchema } from "@/lib/utils";

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

const MAX_TOOL_STEPS = 5;

export async function POST(req: Request) {
  const {
    messages,
    formDefinition,
  }: {
    messages: UIMessage[];
    formDefinition?: FormDefinition | null;
  } = await req.json();

  // Use provided form definition or fallback to demo schema
  const formSchema: z.ZodObject<z.ZodRawShape> = formDefinition
    ? formDefinitionToZodSchema(formDefinition)
    : demoFormSchema;

  const tools = createTools(formSchema);

  const result = streamText({
    model: google("gemini-2.5-flash"),
    messages: convertToModelMessages(messages),
    system: getSystemPrompt(formSchema),
    tools,
    stopWhen: stepCountIs(MAX_TOOL_STEPS),
  });

  // send sources and reasoning back to the client
  return result.toUIMessageStreamResponse({
    sendReasoning: true,
  });
}

function unwrapZodType(zodType: z.ZodTypeAny): z.ZodTypeAny {
  let current = zodType;
  let depth = 0;
  const MAX_DEPTH = 10;

  while (current._def && depth < MAX_DEPTH) {
    const defType = (current._def as { type?: string })?.type;
    if (defType === "optional" || defType === "default") {
      const innerType = (current._def as { innerType?: z.ZodTypeAny })
        ?.innerType;
      if (innerType) {
        current = innerType;
        depth += 1;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  return current;
}

function getFieldTypeDescription(zodType: z.ZodTypeAny): string {
  const unwrapped = unwrapZodType(zodType);
  const defType = (unwrapped._def as { type?: string })?.type;

  if (defType === "string") {
    const checks = (unwrapped._def as { checks?: Array<{ kind?: string }> })
      ?.checks;
    if (checks?.some((c) => c.kind === "email")) {
      return "email";
    }
    if (checks?.some((c) => c.kind === "url")) {
      return "url";
    }
    return "text";
  }

  if (defType === "number") {
    return "number";
  }

  if (defType === "boolean") {
    return "boolean";
  }

  return "unknown";
}

function getSystemPrompt(formSchema: z.ZodObject<z.ZodRawShape>): string {
  const schemaShape = formSchema.shape;
  const fieldDescriptions = Object.entries(schemaShape).map(([key, schema]) => {
    const zodType = schema as z.ZodTypeAny;
    const typeDesc = getFieldTypeDescription(zodType);
    return `- ${key}: ${typeDesc}`;
  });

  return `
    You are a helpful assistant that can help users fill out forms. Ask user questions about the form and when the user provides information, use the updateField tool to fill in individual form fields, or use the fillMany tool to update multiple fields at once. Always validate the input before updating fields.
    When all required fields are filled and the form is complete, use the submitForm tool to submit the form.
    
    The form has the following fields:
    ${fieldDescriptions.join("\n")}

    Note, url should start with https://, but user often provide a domain name without the protocol.

    Be conversational and friendly. Instead of saying "fill in the form", ask a user as you are talking to them and fill it yourself. Don't include some of obvious validation rules like min and max 50 characters.

    User can give you anwsers out of the order of the fields, you can call the updateField tool to fill in the fields as soon as you get the information.
    
    When a user provides multiple pieces of information at once (e.g., "My name is John Doe" for firstName and lastName, or providing address components together), use the fillMany tool to update multiple fields simultaneously. The fillMany tool returns per-field validation errors, so you can retry failed fields individually if needed.

    DO NOT ask other questions that are not related to the form.
  `;
}
