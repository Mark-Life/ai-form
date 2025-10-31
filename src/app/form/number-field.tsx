"use client";

import type { ControllerRenderProps } from "react-hook-form";
import { Field } from "@/components/ui/field";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { FormFieldDefinition } from "@/lib/utils";

type NumberFieldProps = {
  field: ControllerRenderProps<Record<string, unknown>, string> & {
    value: number | undefined;
  };
  fieldState: { invalid: boolean };
  label: string;
  placeholder: string;
  fieldDef?: FormFieldDefinition;
};

export function NumberField({
  field,
  fieldState,
  label,
  placeholder,
}: NumberFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = e.target.value ? Number.parseFloat(e.target.value) : 0;
    field.onChange(Number.isNaN(numValue) ? 0 : numValue);
  };

  const displayValue = field.value === 0 ? "" : String(field.value ?? "");

  return (
    <FormItem>
      <Field data-invalid={fieldState.invalid}>
        <FormLabel>{label}</FormLabel>
        <FormControl>
          <Input
            aria-invalid={fieldState.invalid}
            name={field.name}
            onBlur={field.onBlur}
            onChange={handleChange}
            placeholder={placeholder}
            ref={field.ref}
            type="number"
            value={displayValue}
          />
        </FormControl>
        {fieldState.invalid && <FormMessage />}
      </Field>
    </FormItem>
  );
}
