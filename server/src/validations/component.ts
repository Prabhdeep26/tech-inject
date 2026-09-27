import { z } from "zod";

export const createComponentSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100, "Slug cannot exceed 100 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase alphanumeric with hyphens (e.g. 'pricing-card')"
    ),
  name: z.string().min(1, "Name is required").max(120, "Name cannot exceed 120 characters").trim(),
  description: z
    .string()
    .min(1, "Description is required")
    .max(2000, "Description cannot exceed 2000 characters")
    .trim(),
  category: z
    .string()
    .min(1, "Category is required")
    .max(60, "Category cannot exceed 60 characters")
    .trim(),
  version: z
    .string()
    .regex(
      /^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.]+)?$/,
      "Version must follow semantic versioning format (e.g. '1.0.0')"
    )
    .default("1.0.0"),
  accessLevel: z.enum(["free", "premium"]).default("free"),
  status: z.enum(["draft", "published"]).default("draft"),
  props: z.record(z.string(), z.unknown()).default({}),
  dependencies: z.array(z.string()).default([]),
});

export const updateComponentSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  name: z.string().min(1).max(120).trim().optional(),
  description: z.string().min(1).max(2000).trim().optional(),
  category: z.string().min(1).max(60).trim().optional(),
  version: z
    .string()
    .regex(/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.]+)?$/)
    .optional(),
  accessLevel: z.enum(["free", "premium"]).optional(),
  status: z.enum(["draft", "published"]).optional(),
  props: z.record(z.string(), z.unknown()).optional(),
  dependencies: z.array(z.string()).optional(),
});

export type CreateComponentInput = z.infer<typeof createComponentSchema>;
export type UpdateComponentInput = z.infer<typeof updateComponentSchema>;
