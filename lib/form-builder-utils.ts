import { z } from "zod";
import type {
  FieldType,
  FormDefinition,
  FormFieldDefinition,
  ValidationRules,
} from "./form-definition";

/**
 * Convert a form definition to a Zod schema
 */
export function formDefinitionToZodSchema(
  formDef: FormDefinition
): z.ZodObject<z.ZodRawShape> {
  const shape: z.ZodRawShape = {};

  for (const field of formDef) {
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
          .regex(
            /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
            "Invalid phone number"
          )
          .trim();
        break;
      case "url":
        fieldSchema = z.string().url("Invalid URL").trim();
        break;
      case "checkbox":
        fieldSchema = z.boolean();
        break;
      default:
        fieldSchema = z.string().trim();
    }

    // Apply validation rules
    if (field.validation) {
      fieldSchema = applyValidationRules(fieldSchema, field.validation, field.type);
    }

    // Apply required or optional
    if (field.required) {
      if (field.type === "checkbox") {
        // Checkboxes don't need explicit required message
        shape[field.name] = fieldSchema;
      } else {
        shape[field.name] = fieldSchema.min(1, `${field.label} is required`);
      }
    } else {
      if (field.type === "checkbox") {
        shape[field.name] = fieldSchema.default(false);
      } else {
        shape[field.name] = fieldSchema.optional();
      }
    }
  }

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

  if (rules.min !== undefined && fieldType !== "checkbox") {
    if (fieldType === "text" || fieldType === "email" || fieldType === "phone" || fieldType === "url") {
      // For string types, min/max are typically length validations
      // But if specified as min/max, could be interpreted differently
      // For now, we'll ignore min/max for string types (use minLength/maxLength instead)
    }
  }

  if (rules.max !== undefined && fieldType !== "checkbox") {
    // Same as above
  }

  if (rules.pattern) {
    const message = rules.patternMessage || "Invalid format";
    result = (result as z.ZodString).regex(new RegExp(rules.pattern), message);
  }

  return result;
}

/**
 * Convert a Zod schema to a form definition
 * Useful for editing existing forms
 */
export function zodSchemaToFormDefinition(
  schema: z.ZodObject<z.ZodRawShape>
): FormDefinition {
  const fields: FormFieldDefinition[] = [];
  let idCounter = 0;

  for (const [name, fieldSchema] of Object.entries(schema.shape)) {
    const zodType = fieldSchema as z.ZodTypeAny;
    const typeName = (zodType._def as { typeName?: string })?.typeName;

    let fieldType: FieldType = "text";
    let required = true;
    const validation: ValidationRules = {};

    // Detect type
    if (typeName === "ZodBoolean") {
      fieldType = "checkbox";
    } else if (typeName === "ZodString") {
      const stringSchema = zodType as z.ZodString;
      // Check if it has email validation
      const checks = (stringSchema._def as { checks?: Array<{ kind?: string }> })
        ?.checks;
      if (checks?.some((check) => check.kind === "email")) {
        fieldType = "email";
      } else if (checks?.some((check) => check.kind === "url")) {
        fieldType = "url";
      } else {
        // Check for phone pattern
        const regexCheck = checks?.find((check) => check.kind === "regex");
        if (regexCheck) {
          // Could be phone, but we'll default to text for now
          fieldType = "text";
        } else {
          fieldType = "text";
        }
      }

      // Extract validation rules
      for (const check of checks || []) {
        if (check.kind === "min") {
          validation.minLength = (check as { value?: number })?.value;
        } else if (check.kind === "max") {
          validation.maxLength = (check as { value?: number })?.value;
        }
      }
    }

    // Check if optional
    if (typeName === "ZodOptional" || typeName === "ZodDefault") {
      required = false;
    }

    // Unwrap if needed
    let unwrappedSchema = zodType;
    while (
      unwrappedSchema._def?.typeName === "ZodOptional" ||
      unwrappedSchema._def?.typeName === "ZodDefault"
    ) {
      unwrappedSchema = (unwrappedSchema._def as { innerType?: z.ZodTypeAny })
        ?.innerType as z.ZodTypeAny;
    }

    fields.push({
      id: `field-${idCounter++}`,
      name,
      label: formatFieldLabel(name),
      type: fieldType,
      required,
      validation: Object.keys(validation).length > 0 ? validation : undefined,
    });
  }

  return fields;
}

/**
 * Format a camelCase field name to a readable label
 */
function formatFieldLabel(fieldName: string): string {
  const CAMEL_CASE_REGEX = /([A-Z])/g;
  const FIRST_CHAR_REGEX = /^./;
  return fieldName
    .replace(CAMEL_CASE_REGEX, " $1")
    .replace(FIRST_CHAR_REGEX, (str) => str.toUpperCase())
    .trim();
}

