"use client";

import type { ControllerRenderProps } from "react-hook-form";
import { Field } from "@/components/ui/field";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FormFieldDefinition } from "@/lib/utils";

type SelectFieldProps = {
  field: ControllerRenderProps<Record<string, unknown>, string>;
  fieldState: { invalid: boolean };
  label: string;
  placeholder: string;
  options: string[];
  fieldDef?: FormFieldDefinition;
};

export function SelectField({
  field,
  fieldState,
  label,
  placeholder,
  options,
}: SelectFieldProps) {
  if (options.length === 0) {
    return null;
  }

  return (
    <FormItem>
      <Field data-invalid={fieldState.invalid}>
        <FormLabel>{label}</FormLabel>
        <Select
          onValueChange={field.onChange}
          value={(field.value as string | undefined) ?? ""}
        >
          <FormControl>
            <SelectTrigger>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {fieldState.invalid && <FormMessage />}
      </Field>
    </FormItem>
  );
}
