/// <reference types="vitest" />

import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => ({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    env: loadEnv(mode, process.cwd(), ""),
    coverage: {
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: [
        "src/**/layout.tsx",
        "src/**/loading.tsx",
        "src/**/error.tsx",
        "src/**/not-found.tsx",
        "src/components/ui/**",
        "src/**/*.stories.tsx",
        "src/**/*.test.ts",
        "src/**/*.test.tsx",
        "**/tests/helpers/**",
      ],
    },
  },
}));
