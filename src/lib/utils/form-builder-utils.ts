import { z } from "zod";
import type {
  FieldType,
  FormDefinition,
  ValidationRules,
} from "./form-definition";
import { formatFieldLabel } from "./schema-utils";

const PHONE_PATTERN_REGEX =
  /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
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
          fieldSchema = z.string().url("Invalid URL, include protocol").trim();
          break;
        case "checkbox":
          fieldSchema = z.boolean();
          break;
        case "select":
          fieldSchema = z.string().trim();
          if (field.options && field.options.length > 0) {
            fieldSchema = fieldSchema.refine(
              (val) => field.options?.includes(val as string) ?? false,
              {
                message: `Must be one of: ${field.options.join(", ")}`,
              }
            );
          }
          break;
        case "multiSelect":
          fieldSchema = z.array(z.string());
          if (field.options && field.options.length > 0) {
            fieldSchema = fieldSchema.refine(
              (val) =>
                (val as string[]).every((item: string) =>
                  field.options?.includes(item)
                ),
              {
                message: `All selections must be from: ${field.options.join(", ")}`,
              }
            );
          }
          break;
        case "number":
          fieldSchema = z.number();
          break;
        case "range":
          fieldSchema = z.number();
          break;
        case "date":
          fieldSchema = z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
            .trim();
          break;
        case "time":
          fieldSchema = z
            .string()
            .regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format")
            .trim();
          break;
        case "textarea":
          fieldSchema = z.string().trim();
          break;
        case "file":
          fieldSchema = z.string().trim();
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
        } else if (field.type === "multiSelect") {
          finalSchema = (fieldSchema as z.ZodArray<z.ZodString>).min(
            1,
            `${field.label} is required`
          );
        } else if (field.type === "number" || field.type === "range") {
          // Numbers are required by default, no need for extra validation
          finalSchema = fieldSchema;
        } else {
          finalSchema = (fieldSchema as z.ZodString).min(
            1,
            `${field.label} is required`
          );
        }
      } else if (field.type === "checkbox") {
        finalSchema = fieldSchema.default(false);
      } else if (field.type === "multiSelect") {
        finalSchema = (fieldSchema as z.ZodArray<z.ZodString>).default([]);
      } else if (field.type === "number" || field.type === "range") {
        finalSchema = fieldSchema.optional();
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

  // Handle number min/max
  if (fieldType === "number" || fieldType === "range") {
    if (rules.min !== undefined) {
      result = (result as z.ZodNumber).min(
        rules.min,
        `Must be at least ${rules.min}`
      );
    }
    if (rules.max !== undefined) {
      result = (result as z.ZodNumber).max(
        rules.max,
        `Must be at most ${rules.max}`
      );
    }
    return result;
  }

  // Handle string min/max length
  if (rules.minLength !== undefined) {
    if (fieldType === "multiSelect") {
      result = (result as z.ZodArray<z.ZodString>).min(
        rules.minLength,
        `Must select at least ${rules.minLength} option${rules.minLength === 1 ? "" : "s"}`
      );
    } else {
      result = (result as z.ZodString).min(
        rules.minLength,
        `Must be at least ${rules.minLength} characters`
      );
    }
  }

  if (rules.maxLength !== undefined) {
    if (fieldType === "multiSelect") {
      result = (result as z.ZodArray<z.ZodString>).max(
        rules.maxLength,
        `Must select at most ${rules.maxLength} option${rules.maxLength === 1 ? "" : "s"}`
      );
    } else {
      result = (result as z.ZodString).max(
        rules.maxLength,
        `Must be at most ${rules.maxLength} characters`
      );
    }
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

  if (typeName === "ZodNumber") {
    return "number";
  }

  if (typeName === "ZodArray") {
    return "multiSelect";
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

    // Check for date pattern
    const regexCheck = checks?.find((check) => check.kind === "regex");
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
      }
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
  const typeName = (zodType._def as { typeName?: string }).typeName;

  if (typeName === "ZodNumber") {
    const numberSchema = zodType as z.ZodNumber;
    const checks = (numberSchema._def as { checks?: Array<{ kind?: string }> })
      ?.checks;

    for (const check of checks || []) {
      if (check.kind === "min") {
        validation.min = (check as { value?: number })?.value;
      } else if (check.kind === "max") {
        validation.max = (check as { value?: number })?.value;
      }
    }
    return validation;
  }

  if (typeName === "ZodArray") {
    const arraySchema = zodType as z.ZodArray<z.ZodString>;
    const checks = (arraySchema._def as { checks?: Array<{ kind?: string }> })
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

  if (typeName !== "ZodString") {
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
