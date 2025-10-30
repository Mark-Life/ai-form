"use client";

import type { UseFormReturn } from "react-hook-form";
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
};

export function FormPreview({ form }: FormPreviewProps) {
  return (
    <Form {...form}>
      <form className="space-y-6">
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
      </form>
    </Form>
  );
}
