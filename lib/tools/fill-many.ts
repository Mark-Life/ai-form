import { tool } from "ai";
import { z } from "zod";

import { getFieldNames, getFieldType } from "../schema-utils";

function processFieldValue(
  value: unknown,
  fieldType: ReturnType<typeof getFieldType>
):
  | { success: true; value: string | number | boolean }
  | { success: false; error: string } {
  if (fieldType === "number") {
    const numValue =
      typeof value === "string" ? Number.parseFloat(value) : value;
    if (typeof numValue !== "number" || Number.isNaN(numValue)) {
      return {
        success: false,
        error: "Value must be a valid number",
      };
    }
    return { success: true, value: numValue };
  }

  if (fieldType === "checkbox") {
    const boolValue = typeof value === "boolean" ? value : Boolean(value);
    return { success: true, value: boolValue };
  }

  // For string fields, trim the value
  const strValue = typeof value === "string" ? value.trim() : String(value);
  return { success: true, value: strValue };
}

function processSingleField<T extends z.ZodObject<z.ZodRawShape>>(
  fieldName: string,
  value: unknown,
  formSchema: T,
  fieldNames: string[]
):
  | { success: true; value: string | number | boolean }
  | { success: false; error: string } {
  // Validate field name exists in schema
  if (!fieldNames.includes(fieldName)) {
    return {
      success: false,
      error: `Field "${fieldName}" does not exist in the form schema`,
    };
  }

  try {
    // Get field schema and type
    const fieldSchema = formSchema.shape[fieldName as string] as z.ZodTypeAny;
    const fieldType = getFieldType(formSchema, fieldName as keyof z.infer<T>);

    // Process value based on field type
    const processedValue = processFieldValue(value, fieldType);

    if (!processedValue.success) {
      return processedValue;
    }

    // Validate the value against schema
    const validationResult = fieldSchema.safeParse(processedValue.value);

    if (!validationResult.success) {
      const errorMessage =
        validationResult.error.issues[0]?.message || "Validation failed";
      return {
        success: false,
        error: errorMessage,
      };
    }

    // Success
    return {
      success: true,
      value: processedValue.value,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

function processFields<T extends z.ZodObject<z.ZodRawShape>>(
  fields: Record<string, string | number | boolean>,
  formSchema: T,
  fieldNames: string[]
): Record<
  string,
  | { success: true; value: string | number | boolean }
  | { success: false; error: string }
> {
  const results: Record<
    string,
    | { success: true; value: string | number | boolean }
    | { success: false; error: string }
  > = {};

  for (const [fieldName, value] of Object.entries(fields)) {
    results[fieldName] = processSingleField(
      fieldName,
      value,
      formSchema,
      fieldNames
    );
  }

  return results;
}

function buildSummaryMessage(
  results: Record<
    string,
    | { success: true; value: string | number | boolean }
    | { success: false; error: string }
  >
): { success: boolean; message: string } {
  const successfulFields = Object.entries(results)
    .filter(([, result]) => result.success)
    .map(([name]) => name);
  const failedFields = Object.entries(results)
    .filter(([, result]) => !result.success)
    .map(([name, result]) => ({
      name,
      error: result.success === false ? result.error : "",
    }));

  let message = "";
  if (successfulFields.length > 0) {
    message += `Successfully updated: ${successfulFields.join(", ")}. `;
  }
  if (failedFields.length > 0) {
    message += `Failed: ${failedFields.map((f) => `${f.name} (${f.error})`).join(", ")}.`;
  }

  return {
    success: successfulFields.length > 0,
    message,
  };
}

export function createFillManyTool<T extends z.ZodObject<z.ZodRawShape>>(
  formSchema: T
) {
  const fieldNames = getFieldNames(formSchema) as string[];

  return tool({
    description:
      "Update multiple form fields at once. Use this when the user provides multiple pieces of information simultaneously (e.g., full name for firstName and lastName, or address components). Returns per-field validation errors if any fields fail.",
    inputSchema: z.object({
      fields: z
        .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
        .describe(
          "Object mapping field names to values. Example: { firstName: 'John', lastName: 'Doe' }"
        ),
    }),
    execute: ({ fields }) => {
      const results = processFields(fields, formSchema, fieldNames);
      const { success, message } = buildSummaryMessage(results);

      return {
        success,
        results,
        message: message.trim() || "No fields were processed",
      };
    },
  });
}
