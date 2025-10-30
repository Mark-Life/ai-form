import { z } from "zod";

const MAX_LENGTH = 50;
const MIN_AGE = 18;

export const formSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .trim()
    .max(MAX_LENGTH, "First name must be at most 50 characters"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .trim()
    .max(MAX_LENGTH, "Last name must be at most 50 characters"),
  age: z.number().min(MIN_AGE, "You must be at least 18 years old"),
  email: z.email("Invalid email address"),
  website: z.url("Invalid website URL, include protocol"),
});

export type FormData = z.infer<typeof formSchema>;
