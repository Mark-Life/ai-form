import { z } from "zod";
import type {
  FieldType,
  FormDefinition,
  ValidationRules,
} from "./form-definition";

const PHONE_PATTERN_REGEX =
  /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
const FIRST_CHAR_REGEX = /^./;
/**
 * Convert a form definition to a Zod schema
 */
export function formDefinitionToZodSchema(
  formDef: FormDefinition
): z.ZodObject<z.ZodRawShape> {
  const shape: z.ZodRawShape = Object.fromEntries(
    formDef.map((field) => {
      let fieldSchema: z.ZodTypeAny;

      switch (field.type) {
        case "text":
          fieldSchema = z.string().trim();
          break;
        case "email":
          fieldSchema = z.string().email("Invalid email address").trim();
          break;
        case "phone":
          fieldSchema = z
            .string()
            .regex(PHONE_PATTERN_REGEX, "Invalid phone number")
            .trim();
          break;
        case "url":
          fieldSchema = z
            .string()
            .url("Invalid URL, it should start with http:// or https://")
            .trim();
          break;
        case "checkbox":
          fieldSchema = z.boolean();
          break;
        default:
          fieldSchema = z.string().trim();
      }

      // Apply validation rules
      if (field.validation) {
        fieldSchema = applyValidationRules(
          fieldSchema,
          field.validation,
          field.type
        );
      }

      // Apply required or optional
      let finalSchema: z.ZodTypeAny;
      if (field.required) {
        if (field.type === "checkbox") {
          // Checkboxes don't need explicit required message
          finalSchema = fieldSchema;
        } else {
          finalSchema = (fieldSchema as z.ZodString).min(
            1,
            `${field.label} is required`
          );
        }
      } else if (field.type === "checkbox") {
        finalSchema = fieldSchema.default(false);
      } else {
        finalSchema = fieldSchema.optional();
      }

      return [field.name, finalSchema];
    })
  );

  return z.object(shape);
}

/**
 * Apply validation rules to a Zod schema
 */
function applyValidationRules(
  schema: z.ZodTypeAny,
  rules: ValidationRules,
  fieldType: FieldType
): z.ZodTypeAny {
  let result = schema;

  if (fieldType === "checkbox") {
    // Boolean doesn't support min/max length
    return result;
  }

  if (rules.minLength !== undefined) {
    result = (result as z.ZodString).min(
      rules.minLength,
      `Must be at least ${rules.minLength} characters`
    );
  }

  if (rules.maxLength !== undefined) {
    result = (result as z.ZodString).max(
      rules.maxLength,
      `Must be at most ${rules.maxLength} characters`
    );
  }

  if (rules.pattern) {
    const message = rules.patternMessage || "Invalid format";
    result = (result as z.ZodString).regex(new RegExp(rules.pattern), message);
  }

  return result;
}

/**
 * Detect field type from Zod schema
 */
function detectFieldType(zodType: z.ZodTypeAny): FieldType {
  const typeName = (zodType._def as { typeName?: string }).typeName;

  if (typeName === "ZodBoolean") {
    return "checkbox";
  }

  if (typeName === "ZodString") {
    const stringSchema = zodType as z.ZodString;
    const checks = (stringSchema._def as { checks?: Array<{ kind?: string }> })
      ?.checks;

    if (checks?.some((check) => check.kind === "email")) {
      return "email";
    }
    if (checks?.some((check) => check.kind === "url")) {
      return "url";
    }

    return "text";
  }

  return "text";
}

/**
 * Extract validation rules from Zod string schema
 */
function extractValidationRules(zodType: z.ZodTypeAny): ValidationRules {
  const validation: ValidationRules = {};

  if ((zodType._def as { typeName?: string }).typeName !== "ZodString") {
    return validation;
  }

  const stringSchema = zodType as z.ZodString;
  const checks = (stringSchema._def as { checks?: Array<{ kind?: string }> })
    ?.checks;

  for (const check of checks || []) {
    if (check.kind === "min") {
      validation.minLength = (check as { value?: number })?.value;
    } else if (check.kind === "max") {
      validation.maxLength = (check as { value?: number })?.value;
    }
  }

  return validation;
}

/**
 * Check if Zod schema is optional or has default
 */
function isOptionalOrDefault(zodType: z.ZodTypeAny): boolean {
  const typeName = (zodType._def as { typeName?: string }).typeName;
  return typeName === "ZodOptional" || typeName === "ZodDefault";
}

/**
 * Unwrap optional/default Zod schemas
 */
function unwrapSchema(zodType: z.ZodTypeAny): z.ZodTypeAny {
  let unwrapped = zodType;
  const getTypeName = (type: z.ZodTypeAny) =>
    (type._def as { typeName?: string }).typeName;

  while (
    getTypeName(unwrapped) === "ZodOptional" ||
    getTypeName(unwrapped) === "ZodDefault"
  ) {
    unwrapped = (unwrapped._def as { innerType?: z.ZodTypeAny })
      ?.innerType as z.ZodTypeAny;
  }
  return unwrapped;
}

/**
 * Convert a Zod schema to a form definition
 * Useful for editing existing forms
 */
export function zodSchemaToFormDefinition(
  schema: z.ZodObject<z.ZodRawShape>
): FormDefinition {
  return Object.entries(schema.shape).map(([name, fieldSchema], index) => {
    const zodType = fieldSchema as z.ZodTypeAny;
    const required = !isOptionalOrDefault(zodType);
    const unwrapped = unwrapSchema(zodType);
    const fieldType = detectFieldType(unwrapped);
    const validation = extractValidationRules(unwrapped);

    return {
      id: `field-${index}`,
      name,
      label: formatFieldLabel(name),
      type: fieldType,
      required,
      validation: Object.keys(validation).length > 0 ? validation : undefined,
    };
  });
}

/**
 * Format a camelCase field name to a readable label
 */
function formatFieldLabel(fieldName: string): string {
  const CAMEL_CASE_REGEX = /([A-Z])/g;
  return fieldName
    .replace(CAMEL_CASE_REGEX, " $1")
    .replace(FIRST_CHAR_REGEX, (str) => str.toUpperCase())
    .trim();
}
