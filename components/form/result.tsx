"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { FormData } from "@/lib/demo-schema";

type FormResultProps = {
  formData: FormData;
  onReset: () => void;
};

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
          <div className="flex flex-col gap-1">
            <span className="font-medium text-muted-foreground text-sm">
              First Name
            </span>
            <span className="text-foreground">{formData.firstName}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-medium text-muted-foreground text-sm">
              Last Name
            </span>
            <span className="text-foreground">{formData.lastName}</span>
          </div>
        </div>
        <Button className="mt-6 w-full" onClick={onReset}>
          Reset Form
        </Button>
      </CardContent>
    </Card>
  );
}
