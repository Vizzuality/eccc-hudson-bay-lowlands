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
      reporter: ["text", "json-summary"],
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: [
        // Next.js framework files
        "src/**/layout.tsx",
        "src/**/loading.tsx",
        "src/**/error.tsx",
        "src/**/not-found.tsx",
        "src/app/**/page.tsx",
        "src/app/**/route.ts",
        "src/app/**/providers.tsx",

        // UI library (shadcn)
        "src/components/ui/**",

        // Test & story files
        "src/**/*.stories.tsx",
        "src/**/*.test.ts",
        "src/**/*.test.tsx",
        "**/tests/helpers/**",

        // Declarative config / no logic
        "src/env.ts",
        "src/proxy.ts",
        "src/types.ts",
        "src/lib/utils.ts",
        "src/i18n/**",
        "src/**/constants.ts",

        // Pure UI / no testable logic
        "src/app/[locale]/url-store.ts",
        "src/containers/data-layers/search/**",
        "src/containers/map/controls/search/**",
        "src/containers/map/controls/settings/index.tsx",
        "src/containers/map/legend/**",

        // Map-coupled components (better covered by E2E)
        "src/containers/map/index.tsx",
        "src/containers/map/controls/index.tsx",
        "src/containers/map/controls/zoom/**",
        "src/containers/map-sidebar/index.tsx",
      ],
      thresholds: {
        statements: 85,
        branches: 80,
        functions: 85,
        lines: 85,
      },
    },
  },
}));
