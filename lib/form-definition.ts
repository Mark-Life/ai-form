export type FieldType = "text" | "email" | "phone" | "url" | "checkbox";

export type ValidationRules = {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  patternMessage?: string;
};

export type FormFieldDefinition = {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  validation?: ValidationRules;
};

export type FormDefinition = FormFieldDefinition[];

const STORAGE_KEY = "ai-form-definition";

export function saveFormToStorage(formDef: FormDefinition): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(formDef));
}

export function loadFormFromStorage(): FormDefinition | null {
  if (typeof window === "undefined") {
    return null;
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return null;
  }
  try {
    return JSON.parse(stored) as FormDefinition;
  } catch {
    return null;
  }
}
