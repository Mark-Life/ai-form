"use client";

import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
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
import { type FormData, formSchema } from "@/lib/demo-schema";
import {
  formatFieldLabel,
  getFieldNames,
  getFieldType,
} from "@/lib/schema-utils";

type FormPreviewProps = {
  form: UseFormReturn<FormData>;
  onSubmit: () => void;
};

export function FormPreview({ form, onSubmit }: FormPreviewProps) {
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
          const fieldType = getFieldType(formSchema, fieldName);
          const label = formatFieldLabel(fieldName as string);
          const placeholder = `Enter ${label.toLowerCase()}`;

          return (
            <FormField
              control={form.control}
              key={fieldName as string}
              name={fieldName}
              render={({ field, fieldState }) => (
                <FormItem>
                  <Field data-invalid={fieldState.invalid}>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        aria-invalid={fieldState.invalid}
                        onChange={(e) => {
                          if (fieldType === "number") {
                            const numValue = e.target.value
                              ? Number.parseFloat(e.target.value)
                              : 0;
                            field.onChange(
                              Number.isNaN(numValue) ? 0 : numValue
                            );
                          } else {
                            field.onChange(e.target.value);
                          }
                        }}
                        placeholder={placeholder}
                        type={fieldType === "number" ? "number" : "text"}
                        value={
                          fieldType === "number" && field.value === 0
                            ? ""
                            : (field.value ?? "")
                        }
                      />
                    </FormControl>
                    {fieldState.invalid && <FormMessage />}
                  </Field>
                </FormItem>
              )}
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
