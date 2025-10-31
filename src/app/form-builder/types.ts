import type { FormDefinition } from "@/lib/utils";

export type FormBuilderProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialFields: FormDefinition;
  onSave: (fields: FormDefinition) => void;
};
