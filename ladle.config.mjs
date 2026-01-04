/**
 * Ladle configuration for component previews.
 * Scans story files only and mirrors our Next.js path alias "@" to project root.
 */
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  // Explicit globs (picomatch) to ensure stories are picked up on Windows
  stories: [
    "./components/**/*.stories.tsx",
    "./components/**/*.stories.ts",
  ],
  viteConfig: {
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./"),
      },
    },
  },
};
