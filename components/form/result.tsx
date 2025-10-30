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
        <CardDescription>Your form has been submitted with the following information:</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-sm font-medium">
              First Name
            </span>
            <span className="text-foreground">{formData.firstName}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-sm font-medium">
              Last Name
            </span>
            <span className="text-foreground">{formData.lastName}</span>
          </div>
        </div>
        <Button onClick={onReset} className="w-full mt-6">
          Reset Form
        </Button>
      </CardContent>
    </Card>
  );
}

