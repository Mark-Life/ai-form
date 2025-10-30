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
});

export type FormData = z.infer<typeof formSchema>;
