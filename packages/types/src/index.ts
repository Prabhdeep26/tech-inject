export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export type ComponentAccessLevel = "free" | "premium";
export type ComponentStatus = "draft" | "published";

export interface ComponentPropDefinition {
  name: string;
  type: string;
  description?: string;
  defaultValue?: unknown;
  required?: boolean;
}

export type ComponentPropsSchema = Record<string, ComponentPropDefinition> | Record<string, unknown>;

export interface Component extends BaseEntity {
  slug: string;
  name: string;
  description: string;
  category: string;
  version: string;
  accessLevel: ComponentAccessLevel;
  status: ComponentStatus;
  props: ComponentPropsSchema;
  dependencies: string[];
}

export interface User {
  id: string;
  email: string;
  isAdmin: boolean;
  isPremium: boolean;
}

export interface ComponentBundleFile {
  path: string;
  content: string;
}

export interface ComponentBundle {
  files: ComponentBundleFile[];
  meta: Record<string, unknown>;
}
