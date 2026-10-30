"use client";

import { createContext, useContext } from "react";
import type { Category } from "./types";

// The visible categories, so captions anywhere on the site can show a category's name by slug.
export const CategoriesContext = createContext<Category[]>([]);

export function useCategories() {
  return useContext(CategoriesContext);
}

export function useCategoryLabel() {
  const categories = useCategories();
  return (slug: string | null) => categories.find((c) => c.slug === slug)?.label ?? "";
}
