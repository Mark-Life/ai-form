"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatFieldLabel } from "@/lib/utils";

type FormResultProps = {
  formData: Record<string, unknown>;
  onReset: () => void;
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  return String(value);
}

export function FormResult({ formData, onReset }: FormResultProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Form Submitted Successfully</CardTitle>
        <CardDescription>
          Your form has been submitted with the following information:
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {Object.entries(formData).map(([key, value]) => (
            <div className="flex flex-col gap-1" key={key}>
              <span className="font-medium text-muted-foreground text-sm">
                {formatFieldLabel(key)}
              </span>
              <span className="text-foreground">{formatValue(value)}</span>
            </div>
          ))}
        </div>
        <Button className="mt-6 w-full" onClick={onReset}>
          Reset Form
        </Button>
      </CardContent>
    </Card>
  );
}
