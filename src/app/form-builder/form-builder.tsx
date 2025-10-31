"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { FormDefinition, FormFieldDefinition } from "@/lib/utils";
import { saveFormToStorage } from "@/lib/utils";
import { FieldConfig } from "./field-config";
import { FieldList } from "./field-list";
import type { FormBuilderProps } from "./types";
import { DEFAULT_FIELD, generateFieldId } from "./utils";

export function FormBuilder({
  open,
  onOpenChange,
  initialFields,
  onSave,
}: FormBuilderProps) {
  const [fields, setFields] = useState<FormDefinition>(initialFields);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(
    initialFields.length > 0 ? (initialFields[0]?.id ?? null) : null
  );
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

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (newOpen) {
        setFields(initialFields);
        setSelectedFieldId(
          initialFields.length > 0 ? (initialFields[0]?.id ?? null) : null
        );
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
          <FieldList
            draggedFieldId={draggedFieldId}
            dragOverIndex={dragOverIndex}
            fields={fields}
            onAddField={handleAddField}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            onMoveField={handleMoveField}
            onRemoveField={handleRemoveField}
            onSelectField={setSelectedFieldId}
            selectedFieldId={selectedFieldId}
          />

          <FieldConfig
            field={selectedField ?? null}
            onUpdateField={handleUpdateField}
          />
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
