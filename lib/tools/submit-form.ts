import { tool } from "ai";
import { z } from "zod";

export const submitFormTool = tool({
  description:
    "Submit the form when all required fields are filled and valid. Use this when the user has provided all necessary information and the form is ready to be submitted.",
  inputSchema: z.object({}).describe("No parameters required"),
  execute: () => {
    return {
      success: true,
      message: "Form submission triggered. The form will be validated and submitted.",
    };
  },
});

