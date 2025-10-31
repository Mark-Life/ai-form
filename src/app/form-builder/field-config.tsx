"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { FieldType, FormFieldDefinition } from "@/lib/utils";
import { OPTIONS_PLACEHOLDER, validateCamelCase } from "./utils";

type FieldConfigProps = {
  field: FormFieldDefinition | null;
  onUpdateField: (id: string, updates: Partial<FormFieldDefinition>) => void;
};

export function FieldConfig({ field, onUpdateField }: FieldConfigProps) {
  const [optionsText, setOptionsText] = useState<string>("");

  useEffect(() => {
    if (field?.options) {
      setOptionsText(field.options.join("\n"));
    } else {
      setOptionsText("");
    }
  }, [field]);

  if (!field) {
    return (
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>No Field Selected</CardTitle>
          <CardDescription>
            Select a field from the list to configure it
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center text-muted-foreground text-sm">
            Select a field to configure it
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Field Configuration</CardTitle>
        <CardDescription>Configure the selected field</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="field-name">Field Name (camelCase)</Label>
            <Input
              id="field-name"
              onChange={(e) => {
                const value = e.target.value;
                if (value === "" || validateCamelCase(value)) {
                  onUpdateField(field.id, { name: value });
                }
              }}
              placeholder="fieldName"
              value={field.name}
            />
            {field.name && !validateCamelCase(field.name) && (
              <p className="text-destructive text-xs">
                Must be valid camelCase (start with lowercase letter)
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="field-label">Label</Label>
            <Input
              id="field-label"
              onChange={(e) =>
                onUpdateField(field.id, {
                  label: e.target.value,
                })
              }
              placeholder="Field Label"
              value={field.label}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="field-type">Type</Label>
            <Select
              onValueChange={(value: FieldType) =>
                onUpdateField(field.id, { type: value })
              }
              value={field.type}
            >
              <SelectTrigger id="field-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="textarea">Textarea</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="url">URL</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="time">Time</SelectItem>
                <SelectItem value="select">Select (Single Choice)</SelectItem>
                <SelectItem value="multiSelect">Multi-Select</SelectItem>
                <SelectItem value="checkbox">Checkbox</SelectItem>
                <SelectItem value="range">Range (Slider)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(field.type === "select" || field.type === "multiSelect") && (
            <div className="space-y-2">
              <Label htmlFor="field-options">Options (one per line)</Label>
              <Textarea
                className="min-h-24 resize-y"
                id="field-options"
                onBlur={(e) => {
                  const rawValue = e.target.value;
                  const processedOptions =
                    rawValue.trim().length > 0
                      ? rawValue
                          .split("\n")
                          .map((line) => line.trim())
                          .filter((line) => line.length > 0)
                      : undefined;
                  onUpdateField(field.id, {
                    options: processedOptions,
                  });
                  setOptionsText(processedOptions?.join("\n") ?? "");
                }}
                onChange={(e) => {
                  setOptionsText(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.stopPropagation();
                  }
                }}
                placeholder={OPTIONS_PLACEHOLDER}
                rows={5}
                value={optionsText}
              />
              <p className="text-muted-foreground text-xs">
                Enter one option per line
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="field-required">Required</Label>
              <p className="text-muted-foreground text-xs">
                Field must be filled
              </p>
            </div>
            <Switch
              checked={field.required}
              id="field-required"
              onCheckedChange={(checked) =>
                onUpdateField(field.id, {
                  required: checked,
                })
              }
            />
          </div>

          {(field.type === "text" ||
            field.type === "email" ||
            field.type === "phone" ||
            field.type === "url" ||
            field.type === "textarea" ||
            field.type === "time") && (
            <div className="space-y-4 rounded-md border p-4">
              <h3 className="font-medium text-sm">Validation Rules</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="min-length">Min Length</Label>
                  <Input
                    id="min-length"
                    min="0"
                    onChange={(e) =>
                      onUpdateField(field.id, {
                        validation: {
                          ...field.validation,
                          minLength: e.target.value
                            ? Number.parseInt(e.target.value, 10)
                            : undefined,
                        },
                      })
                    }
                    placeholder="0"
                    type="number"
                    value={field.validation?.minLength ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-length">Max Length</Label>
                  <Input
                    id="max-length"
                    min="0"
                    onChange={(e) =>
                      onUpdateField(field.id, {
                        validation: {
                          ...field.validation,
                          maxLength: e.target.value
                            ? Number.parseInt(e.target.value, 10)
                            : undefined,
                        },
                      })
                    }
                    placeholder="Unlimited"
                    type="number"
                    value={field.validation?.maxLength ?? ""}
                  />
                </div>
              </div>
            </div>
          )}

          {(field.type === "number" || field.type === "range") && (
            <div className="space-y-4 rounded-md border p-4">
              <h3 className="font-medium text-sm">Validation Rules</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="min-value">Min Value</Label>
                  <Input
                    id="min-value"
                    onChange={(e) =>
                      onUpdateField(field.id, {
                        validation: {
                          ...field.validation,
                          min: e.target.value
                            ? Number.parseFloat(e.target.value)
                            : undefined,
                        },
                      })
                    }
                    placeholder="No minimum"
                    type="number"
                    value={field.validation?.min ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-value">Max Value</Label>
                  <Input
                    id="max-value"
                    onChange={(e) =>
                      onUpdateField(field.id, {
                        validation: {
                          ...field.validation,
                          max: e.target.value
                            ? Number.parseFloat(e.target.value)
                            : undefined,
                        },
                      })
                    }
                    placeholder="No maximum"
                    type="number"
                    value={field.validation?.max ?? ""}
                  />
                </div>
              </div>
            </div>
          )}

          {field.type === "multiSelect" && (
            <div className="space-y-4 rounded-md border p-4">
              <h3 className="font-medium text-sm">Validation Rules</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="min-selections">Min Selections</Label>
                  <Input
                    id="min-selections"
                    min="0"
                    onChange={(e) =>
                      onUpdateField(field.id, {
                        validation: {
                          ...field.validation,
                          minLength: e.target.value
                            ? Number.parseInt(e.target.value, 10)
                            : undefined,
                        },
                      })
                    }
                    placeholder="0"
                    type="number"
                    value={field.validation?.minLength ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-selections">Max Selections</Label>
                  <Input
                    id="max-selections"
                    min="0"
                    onChange={(e) =>
                      onUpdateField(field.id, {
                        validation: {
                          ...field.validation,
                          maxLength: e.target.value
                            ? Number.parseInt(e.target.value, 10)
                            : undefined,
                        },
                      })
                    }
                    placeholder="Unlimited"
                    type="number"
                    value={field.validation?.maxLength ?? ""}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

