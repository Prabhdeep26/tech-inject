import { config } from "@tech-inject/config";
import { theme } from "@tech-inject/ui-theme";
import type { BaseEntity } from "@tech-inject/types";

export interface CatalogueItem extends BaseEntity {
  title: string;
  sku: string;
}

export const catalogueApp = {
  name: "catalogue",
  version: config.version,
  themePrimary: theme.colors.primary
};

export { App } from "./App";
