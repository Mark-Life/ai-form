"use client";

import type { UseFormReturn } from "react-hook-form";
import type { z } from "zod";
import { FormField } from "@/components/ui/form";
import type { FieldType, FormDefinition } from "@/lib/utils";
import { formatFieldLabel, getFieldType } from "@/lib/utils";
import { CheckboxField } from "./checkbox-field";
import { DateField } from "./date-field";
import { MultiSelectField } from "./multi-select-field";
import { NumberField } from "./number-field";
import { RangeField } from "./range-field";
import { SelectField } from "./select-field";
import { TextField } from "./text-field";
import { TextareaField } from "./textarea-field";
import { TimeField } from "./time-field";

type FormFieldComponentProps<T extends z.ZodObject<z.ZodRawShape>> = {
  fieldName: string;
  form: UseFormReturn<z.infer<T>>;
  formSchema: T;
  formDefinition?: FormDefinition | null;
};

export function FormFieldComponent<T extends z.ZodObject<z.ZodRawShape>>({
  fieldName,
  form,
  formSchema,
  formDefinition,
}: FormFieldComponentProps<T>) {
  const fieldNameStr = fieldName as string;
  const fieldDef = formDefinition?.find((f) => f.name === fieldNameStr);
  // Use fieldDef.type as source of truth, fallback to schema detection
  const detectedType = getFieldType(formSchema, fieldName);
  const fieldType: FieldType =
    fieldDef?.type || (detectedType === "unknown" ? "text" : detectedType);
  const label = fieldDef?.label || formatFieldLabel(fieldNameStr);
  const placeholder = `Enter ${label.toLowerCase()}`;
  const options = fieldDef?.options || [];

  return (
    <FormField
      control={form.control}
      name={fieldNameStr as never}
      render={({ field, fieldState }) => {
        switch (fieldType) {
          case "checkbox":
            return (
              <CheckboxField
                field={field as never}
                fieldDef={fieldDef}
                fieldState={fieldState}
                label={label}
              />
            );

          case "select":
            return (
              <SelectField
                field={field as never}
                fieldDef={fieldDef}
                fieldState={fieldState}
                label={label}
                options={options}
                placeholder={placeholder}
              />
            );

          case "multiSelect":
            return (
              <MultiSelectField
                field={field as never}
                fieldDef={fieldDef}
                fieldState={fieldState}
                label={label}
                options={options}
              />
            );

          case "date":
            return (
              <DateField
                field={field as never}
                fieldDef={fieldDef}
                fieldState={fieldState}
                label={label}
                placeholder={placeholder}
              />
            );

          case "time":
            return (
              <TimeField
                field={field as never}
                fieldDef={fieldDef}
                fieldState={fieldState}
                label={label}
                placeholder={placeholder}
              />
            );

          case "textarea":
            return (
              <TextareaField
                field={field as never}
                fieldDef={fieldDef}
                fieldState={fieldState}
                label={label}
                placeholder={placeholder}
              />
            );

          case "number":
            return (
              <NumberField
                field={field as never}
                fieldDef={fieldDef}
                fieldState={fieldState}
                label={label}
                placeholder={placeholder}
              />
            );

          case "range":
            return (
              <RangeField
                field={field as never}
                fieldDef={fieldDef}
                fieldState={fieldState}
                label={label}
              />
            );

          default:
            return (
              <TextField
                field={field as never}
                fieldDef={fieldDef}
                fieldState={fieldState}
                fieldType={fieldType}
                label={label}
                placeholder={placeholder}
              />
            );
        }
      }}
    />
  );
}
