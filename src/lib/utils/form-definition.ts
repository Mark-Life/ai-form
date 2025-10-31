export type FieldType =
  | "text"
  | "email"
  | "phone"
  | "url"
  | "checkbox"
  | "select"
  | "multiSelect"
  | "number"
  | "date"
  | "time"
  | "textarea"
  | "file"
  | "range";

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
  options?: string[];
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

/**
 * Initialize localStorage with demo schema if it doesn't exist
 * Returns true if initialization happened, false if data already exists
 */
export function initializeFormStorage(
  demoFormDefinition: FormDefinition
): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const existing = loadFormFromStorage();
  if (existing !== null) {
    return false;
  }
  saveFormToStorage(demoFormDefinition);
  return true;
}
