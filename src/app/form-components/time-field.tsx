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

type TimeFieldProps = {
  field: ControllerRenderProps<Record<string, unknown>, string>;
  fieldState: { invalid: boolean };
  label: string;
  placeholder: string;
  fieldDef?: FormFieldDefinition;
};

export function TimeField({
  field,
  fieldState,
  label,
  placeholder,
}: TimeFieldProps) {
  return (
    <FormItem>
      <Field data-invalid={fieldState.invalid}>
        <FormLabel>{label}</FormLabel>
        <FormControl>
          <Input
            aria-invalid={fieldState.invalid}
            name={field.name}
            onBlur={field.onBlur}
            onChange={field.onChange}
            placeholder={placeholder}
            ref={field.ref}
            type="time"
            value={(field.value as string | undefined) ?? ""}
          />
        </FormControl>
        {fieldState.invalid && <FormMessage />}
      </Field>
    </FormItem>
  );
}
