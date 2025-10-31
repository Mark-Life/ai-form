"use client";

import type { ControllerRenderProps } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { FormFieldDefinition } from "@/lib/utils";

type CheckboxFieldProps = {
  field: ControllerRenderProps<Record<string, unknown>, string>;
  fieldState: {
    invalid: boolean;
  };
  label: string;
  fieldDef?: FormFieldDefinition;
};

export function CheckboxField({
  field,
  fieldState,
  label,
}: CheckboxFieldProps) {
  return (
    <FormItem>
      <Field data-invalid={fieldState.invalid}>
        <div className="flex items-center gap-2">
          <FormControl>
            <Checkbox
              aria-invalid={fieldState.invalid}
              checked={Boolean(field.value)}
              onCheckedChange={field.onChange}
            />
          </FormControl>
          <FormLabel className="mt-0! cursor-pointer">{label}</FormLabel>
        </div>
        {fieldState.invalid && <FormMessage />}
      </Field>
    </FormItem>
  );
}
