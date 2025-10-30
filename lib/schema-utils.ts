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
  return (
    (schema as { _def?: { typeName?: string } })._def?.typeName === "ZodNumber"
  );
}

/**
 * Detect if a Zod schema is a string type
 */
function isStringSchema(schema: z.ZodTypeAny): schema is z.ZodString {
  return (
    (schema as { _def?: { typeName?: string } })._def?.typeName === "ZodString"
  );
}

/**
 * Get the type of a field from the schema
 */
export function getFieldType<T extends ZodObjectSchema>(
  schema: T,
  fieldName: keyof z.infer<T>
): "string" | "number" | "unknown" {
  const fieldSchema = schema.shape[fieldName as string] as z.ZodTypeAny;
  if (isNumberSchema(fieldSchema)) {
    return "number";
  }
  if (isStringSchema(fieldSchema)) {
    return "string";
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
      if (fieldType === "number") {
        return [key, 0];
      }
      if (fieldType === "string") {
        return [key, ""];
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
