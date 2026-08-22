import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // WA Gateway servers use CommonJS require() syntax — expected behavior
    "whatsapp-gateway/**",
    "whatsapp-gateway-new/**",
  ]),
  {
    rules: {
      // This rule generates many false positives for the common pattern of
      // calling async data-fetching functions within useEffect. Downgraded to "off".
      "react-hooks/set-state-in-effect": "off",
      // Downgrade from error to warning — any types in catch blocks are common
      "@typescript-eslint/no-explicit-any": "warn",
      // Downgrade to warning — unused vars in catch blocks are common
      "@typescript-eslint/no-unused-vars": "warn",
      // Downgrade react-hooks/purity — Date.now() is used in handlers, not pure render
      "react-hooks/purity": "warn",
      // Downgrade react-hooks/immutability
      "react-hooks/immutability": "warn",
    },
  },
]);

export default eslintConfig;
