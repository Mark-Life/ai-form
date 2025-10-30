"use client";

import { GripVerticalIcon, PlusIcon, TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
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
import type {
  FieldType,
  FormDefinition,
  FormFieldDefinition,
} from "@/lib/utils";
import { loadFormFromStorage, saveFormToStorage } from "@/lib/utils";

const CAMEL_CASE_REGEX = /^[a-z][a-zA-Z0-9]*$/;
const RANDOM_SUBSTRING_START = 2;
const RANDOM_SUBSTRING_LENGTH = 9;
const RADIX_BASE = 36;

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

export default function FormBuilder() {
  const router = useRouter();
  const [fields, setFields] = useState<FormDefinition>(() => {
    const saved = loadFormFromStorage();
    return saved || [];
  });
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const selectedField = fields.find((f) => f.id === selectedFieldId);

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
  }, [fields]);

  const handleTestForm = useCallback(() => {
    if (fields.length === 0) {
      return;
    }
    saveFormToStorage(fields);
    router.push("/form");
  }, [fields, router]);

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

  return (
    <div className="container mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="mb-2 font-bold text-3xl">Form Builder</h1>
        <p className="text-muted-foreground text-sm">
          Create a form and test it with AI assistance
        </p>
      </div>

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
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="url">URL</SelectItem>
                      <SelectItem value="checkbox">Checkbox</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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
                      handleUpdateField(selectedField.id, { required: checked })
                    }
                  />
                </div>

                {(selectedField.type === "text" ||
                  selectedField.type === "email" ||
                  selectedField.type === "phone" ||
                  selectedField.type === "url") && (
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
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground text-sm">
                Select a field to configure it
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-end gap-2">
        <Button
          disabled={fields.length === 0}
          onClick={handleSave}
          variant="outline"
        >
          Save Form
        </Button>
        <Button disabled={fields.length === 0} onClick={handleTestForm}>
          Test Form with AI
        </Button>
      </div>
    </div>
  );
}
