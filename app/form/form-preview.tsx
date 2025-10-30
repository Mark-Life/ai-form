"use client";

import type { UseFormReturn } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  formatFieldLabel,
  getFieldNames,
  getFieldType,
} from "@/lib/schema-utils";

type FormPreviewProps<T extends z.ZodObject<z.ZodRawShape>> = {
  form: UseFormReturn<z.infer<T>>;
  formSchema: T;
  onSubmit: () => void;
};

export function FormPreview<T extends z.ZodObject<z.ZodRawShape>>({
  form,
  formSchema,
  onSubmit,
}: FormPreviewProps<T>) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    form.handleSubmit(() => {
      onSubmit();
    })();
  };

  const fieldNames = getFieldNames(formSchema);

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={handleSubmit}>
        {fieldNames.map((fieldName) => {
          const fieldNameStr = fieldName as string;
          const fieldType = getFieldType(formSchema, fieldName);
          const label = formatFieldLabel(fieldNameStr);
          const placeholder = `Enter ${label.toLowerCase()}`;

          if (fieldType === "checkbox") {
            return (
              <FormField
                control={form.control}
                key={fieldNameStr}
                name={fieldNameStr as never}
                render={({ field, fieldState }) => (
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
                        <FormLabel className="mt-0! cursor-pointer">
                          {label}
                        </FormLabel>
                      </div>
                      {fieldState.invalid && <FormMessage />}
                    </Field>
                  </FormItem>
                )}
              />
            );
          }

          let inputType = "text";
          if (fieldType === "number") {
            inputType = "number";
          } else if (fieldType === "email") {
            inputType = "email";
          } else if (fieldType === "phone") {
            inputType = "tel";
          } else if (fieldType === "url") {
            inputType = "url";
          }

          return (
            <FormField
              control={form.control}
              key={fieldNameStr}
              name={fieldNameStr as never}
              render={({ field, fieldState }) => {
                const handleChange = (
                  e: React.ChangeEvent<HTMLInputElement>
                ) => {
                  if (fieldType === "number") {
                    const numValue = e.target.value
                      ? Number.parseFloat(e.target.value)
                      : 0;
                    field.onChange(Number.isNaN(numValue) ? 0 : numValue);
                  } else {
                    field.onChange(e.target.value);
                  }
                };

                const displayValue =
                  fieldType === "number" && field.value === 0
                    ? ""
                    : String(field.value ?? "");

                return (
                  <FormItem>
                    <Field data-invalid={fieldState.invalid}>
                      <FormLabel>{label}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          aria-invalid={fieldState.invalid}
                          onChange={handleChange}
                          placeholder={placeholder}
                          type={inputType}
                          value={displayValue}
                        />
                      </FormControl>
                      {fieldState.invalid && <FormMessage />}
                    </Field>
                  </FormItem>
                );
              }}
            />
          );
        })}
        <Button
          className="w-full"
          disabled={!form.formState.isValid}
          type="submit"
        >
          Submit Form
        </Button>
      </form>
    </Form>
  );
}
