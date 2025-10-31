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
import type { FieldType, FormFieldDefinition } from "@/lib/utils";

type TextFieldProps = {
  field: ControllerRenderProps<Record<string, unknown>, string>;
  fieldState: { invalid: boolean };
  label: string;
  placeholder: string;
  fieldType: FieldType;
  fieldDef?: FormFieldDefinition;
};

export function TextField({
  field,
  fieldState,
  label,
  placeholder,
  fieldType,
}: TextFieldProps) {
  let inputType = "text";
  if (fieldType === "email") {
    inputType = "email";
  } else if (fieldType === "phone") {
    inputType = "tel";
  } else if (fieldType === "url") {
    inputType = "url";
  }

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
            type={inputType}
            value={(field.value as string | undefined) ?? ""}
          />
        </FormControl>
        {fieldState.invalid && <FormMessage />}
      </Field>
    </FormItem>
  );
}
