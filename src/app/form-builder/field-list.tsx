"use client";

import { GripVerticalIcon, PlusIcon, TrashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { FormDefinition, FormFieldDefinition } from "@/lib/utils";

type FieldListProps = {
  fields: FormDefinition;
  selectedFieldId: string | null;
  draggedFieldId: string | null;
  dragOverIndex: number | null;
  onAddField: () => void;
  onSelectField: (id: string) => void;
  onRemoveField: (id: string) => void;
  onMoveField: (id: string, direction: "up" | "down") => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
};

export function FieldList({
  fields,
  selectedFieldId,
  draggedFieldId,
  dragOverIndex,
  onAddField,
  onSelectField,
  onRemoveField,
  onMoveField,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: FieldListProps) {
  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Fields</CardTitle>
          <Button onClick={onAddField} size="icon" variant="outline">
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
                onDragOver(e, index);
              }}
              onDrop={(e) => {
                e.preventDefault();
                onDrop(e, index);
              }}
            >
              <button
                className="cursor-move text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                draggable
                onClick={() => onSelectField(field.id)}
                onDragEnd={onDragEnd}
                onDragStart={() => onDragStart(field.id)}
                type="button"
              >
                <GripVerticalIcon className="size-4" />
              </button>
              <button
                className="flex-1 text-left"
                onClick={() => onSelectField(field.id)}
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
                    onClick={() => onMoveField(field.id, "up")}
                    size="icon"
                    variant="ghost"
                  >
                    ↑
                  </Button>
                )}
                {index < fields.length - 1 && (
                  <Button
                    className="size-6"
                    onClick={() => onMoveField(field.id, "down")}
                    size="icon"
                    variant="ghost"
                  >
                    ↓
                  </Button>
                )}
                <Button
                  className="size-6 text-destructive"
                  onClick={() => onRemoveField(field.id)}
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
  );
}

