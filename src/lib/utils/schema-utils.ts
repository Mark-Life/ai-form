import { z } from "zod";

type ZodObjectSchema = z.ZodObject<z.ZodRawShape>;

const CAMEL_CASE_REGEX = /([A-Z])/g;

/**
 * Extract field names from a Zod object schema
 */
export function getFieldNames<T extends ZodObjectSchema>(
  schema: T
): Array<keyof z.infer<T>> {
  return Object.keys(schema.shape) as Array<keyof z.infer<T>>;
}

/**
 * Detect if a Zod schema is a number type
 */
function isNumberSchema(schema: z.ZodTypeAny): schema is z.ZodNumber {
  return (schema._def as { type?: string })?.type === "number";
}

/**
 * Detect if a Zod schema is a string type
 */
function isStringSchema(schema: z.ZodTypeAny): schema is z.ZodString {
  return (schema._def as { type?: string })?.type === "string";
}

/**
 * Detect if a Zod schema is a boolean type
 */
function isBooleanSchema(schema: z.ZodTypeAny): schema is z.ZodBoolean {
  return (schema._def as { type?: string })?.type === "boolean";
}

/**
 * Detect if a Zod schema is an array type
 */
function isArraySchema(schema: z.ZodTypeAny): schema is z.ZodArray<z.ZodTypeAny> {
  return (schema._def as { type?: string })?.type === "array";
}

const PHONE_PATTERN_REGEX = /phone|tel|\+?\d/;

/**
 * Get detailed type information from a Zod string schema
 */
function getStringFieldSubtype(
  schema: z.ZodString
): "text" | "email" | "phone" | "url" | "date" | "time" | "textarea" | "file" {
  const checks = (schema._def as { checks?: Array<{ kind?: string }> })?.checks;

  if (!checks || checks.length === 0) {
    return "text";
  }

  // Check for email validation
  if (checks.some((check) => check.kind === "email")) {
    return "email";
  }

  // Check for URL validation
  if (checks.some((check) => check.kind === "url")) {
    return "url";
  }

  // Check for date/time patterns
  const regexCheck = checks.find((check) => check.kind === "regex");
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
      if (PHONE_PATTERN_REGEX.test(regexStr)) {
        return "phone";
      }
    }
  }

  return "text";
}

/**
 * Unwrap Zod schema wrappers (Optional, Default) to get the base type
 */
function unwrapSchema(fieldSchema: z.ZodTypeAny): z.ZodTypeAny {
  const MAX_DEPTH = 10;
  let current = fieldSchema;
  let depth = 0;

  while (current?._def && depth < MAX_DEPTH) {
    const defType = (current._def as { type?: string })?.type;

    // Found base type, stop unwrapping
    if (defType === "boolean" || defType === "number" || defType === "string") {
      return current;
    }

    // Unwrap Optional or Default wrappers
    if (defType === "optional" || defType === "default") {
      const innerType = (current._def as { innerType?: z.ZodTypeAny })
        ?.innerType;
      if (innerType) {
        current = innerType;
        depth += 1;
      } else {
        return current;
      }
    } else {
      return current;
    }
  }

  return current;
}

export function getFieldType<T extends ZodObjectSchema>(
  schema: T,
  fieldName: keyof z.infer<T>
):
  | "text"
  | "email"
  | "phone"
  | "url"
  | "number"
  | "checkbox"
  | "select"
  | "multiSelect"
  | "date"
  | "time"
  | "textarea"
  | "file"
  | "range"
  | "unknown" {
  const fieldSchema = schema.shape[fieldName as string] as z.ZodTypeAny;
  const unwrappedSchema = unwrapSchema(fieldSchema);

  // Check types in order of specificity
  if (isBooleanSchema(unwrappedSchema)) {
    return "checkbox";
  }
  if (isNumberSchema(unwrappedSchema)) {
    // Can't distinguish between number and range from schema alone
    // Default to number, UI layer can override based on field definition
    return "number";
  }
  if (isArraySchema(unwrappedSchema)) {
    return "multiSelect";
  }
  if (isStringSchema(unwrappedSchema)) {
    return getStringFieldSubtype(unwrappedSchema);
  }
  return "unknown";
}

/**
 * Detect if a Zod schema has a default value
 */
function hasDefaultValue(
  schema: z.ZodTypeAny
): schema is z.ZodDefault<z.ZodTypeAny> {
  return schema instanceof z.ZodDefault;
}

/**
 * Generate default values for a Zod schema
 * Uses schema-defined defaults if available, otherwise falls back to:
 * - Empty string for string fields
 * - 0 for number fields
 * - undefined for fields without defaults
 */
export function getDefaultValues<T extends ZodObjectSchema>(
  schema: T
): Partial<z.infer<T>> {
  return Object.fromEntries(
    Object.entries(schema.shape).map(([key, value]) => {
      const fieldSchema = value as z.ZodTypeAny;

      // Check if the schema has a default value defined
      if (hasDefaultValue(fieldSchema)) {
        const defaultValue = (
          fieldSchema._def as { defaultValue: () => unknown }
        ).defaultValue();
        return [key, defaultValue];
      }

      // Fall back to type-based defaults
      const fieldType = getFieldType(schema, key as keyof z.infer<T>);
      if (fieldType === "number" || fieldType === "range") {
        return [key, 0];
      }
      if (
        fieldType === "text" ||
        fieldType === "email" ||
        fieldType === "phone" ||
        fieldType === "url" ||
        fieldType === "date" ||
        fieldType === "time" ||
        fieldType === "textarea" ||
        fieldType === "file" ||
        fieldType === "select"
      ) {
        return [key, ""];
      }
      if (fieldType === "checkbox") {
        return [key, false];
      }
      if (fieldType === "multiSelect") {
        return [key, []];
      }

      // Return undefined for unknown types
      return [key, undefined];
    })
  ) as Partial<z.infer<T>>;
}

/**
 * Format a camelCase field name to a readable label
 * e.g., "firstName" -> "First Name"
 */
const FIRST_CHAR_REGEX = /^./;

export function formatFieldLabel(fieldName: string): string {
  return fieldName
    .replace(CAMEL_CASE_REGEX, " $1")
    .replace(FIRST_CHAR_REGEX, (str) => str.toUpperCase())
    .trim();
}
