"use client";

import { GripVerticalIcon, PlusIcon, TrashIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type {
  FieldType,
  FormDefinition,
  FormFieldDefinition,
} from "@/lib/utils";
import { saveFormToStorage } from "@/lib/utils";

const CAMEL_CASE_REGEX = /^[a-z][a-zA-Z0-9]*$/;
const RANDOM_SUBSTRING_START = 2;
const RANDOM_SUBSTRING_LENGTH = 9;
const RADIX_BASE = 36;
const OPTIONS_PLACEHOLDER = "Option 1\nOption 2\nOption 3";

function generateFieldId(): string {
  return `field-${Date.now()}-${Math.random().toString(RADIX_BASE).substring(RANDOM_SUBSTRING_START, RANDOM_SUBSTRING_LENGTH)}`;
}

function validateCamelCase(name: string): boolean {
  return CAMEL_CASE_REGEX.test(name);
}

const DEFAULT_FIELD: Omit<FormFieldDefinition, "id"> = {
  name: "",
  label: "",
  type: "text",
  required: true,
};

type FormBuilderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialFields: FormDefinition;
  onSave: (fields: FormDefinition) => void;
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: fix this later
export function FormBuilderDialog({
  open,
  onOpenChange,
  initialFields,
  onSave,
}: FormBuilderDialogProps) {
  const [fields, setFields] = useState<FormDefinition>(initialFields);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(
    initialFields.length > 0 ? (initialFields[0]?.id ?? null) : null
  );
  const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [optionsText, setOptionsText] = useState<string>("");

  const selectedField = fields.find((f) => f.id === selectedFieldId);

  // Sync optionsText when selected field changes
  useEffect(() => {
    const field = fields.find((f) => f.id === selectedFieldId);
    if (field?.options) {
      setOptionsText(field.options.join("\n"));
    } else {
      setOptionsText("");
    }
  }, [fields, selectedFieldId]);

  const handleAddField = useCallback(() => {
    const newField: FormFieldDefinition = {
      ...DEFAULT_FIELD,
      id: generateFieldId(),
      name: `field${fields.length + 1}`,
      label: `Field ${fields.length + 1}`,
    };
    setFields([...fields, newField]);
    setSelectedFieldId(newField.id);
  }, [fields]);

  const handleRemoveField = useCallback(
    (id: string) => {
      const newFields = fields.filter((f) => f.id !== id);
      setFields(newFields);
      if (selectedFieldId === id) {
        setSelectedFieldId(
          newFields.length > 0 ? (newFields[0]?.id ?? null) : null
        );
      }
    },
    [fields, selectedFieldId]
  );

  const handleUpdateField = useCallback(
    (id: string, updates: Partial<FormFieldDefinition>) => {
      setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
    },
    [fields]
  );

  const handleSave = useCallback(() => {
    if (fields.length === 0) {
      return;
    }
    saveFormToStorage(fields);
    onSave(fields);
    onOpenChange(false);
  }, [fields, onSave, onOpenChange]);

  const handleMoveField = useCallback(
    (id: string, direction: "up" | "down") => {
      const index = fields.findIndex((f) => f.id === id);
      if (index === -1) {
        return;
      }
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= fields.length) {
        return;
      }
      const newFields = [...fields];
      [newFields[index], newFields[newIndex]] = [
        newFields[newIndex],
        newFields[index],
      ];
      setFields(newFields);
    },
    [fields]
  );

  const handleDragStart = useCallback((id: string) => {
    setDraggedFieldId(id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedFieldId(null);
    setDragOverIndex(null);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (draggedFieldId !== null) {
        setDragOverIndex(index);
      }
    },
    [draggedFieldId]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      if (draggedFieldId === null) {
        return;
      }

      const dragIndex = fields.findIndex((f) => f.id === draggedFieldId);
      if (dragIndex === -1 || dragIndex === dropIndex) {
        setDraggedFieldId(null);
        setDragOverIndex(null);
        return;
      }

      const newFields = [...fields];
      const [removed] = newFields.splice(dragIndex, 1);
      newFields.splice(dropIndex, 0, removed);
      setFields(newFields);
      setDraggedFieldId(null);
      setDragOverIndex(null);
    },
    [draggedFieldId, fields]
  );

  // Reset fields when dialog opens with new initialFields
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (newOpen) {
        setFields(initialFields);
        setSelectedFieldId(
          initialFields.length > 0 ? (initialFields[0]?.id ?? null) : null
        );
        setOptionsText("");
      }
      onOpenChange(newOpen);
    },
    [initialFields, onOpenChange]
  );

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] max-w-[95vw]! overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Form Builder</DialogTitle>
          <DialogDescription>
            Create a form and test it with AI assistance
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Fields List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Fields</CardTitle>
                <Button onClick={handleAddField} size="icon" variant="outline">
                  <PlusIcon className="size-4" />
                </Button>
              </div>
              <CardDescription>
                {fields.length === 0
                  ? "Add your first field to get started"
                  : `${fields.length} field${fields.length === 1 ? "" : "s"}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {fields.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  No fields yet. Click the + button to add one.
                </div>
              ) : (
                fields.map((field, index) => (
                  // biome-ignore lint: drag and drop requires onDragOver/onDrop handlers on div
                  <div
                    className={`group flex items-center gap-2 rounded-md border p-2 transition-colors ${
                      selectedFieldId === field.id
                        ? "border-primary bg-accent"
                        : "border-transparent hover:border-input"
                    } ${
                      dragOverIndex === index && draggedFieldId !== field.id
                        ? "border-primary border-dashed"
                        : ""
                    } ${draggedFieldId === field.id ? "opacity-50" : ""}`}
                    key={field.id}
                    onDragOver={(e) => {
                      e.preventDefault();
                      handleDragOver(e, index);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleDrop(e, index);
                    }}
                  >
                    <button
                      className="cursor-move text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                      draggable
                      onClick={() => setSelectedFieldId(field.id)}
                      onDragEnd={handleDragEnd}
                      onDragStart={() => handleDragStart(field.id)}
                      type="button"
                    >
                      <GripVerticalIcon className="size-4" />
                    </button>
                    <button
                      className="flex-1 text-left"
                      onClick={() => setSelectedFieldId(field.id)}
                      type="button"
                    >
                      <div className="font-medium text-sm">
                        {field.label || field.name}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {field.type} {field.required && "• Required"}
                      </div>
                    </button>
                    <div className="flex gap-1">
                      {index > 0 && (
                        <Button
                          className="size-6"
                          onClick={() => handleMoveField(field.id, "up")}
                          size="icon"
                          variant="ghost"
                        >
                          ↑
                        </Button>
                      )}
                      {index < fields.length - 1 && (
                        <Button
                          className="size-6"
                          onClick={() => handleMoveField(field.id, "down")}
                          size="icon"
                          variant="ghost"
                        >
                          ↓
                        </Button>
                      )}
                      <Button
                        className="size-6 text-destructive"
                        onClick={() => handleRemoveField(field.id)}
                        size="icon"
                        variant="ghost"
                      >
                        <TrashIcon className="size-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Field Configuration */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>
                {selectedField ? "Field Configuration" : "No Field Selected"}
              </CardTitle>
              <CardDescription>
                {selectedField
                  ? "Configure the selected field"
                  : "Select a field from the list to configure it"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedField ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="field-name">Field Name (camelCase)</Label>
                    <Input
                      id="field-name"
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || validateCamelCase(value)) {
                          handleUpdateField(selectedField.id, { name: value });
                        }
                      }}
                      placeholder="fieldName"
                      value={selectedField.name}
                    />
                    {selectedField.name &&
                      !validateCamelCase(selectedField.name) && (
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
                        handleUpdateField(selectedField.id, {
                          label: e.target.value,
                        })
                      }
                      placeholder="Field Label"
                      value={selectedField.label}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="field-type">Type</Label>
                    <Select
                      onValueChange={(value: FieldType) =>
                        handleUpdateField(selectedField.id, { type: value })
                      }
                      value={selectedField.type}
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
                        <SelectItem value="select">
                          Select (Single Choice)
                        </SelectItem>
                        <SelectItem value="multiSelect">
                          Multi-Select
                        </SelectItem>
                        <SelectItem value="checkbox">Checkbox</SelectItem>
                        <SelectItem value="range">Range (Slider)</SelectItem>
                        <SelectItem value="file">File Upload</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(selectedField.type === "select" ||
                    selectedField.type === "multiSelect") && (
                    <div className="space-y-2">
                      <Label htmlFor="field-options">
                        Options (one per line)
                      </Label>
                      <Textarea
                        className="min-h-24 resize-y"
                        id="field-options"
                        onBlur={(e) => {
                          if (!selectedField) {
                            return;
                          }
                          const rawValue = e.target.value;
                          const processedOptions =
                            rawValue.trim().length > 0
                              ? rawValue
                                  .split("\n")
                                  .map((line) => line.trim())
                                  .filter((line) => line.length > 0)
                              : undefined;
                          handleUpdateField(selectedField.id, {
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
                      checked={selectedField.required}
                      id="field-required"
                      onCheckedChange={(checked) =>
                        handleUpdateField(selectedField.id, {
                          required: checked,
                        })
                      }
                    />
                  </div>

                  {(selectedField.type === "text" ||
                    selectedField.type === "email" ||
                    selectedField.type === "phone" ||
                    selectedField.type === "url" ||
                    selectedField.type === "textarea" ||
                    selectedField.type === "time") && (
                    <div className="space-y-4 rounded-md border p-4">
                      <h3 className="font-medium text-sm">Validation Rules</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="min-length">Min Length</Label>
                          <Input
                            id="min-length"
                            min="0"
                            onChange={(e) =>
                              handleUpdateField(selectedField.id, {
                                validation: {
                                  ...selectedField.validation,
                                  minLength: e.target.value
                                    ? Number.parseInt(e.target.value, 10)
                                    : undefined,
                                },
                              })
                            }
                            placeholder="0"
                            type="number"
                            value={selectedField.validation?.minLength ?? ""}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="max-length">Max Length</Label>
                          <Input
                            id="max-length"
                            min="0"
                            onChange={(e) =>
                              handleUpdateField(selectedField.id, {
                                validation: {
                                  ...selectedField.validation,
                                  maxLength: e.target.value
                                    ? Number.parseInt(e.target.value, 10)
                                    : undefined,
                                },
                              })
                            }
                            placeholder="Unlimited"
                            type="number"
                            value={selectedField.validation?.maxLength ?? ""}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {(selectedField.type === "number" ||
                    selectedField.type === "range") && (
                    <div className="space-y-4 rounded-md border p-4">
                      <h3 className="font-medium text-sm">Validation Rules</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="min-value">Min Value</Label>
                          <Input
                            id="min-value"
                            onChange={(e) =>
                              handleUpdateField(selectedField.id, {
                                validation: {
                                  ...selectedField.validation,
                                  min: e.target.value
                                    ? Number.parseFloat(e.target.value)
                                    : undefined,
                                },
                              })
                            }
                            placeholder="No minimum"
                            type="number"
                            value={selectedField.validation?.min ?? ""}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="max-value">Max Value</Label>
                          <Input
                            id="max-value"
                            onChange={(e) =>
                              handleUpdateField(selectedField.id, {
                                validation: {
                                  ...selectedField.validation,
                                  max: e.target.value
                                    ? Number.parseFloat(e.target.value)
                                    : undefined,
                                },
                              })
                            }
                            placeholder="No maximum"
                            type="number"
                            value={selectedField.validation?.max ?? ""}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedField.type === "multiSelect" && (
                    <div className="space-y-4 rounded-md border p-4">
                      <h3 className="font-medium text-sm">Validation Rules</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="min-selections">Min Selections</Label>
                          <Input
                            id="min-selections"
                            min="0"
                            onChange={(e) =>
                              handleUpdateField(selectedField.id, {
                                validation: {
                                  ...selectedField.validation,
                                  minLength: e.target.value
                                    ? Number.parseInt(e.target.value, 10)
                                    : undefined,
                                },
                              })
                            }
                            placeholder="0"
                            type="number"
                            value={selectedField.validation?.minLength ?? ""}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="max-selections">Max Selections</Label>
                          <Input
                            id="max-selections"
                            min="0"
                            onChange={(e) =>
                              handleUpdateField(selectedField.id, {
                                validation: {
                                  ...selectedField.validation,
                                  maxLength: e.target.value
                                    ? Number.parseInt(e.target.value, 10)
                                    : undefined,
                                },
                              })
                            }
                            placeholder="Unlimited"
                            type="number"
                            value={selectedField.validation?.maxLength ?? ""}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  Select a field to configure it
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button disabled={fields.length === 0} onClick={handleSave}>
            Save & Update Form
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
