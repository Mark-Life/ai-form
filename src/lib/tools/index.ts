import type { z } from "zod";
import type { FormDefinition } from "../utils/form-definition";
import { createFillManyTool } from "./fill-many";
import { submitFormTool } from "./submit-form";
import { createUpdateFieldTool } from "./update-field";

export function createTools<T extends z.ZodObject<z.ZodRawShape>>(
  formSchema: T,
  formDefinition?: FormDefinition | null
) {
  return {
    submitForm: submitFormTool,
    updateField: createUpdateFieldTool(formSchema, formDefinition),
    fillMany: createFillManyTool(formSchema, formDefinition),
  };
}
