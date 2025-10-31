"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { ControllerRenderProps } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field } from "@/components/ui/field";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { FormFieldDefinition } from "@/lib/utils";
import { cn } from "@/lib/utils";

type DateFieldProps = {
  field: ControllerRenderProps<Record<string, unknown>, string>;
  fieldState: { invalid: boolean };
  label: string;
  placeholder: string;
  fieldDef?: FormFieldDefinition;
};

export function DateField({
  field,
  fieldState,
  label,
  placeholder,
}: DateFieldProps) {
  return (
    <FormItem>
      <Field data-invalid={fieldState.invalid}>
        <FormLabel>{label}</FormLabel>
        <Popover>
          <PopoverTrigger asChild>
            <FormControl>
              <Button
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !field.value && "text-muted-foreground"
                )}
                type="button"
                variant="outline"
              >
                <CalendarIcon className="mr-2 size-4" />
                {field.value ? (
                  format(new Date(field.value as string | number | Date), "PPP")
                ) : (
                  <span>{placeholder}</span>
                )}
              </Button>
            </FormControl>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <Calendar
              mode="single"
              onSelect={(date) => {
                field.onChange(date ? format(date, "yyyy-MM-dd") : "");
              }}
              selected={
                field.value ? new Date(field.value as string) : undefined
              }
            />
          </PopoverContent>
        </Popover>
        {fieldState.invalid && <FormMessage />}
      </Field>
    </FormItem>
  );
}
