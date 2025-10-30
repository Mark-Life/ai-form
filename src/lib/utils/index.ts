import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// biome-ignore lint/performance/noBarrelFile: its ok for this project
export * from "./form-builder-utils";
export * from "./form-definition";
export * from "./schema-utils";
export * from "./tool-message-utils";
