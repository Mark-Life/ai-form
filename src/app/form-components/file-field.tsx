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

type FileFieldProps = {
  field: ControllerRenderProps<Record<string, unknown>, string>;
  fieldState: { invalid: boolean };
  label: string;
  placeholder: string;
  fieldDef?: FormFieldDefinition;
};

export function FileField({
  field,
  fieldState,
  label,
  placeholder,
}: FileFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    field.onChange(file ? file.name : "");
  };

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
            type="file"
            value={(field.value as string | undefined) ?? ""}
          />
        </FormControl>
        {fieldState.invalid && <FormMessage />}
      </Field>
    </FormItem>
  );
}
