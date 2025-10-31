import { z } from "zod";
import type {
  FieldType,
  FormDefinition,
  ValidationRules,
} from "./form-definition";
import { formatFieldLabel } from "./schema-utils";

const PHONE_PATTERN_REGEX =
  /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
const DATE_PATTERN_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN_REGEX = /^\d{2}:\d{2}$/;

function createBaseFieldSchema(field: {
  type: FieldType;
  options?: string[];
}): z.ZodTypeAny {
  switch (field.type) {
    case "text":
      return z.string().trim();
    case "email":
      return z.string().email("Invalid email address").trim();
    case "phone":
      return z
        .string()
        .regex(PHONE_PATTERN_REGEX, "Invalid phone number")
        .trim();
    case "url":
      return z.string().url("Invalid URL, include protocol").trim();
    case "checkbox":
      return z.boolean();
    case "select": {
      let schema = z.string().trim();
      if (field.options && field.options.length > 0) {
        schema = schema.refine(
          (val) => field.options?.includes(val as string) ?? false,
          {
            message: `Must be one of: ${field.options.join(", ")}`,
          }
        );
      }
      return schema;
    }
    case "multiSelect": {
      let schema = z.array(z.string());
      if (field.options && field.options.length > 0) {
        schema = schema.refine(
          (val) =>
            (val as string[]).every((item: string) =>
              field.options?.includes(item)
            ),
          {
            message: `All selections must be from: ${field.options.join(", ")}`,
          }
        );
      }
      return schema;
    }
    case "number":
    case "range":
      return z.number();
    case "date":
      return z
        .string()
        .regex(DATE_PATTERN_REGEX, "Date must be in YYYY-MM-DD format")
        .trim();
    case "time":
      return z
        .string()
        .regex(TIME_PATTERN_REGEX, "Time must be in HH:MM format")
        .trim();
    default:
      return z.string().trim();
  }
}

function applyRequiredOrOptional(
  fieldSchema: z.ZodTypeAny,
  field: { type: FieldType; required?: boolean; label: string }
): z.ZodTypeAny {
  if (field.required) {
    if (field.type === "checkbox") {
      return fieldSchema;
    }
    if (field.type === "multiSelect") {
      return (fieldSchema as z.ZodArray<z.ZodString>).min(
        1,
        `${field.label} is required`
      );
    }
    if (field.type === "number" || field.type === "range") {
      return fieldSchema;
    }
    return (fieldSchema as z.ZodString).min(1, `${field.label} is required`);
  }

  if (field.type === "checkbox") {
    return fieldSchema.default(false);
  }
  if (field.type === "multiSelect") {
    return (fieldSchema as z.ZodArray<z.ZodString>).default([]);
  }
  if (field.type === "number" || field.type === "range") {
    return fieldSchema.optional();
  }
  return fieldSchema.optional();
}

/**
 * Convert a form definition to a Zod schema
 */
export function formDefinitionToZodSchema(
  formDef: FormDefinition
): z.ZodObject<z.ZodRawShape> {
  const shape: z.ZodRawShape = Object.fromEntries(
    formDef.map((field) => {
      let fieldSchema = createBaseFieldSchema(field);

      if (field.validation) {
        fieldSchema = applyValidationRules(
          fieldSchema,
          field.validation,
          field.type
        );
      }

      const finalSchema = applyRequiredOrOptional(fieldSchema, field);
      return [field.name, finalSchema];
    })
  );

  return z.object(shape);
}

function applyNumberValidation(
  schema: z.ZodNumber,
  rules: ValidationRules
): z.ZodNumber {
  let result = schema;
  if (rules.min !== undefined) {
    result = result.min(rules.min, `Must be at least ${rules.min}`);
  }
  if (rules.max !== undefined) {
    result = result.max(rules.max, `Must be at most ${rules.max}`);
  }
  return result;
}

function applyStringLengthValidation(
  schema: z.ZodTypeAny,
  rules: ValidationRules,
  fieldType: FieldType
): z.ZodTypeAny {
  let result = schema;
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
  return result;
}

/**
 * Apply validation rules to a Zod schema
 */
function applyValidationRules(
  schema: z.ZodTypeAny,
  rules: ValidationRules,
  fieldType: FieldType
): z.ZodTypeAny {
  if (fieldType === "checkbox") {
    return schema;
  }

  if (fieldType === "number" || fieldType === "range") {
    return applyNumberValidation(schema as z.ZodNumber, rules);
  }

  let result = applyStringLengthValidation(schema, rules, fieldType);

  if (rules.pattern) {
    const message = rules.patternMessage || "Invalid format";
    result = (result as z.ZodString).regex(new RegExp(rules.pattern), message);
  }

  return result;
}

function detectStringFieldType(zodType: z.ZodString): FieldType {
  const stringSchema = zodType;
  const checks = (stringSchema._def as { checks?: Array<{ kind?: string }> })
    ?.checks;

  if (checks?.some((check) => check.kind === "email")) {
    return "email";
  }
  if (checks?.some((check) => check.kind === "url")) {
    return "url";
  }

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
    return detectStringFieldType(zodType as z.ZodString);
  }

  return "text";
}

function extractNumberValidation(zodType: z.ZodNumber): ValidationRules {
  const validation: ValidationRules = {};
  const checks = (zodType._def as { checks?: Array<{ kind?: string }> })
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

function extractArrayValidation(
  zodType: z.ZodArray<z.ZodString>
): ValidationRules {
  const validation: ValidationRules = {};
  const checks = (zodType._def as { checks?: Array<{ kind?: string }> })
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

function extractStringValidation(zodType: z.ZodString): ValidationRules {
  const validation: ValidationRules = {};
  const checks = (zodType._def as { checks?: Array<{ kind?: string }> })
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
 * Extract validation rules from Zod string schema
 */
function extractValidationRules(zodType: z.ZodTypeAny): ValidationRules {
  const typeName = (zodType._def as { typeName?: string }).typeName;

  if (typeName === "ZodNumber") {
    return extractNumberValidation(zodType as z.ZodNumber);
  }
  if (typeName === "ZodArray") {
    return extractArrayValidation(zodType as z.ZodArray<z.ZodString>);
  }
  if (typeName === "ZodString") {
    return extractStringValidation(zodType as z.ZodString);
  }

  return {};
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
