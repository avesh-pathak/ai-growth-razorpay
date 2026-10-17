import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // The isometric figures (the iso kit, the live scene and its story clock)
    // are deliberately imperative: a rAF loop paints the DOM through a ref
    // bag instead of React state. The React Compiler rules assume
    // render-driven components and would push this 60 fps hot path back
    // through the reconciler, so they stay off for these modules only.
    files: [
      "components/iso/**/*.{ts,tsx}",
      "components/purchase-flow/scene/**/*.{ts,tsx}",
      "components/purchase-flow/replay/**/*.{ts,tsx}",
      "lib/purchase-flow/useStory.ts",
    ],
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
