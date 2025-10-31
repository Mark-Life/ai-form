import { tool } from "ai";
import { z } from "zod";

import type { FormDefinition } from "../utils/form-definition";
import {
  formatFieldLabel,
  getFieldFormatDescription,
  getFieldNames,
  getFieldType,
} from "../utils/schema-utils";

const TIME_FORMAT_REGEX = /^\d{2}:\d{2}$/;

type ProcessResult =
  | { success: true; value: string | number | boolean | string[] }
  | { success: false; fieldName: string; error: string };

function processNumberValue(value: unknown): ProcessResult {
  const numValue = typeof value === "string" ? Number.parseFloat(value) : value;
  if (typeof numValue !== "number" || Number.isNaN(numValue)) {
    return {
      success: false,
      fieldName: "",
      error: "Value must be a valid number",
    };
  }
  return { success: true, value: numValue };
}

function processCheckboxValue(value: unknown): ProcessResult {
  const boolValue = typeof value === "boolean" ? value : Boolean(value);
  return { success: true, value: boolValue };
}

function processMultiSelectValue(value: unknown): ProcessResult {
  if (Array.isArray(value)) {
    return {
      success: true,
      value: value.map((v) => String(v).trim()).filter((v) => v.length > 0),
    };
  }
  if (typeof value === "string") {
    const values = value
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
    return { success: true, value: values };
  }
  return {
    success: false,
    fieldName: "",
    error: "Value must be an array or comma-separated string",
  };
}

function processDateValue(value: unknown): ProcessResult {
  const strValue = typeof value === "string" ? value.trim() : String(value);
  try {
    const date = new Date(strValue);
    if (Number.isNaN(date.getTime())) {
      return {
        success: false,
        fieldName: "",
        error: "Invalid date format. Use YYYY-MM-DD",
      };
    }
    const formatted = date.toISOString().split("T")[0];
    return { success: true, value: formatted };
  } catch {
    return {
      success: false,
      fieldName: "",
      error: "Invalid date format. Use YYYY-MM-DD",
    };
  }
}

function processTimeValue(value: unknown): ProcessResult {
  const strValue = typeof value === "string" ? value.trim() : String(value);
  if (!TIME_FORMAT_REGEX.test(strValue)) {
    return {
      success: false,
      fieldName: "",
      error: "Time must be in HH:MM format (24-hour)",
    };
  }
  return { success: true, value: strValue };
}

function processStringValue(value: unknown): ProcessResult {
  const strValue = typeof value === "string" ? value.trim() : String(value);
  return { success: true, value: strValue };
}

function processFieldValue(
  value: unknown,
  fieldType: ReturnType<typeof getFieldType>
): ProcessResult {
  if (fieldType === "number" || fieldType === "range") {
    return processNumberValue(value);
  }
  if (fieldType === "checkbox") {
    return processCheckboxValue(value);
  }
  if (fieldType === "multiSelect") {
    return processMultiSelectValue(value);
  }
  if (fieldType === "date") {
    return processDateValue(value);
  }
  if (fieldType === "time") {
    return processTimeValue(value);
  }
  return processStringValue(value);
}

export function createUpdateFieldTool<T extends z.ZodObject<z.ZodRawShape>>(
  formSchema: T,
  formDefinition?: FormDefinition | null
) {
  const fieldNames = getFieldNames(formSchema) as string[];

  // Create a map of field name to label
  const fieldLabelMap = new Map<string, string>();
  if (formDefinition) {
    for (const field of formDefinition) {
      fieldLabelMap.set(field.name, field.label);
    }
  }
  // Fallback to formatted label if not in formDefinition
  for (const name of fieldNames) {
    if (!fieldLabelMap.has(name)) {
      fieldLabelMap.set(name, formatFieldLabel(name));
    }
  }

  // Build field-specific format descriptions with labels
  const fieldFormatInfo = fieldNames
    .map((name) => {
      const fieldType = getFieldType(formSchema, name as keyof z.infer<T>);
      const formatDesc = getFieldFormatDescription(fieldType);
      const label = fieldLabelMap.get(name) || formatFieldLabel(name);
      return `- ${name} (${label}): ${formatDesc}`;
    })
    .join("\n");

  return tool({
    description:
      "Update a form field value. Use this to fill in form fields based on user input.",
    inputSchema: z.object({
      fieldName: z
        .enum(fieldNames as [string, ...string[]], {
          message: `Field name must be one of: ${fieldNames.join(", ")}`,
        })
        .describe("The name of the field to update"),
      value: z
        .union([z.string(), z.number(), z.boolean(), z.array(z.string())])
        .describe(
          `The value to set for the field. Format requirements:\n${fieldFormatInfo}`
        ),
    }),
    execute: ({ fieldName, value }) => {
      try {
        // Validate the specific field against the schema
        const fieldSchema = formSchema.shape[
          fieldName as string
        ] as z.ZodTypeAny;
        const fieldType = getFieldType(
          formSchema,
          fieldName as keyof z.infer<T>
        );

        // Process value based on field type
        const processedValue = processFieldValue(value, fieldType);

        if (!processedValue.success) {
          return processedValue;
        }

        // Validate the value
        const result = fieldSchema.safeParse(processedValue.value);

        if (!result.success) {
          const errorMessage =
            result.error.issues[0]?.message || "Validation failed";
          return {
            success: false,
            fieldName,
            error: errorMessage,
          };
        }

        return {
          success: true,
          fieldName,
          value: processedValue.value,
          message: `Successfully updated ${fieldName} to "${processedValue.value}"`,
        };
      } catch (error) {
        return {
          success: false,
          fieldName,
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        };
      }
    },
  });
}
