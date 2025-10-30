import type { z } from "zod";
import { submitFormTool } from "./submit-form";
import { createUpdateFieldTool } from "./update-field";

export function createTools<T extends z.ZodObject<z.ZodRawShape>>(
  formSchema: T
) {
  return {
    submitForm: submitFormTool,
    updateField: createUpdateFieldTool(formSchema),
  };
}
