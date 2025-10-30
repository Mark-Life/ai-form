import { tool } from "ai";
import { z } from "zod";
import { formSchema } from "../demo-schema";

export const updateFieldTool = tool({
  description:
    "Update a form field value. Use this to fill in form fields based on user input.",
  inputSchema: z.object({
    fieldName: z
      .enum(["firstName", "lastName"], {
        message: "Field name must be either 'firstName' or 'lastName'",
      })
      .describe("The name of the field to update"),
    value: z.string().describe("The value to set for the field"),
  }),
  execute: ({ fieldName, value }) => {
    try {
      // Validate the specific field against the schema
      const fieldSchema = formSchema.shape[fieldName];
      const trimmedValue = value.trim();

      // Validate the value
      const result = fieldSchema.safeParse(trimmedValue);

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
        value: trimmedValue,
        message: `Successfully updated ${fieldName} to "${trimmedValue}"`,
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
