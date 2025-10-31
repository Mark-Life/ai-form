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
import {
  formatFieldLabel,
  formDefinitionToZodSchema,
  zodSchemaToFormDefinition,
} from "@/lib/utils";

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

const MAX_TOOL_STEPS = 4;

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

  // Generate form definition from demo schema if not provided
  const effectiveFormDefinition =
    formDefinition || zodSchemaToFormDefinition(demoFormSchema);

  const tools = createTools(formSchema, effectiveFormDefinition);

  const result = streamText({
    model: google("gemini-2.5-flash"),
    messages: convertToModelMessages(messages),
    system: getSystemPrompt(formSchema, effectiveFormDefinition),
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

function detectStringSubtype(checks?: Array<{ kind?: string }>): string {
  if (!checks || checks.length === 0) {
    return "text";
  }

  if (checks.some((c) => c.kind === "email")) {
    return "email";
  }
  if (checks.some((c) => c.kind === "url")) {
    return "url";
  }

  const regexCheck = checks.find((c) => c.kind === "regex");
  if (regexCheck) {
    const regexValue = (regexCheck as { regex?: RegExp })?.regex;
    if (regexValue) {
      const regexStr = regexValue.toString();
      if (regexStr.includes("\\d{4}-\\d{2}-\\d{2}")) {
        return "date";
      }
      if (regexStr.includes("\\d{2}:\\d{2}")) {
        return "time";
      }
    }
  }

  return "text";
}

function getFieldTypeDescription(zodType: z.ZodTypeAny): string {
  const unwrapped = unwrapZodType(zodType);
  const defType = (unwrapped._def as { type?: string })?.type;

  if (defType === "array") {
    return "multiSelect";
  }

  if (defType === "string") {
    const checks = (unwrapped._def as { checks?: Array<{ kind?: string }> })
      ?.checks;
    return detectStringSubtype(checks);
  }

  if (defType === "number") {
    return "number";
  }

  if (defType === "boolean") {
    return "boolean";
  }

  return "unknown";
}

function getSystemPrompt(
  formSchema: z.ZodObject<z.ZodRawShape>,
  formDefinition: FormDefinition
): string {
  const schemaShape = formSchema.shape;
  const fieldLabelMap = new Map<string, string>();
  const fieldTypeMap = new Map<string, string>();
  for (const field of formDefinition) {
    fieldLabelMap.set(field.name, field.label);
    fieldTypeMap.set(field.name, field.type);
  }

  const fieldDescriptions = Object.entries(schemaShape).map(([key, schema]) => {
    const zodType = schema as z.ZodTypeAny;
    // Prefer type from formDefinition, fallback to inferring from schema
    const typeDesc = fieldTypeMap.get(key) || getFieldTypeDescription(zodType);
    const label = fieldLabelMap.get(key) || formatFieldLabel(key);
    return `- ${key} (${label}): ${typeDesc}`;
  });

  return `
    You are a helpful assistant that can help users fill out forms. Ask user questions about the form and when the user provides information, use the updateField tool to fill in individual form fields, or use the fillMany tool to update multiple fields at once. Always validate the input before updating fields.
    When all required fields are filled and the form is complete, use the submitForm tool to submit the form.
    
    The form has the following fields:
    ${fieldDescriptions.join("\n")}

    Note, url should include a protocol, but user often provide a domain name without a protocol, so its your job to add it to the field.

    Be conversational and friendly. Instead of saying "fill in the form", ask a user as you are talking to them and fill it yourself. Don't include some of obvious validation rules like min and max 50 characters.

    User can give you anwsers out of the order of the fields, you can call the updateField tool to fill in the fields as soon as you get the information.
    
    When a user provides multiple pieces of information at once (e.g., "My name is John Doe" for firstName and lastName, or providing address components together), use the fillMany tool to update multiple fields simultaneously. The fillMany tool returns per-field validation errors, so you can retry failed fields individually if needed.

    User can provide some of the data in different format, its your job to adapt the data to the form fields. If some field update returns a formatting error, you can try to call the tool with another argument format, before clarifying with the user.

    Date format: YYYY-MM-DD
    Time format: HH:MM (24-hour)

    DO NOT ask other questions that are not related to the form.
  `;
}
