"use client";

import { useId } from "react";
import type { ControllerRenderProps } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import type { FormFieldDefinition } from "@/lib/utils";

type MultiSelectFieldProps = {
  field: ControllerRenderProps<Record<string, unknown>, string>;
  fieldState: { invalid: boolean };
  label: string;
  options: string[];
  fieldDef?: FormFieldDefinition;
};

export function MultiSelectField({
  field,
  fieldState,
  label,
  options,
}: MultiSelectFieldProps) {
  const baseId = useId();

  if (options.length === 0) {
    return null;
  }

  return (
    <FormItem>
      <Field data-invalid={fieldState.invalid}>
        <FormLabel>{label}</FormLabel>
        <div className="space-y-2">
          {options.map((option, index) => {
            const checkboxId = `${baseId}-${index}`;
            return (
              <div className="flex items-center gap-2" key={option}>
                <Checkbox
                  aria-invalid={fieldState.invalid}
                  checked={
                    Array.isArray(field.value) &&
                    (field.value as string[]).includes(option)
                  }
                  id={checkboxId}
                  onCheckedChange={(checked) => {
                    const currentValue = (field.value as string[]) || [];
                    if (checked) {
                      field.onChange([...currentValue, option]);
                    } else {
                      field.onChange(currentValue.filter((v) => v !== option));
                    }
                  }}
                />
                <Label
                  className="cursor-pointer font-normal"
                  htmlFor={checkboxId}
                >
                  {option}
                </Label>
              </div>
            );
          })}
        </div>
        {fieldState.invalid && <FormMessage />}
      </Field>
    </FormItem>
  );
}
