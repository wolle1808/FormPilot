import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    /* Integrationstests (RLS) überspringen sich selbst, wenn keine
       Supabase-Testumgebung konfiguriert ist — siehe tests/integration/rls.test.ts */
    testTimeout: 30_000,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
