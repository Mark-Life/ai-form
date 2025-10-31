import { tool } from "ai";
import { z } from "zod";

import { getFieldNames, getFieldType } from "../utils/schema-utils";

const TIME_FORMAT_REGEX = /^\d{2}:\d{2}$/;

function processFieldValue(
  value: unknown,
  fieldType: ReturnType<typeof getFieldType>
):
  | { success: true; value: string | number | boolean | string[] }
  | { success: false; fieldName: string; error: string } {
  if (fieldType === "number" || fieldType === "range") {
    const numValue =
      typeof value === "string" ? Number.parseFloat(value) : value;
    if (typeof numValue !== "number" || Number.isNaN(numValue)) {
      return {
        success: false,
        fieldName: "",
        error: "Value must be a valid number",
      };
    }
    return { success: true, value: numValue };
  }

  if (fieldType === "checkbox") {
    const boolValue = typeof value === "boolean" ? value : Boolean(value);
    return { success: true, value: boolValue };
  }

  if (fieldType === "multiSelect") {
    if (Array.isArray(value)) {
      return {
        success: true,
        value: value.map((v) => String(v).trim()).filter((v) => v.length > 0),
      };
    }
    if (typeof value === "string") {
      // Parse comma-separated values
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

  if (fieldType === "date") {
    const strValue = typeof value === "string" ? value.trim() : String(value);
    // Try to parse and format as YYYY-MM-DD
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

  if (fieldType === "time") {
    const strValue = typeof value === "string" ? value.trim() : String(value);
    // Validate HH:MM format
    if (!TIME_FORMAT_REGEX.test(strValue)) {
      return {
        success: false,
        fieldName: "",
        error: "Time must be in HH:MM format (24-hour)",
      };
    }
    return { success: true, value: strValue };
  }

  // For string fields, trim the value
  const strValue = typeof value === "string" ? value.trim() : String(value);
  return { success: true, value: strValue };
}

export function createUpdateFieldTool<T extends z.ZodObject<z.ZodRawShape>>(
  formSchema: T
) {
  const fieldNames = getFieldNames(formSchema) as string[];

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
        .union([z.string(), z.number(), z.boolean()])
        .describe(
          "The value to set for the field (string, number, or boolean)"
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
