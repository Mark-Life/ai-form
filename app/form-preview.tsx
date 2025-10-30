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
import type { FormData } from "@/lib/demo-schema";

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

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <FormField
          control={form.control}
          name="firstName"
          render={({ field, fieldState }) => (
            <FormItem>
              <Field data-invalid={fieldState.invalid}>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    placeholder="Enter your first name"
                  />
                </FormControl>
                {fieldState.invalid && <FormMessage />}
              </Field>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lastName"
          render={({ field, fieldState }) => (
            <FormItem>
              <Field data-invalid={fieldState.invalid}>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    placeholder="Enter your last name"
                  />
                </FormControl>
                {fieldState.invalid && <FormMessage />}
              </Field>
            </FormItem>
          )}
        />
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
