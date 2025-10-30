import { z } from "zod";

export const formSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .trim()
    .max(50, "First name must be at most 50 characters"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .trim()
    .max(50, "Last name must be at most 50 characters"),
  age: z.number().min(18, "You must be at least 18 years old"),
  email: z.email("Invalid email address"),
  website: z.url(
    "Invalid website URL, it should start with http:// or https://"
  ),
});

export type FormData = z.infer<typeof formSchema>;
