import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
    {
        ignores: [
            "dist/**",
            "node_modules/**",
            "eslint.config.mjs",
            "jest.config.js",
        ],
    },
    {
        files: ["**/*.ts"],
        extends: [
            js.configs.recommended,
            tseslint.configs.recommendedTypeChecked,
        ],
        languageOptions: {
            parserOptions: {
                projectService: true,
            },
        },
        rules: {
            "no-console": "warn",
            // "@typescript-eslint/no-misused-promises": "off",
        },
    },
);
