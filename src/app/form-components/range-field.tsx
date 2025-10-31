"use client";

import type { ControllerRenderProps } from "react-hook-form";
import { Field } from "@/components/ui/field";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Slider } from "@/components/ui/slider";
import type { FormFieldDefinition } from "@/lib/utils";

const DEFAULT_MAX = 100;

type RangeFieldProps = {
  field: ControllerRenderProps<Record<string, unknown>, string> & {
    value: number | undefined;
  };
  fieldState: { invalid: boolean };
  label: string;
  fieldDef?: FormFieldDefinition;
};

export function RangeField({
  field,
  fieldState,
  label,
  fieldDef,
}: RangeFieldProps) {
  const min = fieldDef?.validation?.min ?? 0;
  const max = fieldDef?.validation?.max ?? DEFAULT_MAX;

  return (
    <FormItem>
      <Field data-invalid={fieldState.invalid}>
        <FormLabel>
          {label} ({field.value ?? min})
        </FormLabel>
        <FormControl>
          <Slider
            max={max}
            min={min}
            onValueChange={(value) => {
              field.onChange(value[0]);
            }}
            value={[field.value ?? min]}
          />
        </FormControl>
        {fieldState.invalid && <FormMessage />}
      </Field>
    </FormItem>
  );
}
