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
import { formSchema, type FormData } from "@/lib/demo-schema";
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
          const placeholder = `Enter your ${label.toLowerCase()}`;

          return (
            <FormField
              key={fieldName as string}
              control={form.control}
              name={fieldName}
              render={({ field, fieldState }) => (
                <FormItem>
                  <Field data-invalid={fieldState.invalid}>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        aria-invalid={fieldState.invalid}
                        placeholder={placeholder}
                        type={fieldType === "number" ? "number" : "text"}
                        value={
                          fieldType === "number" && field.value === 0
                            ? ""
                            : field.value ?? ""
                        }
                        onChange={(e) => {
                          if (fieldType === "number") {
                            const numValue = e.target.value
                              ? Number.parseFloat(e.target.value)
                              : 0;
                            field.onChange(Number.isNaN(numValue) ? 0 : numValue);
                          } else {
                            field.onChange(e.target.value);
                          }
                        }}
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
          type="submit"
          disabled={!form.formState.isValid}
          className="w-full"
        >
          Submit Form
        </Button>
      </form>
    </Form>
  );
}
