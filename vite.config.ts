import { defineConfig } from "vite-plus";

export default defineConfig({
  server: {},
  build: {},
  preview: {},
  create: {},
  run: {},
  fmt: {
    semi: false,
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
    rules: {
      "no-explicit-any": "warn",
    },
  },

  check: {},
  test: {},
  pack: {},
  staged: {},
});
