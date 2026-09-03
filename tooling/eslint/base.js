import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

export const baseConfig = tseslint.config(
  {
    ignores: ["dist/**", ".next/**", "node_modules/**", "coverage/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
);

export default baseConfig;
