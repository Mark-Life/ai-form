import { tool } from "ai";
import { z } from "zod";
import { formSchema } from "../demo-schema";
import { getFieldNames, getFieldType } from "../schema-utils";

const fieldNames = getFieldNames(formSchema) as string[];

export const updateFieldTool = tool({
  description:
    "Update a form field value. Use this to fill in form fields based on user input.",
  inputSchema: z.object({
    fieldName: z
      .enum(fieldNames as [string, ...string[]], {
        message: `Field name must be one of: ${fieldNames.join(", ")}`,
      })
      .describe("The name of the field to update"),
    value: z
      .union([z.string(), z.number()])
      .describe("The value to set for the field (string or number)"),
  }),
  execute: ({ fieldName, value }) => {
    try {
      // Validate the specific field against the schema
      const fieldSchema =
        formSchema.shape[fieldName as keyof typeof formSchema.shape];
      const fieldType = getFieldType(
        formSchema,
        fieldName as keyof z.infer<typeof formSchema>
      );

      // Process value based on field type
      let processedValue: string | number;
      if (fieldType === "number") {
        // Convert string to number if needed, or use number directly
        processedValue =
          typeof value === "string" ? Number.parseFloat(value) : value;
        if (Number.isNaN(processedValue)) {
          return {
            success: false,
            fieldName,
            error: "Value must be a valid number",
          };
        }
      } else {
        // For string fields, trim the value
        processedValue =
          typeof value === "string" ? value.trim() : String(value);
      }

      // Validate the value
      const result = fieldSchema.safeParse(processedValue);

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
        value: processedValue,
        message: `Successfully updated ${fieldName} to "${processedValue}"`,
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
