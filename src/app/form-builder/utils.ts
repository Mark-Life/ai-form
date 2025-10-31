import type { FormFieldDefinition } from "@/lib/utils";

export const CAMEL_CASE_REGEX = /^[a-z][a-zA-Z0-9]*$/;
export const RANDOM_SUBSTRING_START = 2;
export const RANDOM_SUBSTRING_LENGTH = 9;
export const RADIX_BASE = 36;
export const OPTIONS_PLACEHOLDER = "Option 1\nOption 2\nOption 3";

export function generateFieldId(): string {
  return `field-${Date.now()}-${Math.random().toString(RADIX_BASE).substring(RANDOM_SUBSTRING_START, RANDOM_SUBSTRING_LENGTH)}`;
}

export function validateCamelCase(name: string): boolean {
  return CAMEL_CASE_REGEX.test(name);
}

export const DEFAULT_FIELD: Omit<FormFieldDefinition, "id"> = {
  name: "",
  label: "",
  type: "text",
  required: true,
};
