"use client";

import type { ControllerRenderProps } from "react-hook-form";
import { Field } from "@/components/ui/field";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import type { FormFieldDefinition } from "@/lib/utils";

type TextareaFieldProps = {
  field: ControllerRenderProps<Record<string, unknown>, string>;
  fieldState: { invalid: boolean };
  label: string;
  placeholder: string;
  fieldDef?: FormFieldDefinition;
};

export function TextareaField({
  field,
  fieldState,
  label,
  placeholder,
}: TextareaFieldProps) {
  return (
    <FormItem>
      <Field data-invalid={fieldState.invalid}>
        <FormLabel>{label}</FormLabel>
        <FormControl>
          <Textarea
            aria-invalid={fieldState.invalid}
            name={field.name}
            onBlur={field.onBlur}
            onChange={field.onChange}
            placeholder={placeholder}
            ref={field.ref}
            value={(field.value as string | undefined) ?? ""}
          />
        </FormControl>
        {fieldState.invalid && <FormMessage />}
      </Field>
    </FormItem>
  );
}
