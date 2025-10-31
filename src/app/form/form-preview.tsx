"use client";

import type { UseFormReturn } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import type { FormDefinition } from "@/lib/utils";
import { getFieldNames } from "@/lib/utils";
import { FormFieldComponent } from ".";

type FormPreviewProps<T extends z.ZodObject<z.ZodRawShape>> = {
  form: UseFormReturn<z.infer<T>>;
  formSchema: T;
  formDefinition?: FormDefinition | null;
  onSubmit: () => void;
};

export function FormPreview<T extends z.ZodObject<z.ZodRawShape>>({
  form,
  formSchema,
  formDefinition,
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
          return (
            <FormFieldComponent
              fieldName={fieldNameStr}
              form={form}
              formDefinition={formDefinition}
              formSchema={formSchema}
              key={fieldNameStr}
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
