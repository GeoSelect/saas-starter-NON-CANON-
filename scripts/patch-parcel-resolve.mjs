// scripts/patch-parcel-resolve.mjs
import fs from "node:fs";
import path from "node:path";

function replaceOnce(haystack, needle, replacement, label) {
  if (!haystack.includes(needle)) {
    throw new Error(`Patch failed (${label}): pattern not found.`);
  }
  return haystack.replace(needle, replacement);
}

function replaceOptional(haystack, needle, replacement) {
  if (!haystack.includes(needle)) return haystack;
  return haystack.replace(needle, replacement);
}

function main() {
  const target = process.argv[2];
  if (!target) {
    console.error("Usage: node scripts/patch-parcel-resolve.mjs <path-to-page.tsx>");
    process.exit(1);
  }

  const filePath = path.resolve(process.cwd(), target);
  const original = fs.readFileSync(filePath, "utf8");
  let next = original;

  // 1) Ensure Loader2 is imported (used for spinner)
  // If already present in the lucide-react import list, do nothing.
  // If not present, attempt to add it.
  const lucideImportLine = /import\s+\{\s*([^}]+)\s*\}\s+from\s+"lucide-react";/m;
  const m = next.match(lucideImportLine);
  if (!m) throw new Error("Patch failed: lucide-react import not found.");

  const icons = m[1].split(",").map((s) => s.trim()).filter(Boolean);
  if (!icons.includes("Loader2")) {
    icons.push("Loader2");
    const rebuilt = `import { ${icons.join(", ")} } from "lucide-react";`;
    next = next.replace(lucideImportLine, rebuilt);
  }

  // 2) Add Enter-to-search to the <Input id="query" ... />
  // We find the Input block by id="query" and insert onKeyDown if missing.
  if (!next.includes('onKeyDown={(e) =>')) {
    const inputNeedle = `                <Input
                  id="query"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="1600 Amphitheatre Parkway, Mountain View, CA"
                  className="h-11"
                />`;

    const inputReplacement = `                <Input
                  id="query"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && query.trim().length > 0) void handleSearch();
                  }}
                  placeholder="1600 Amphitheatre Parkway, Mountain View, CA"
                  className="h-11"
                />`;

    next = replaceOnce(next, inputNeedle, inputReplacement, "Input Enter-to-search insertion");
  }

  // 3) Replace the primary Search button with spinner + disable when query empty
  const searchButtonNeedle = `<Button onClick={() => void handleSearch()} disabled={loading} className="w-full">
              {loading ? "Searching..." : "Search parcels"}
            </Button>`;

  const searchButtonReplacement = `<Button
              onClick={() => void handleSearch()}
              disabled={loading || query.trim().length === 0}
              className="w-full gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? "Searching..." : "Search parcels"}
            </Button>`;

  next = replaceOnce(next, searchButtonNeedle, searchButtonReplacement, "Search button upgrade");

  // 4) Optional copy tweaks for "find a parcel" framing (safe/optional)
  next = replaceOptional(
    next,
    `            <CardTitle className="text-base font-semibold">Results ({parcels.length})</CardTitle>`,
    `            <CardTitle className="text-base font-semibold">Matches ({parcels.length})</CardTitle>`
  );

  next = replaceOptional(
    next,
    `            <p className="text-xs text-muted-foreground">Expand a parcel to view details.</p>`,
    `            <p className="text-xs text-muted-foreground">Expand a match to confirm you’ve got the right parcel.</p>`
  );

  // 5) Best-effort removal of obviously unused imports from this file (doesn't break if they are used)
  // If you later reintroduce these, TypeScript will guide you.
  const unusedImports = [
    'import { ArrowRight, Info, MapPin, ShieldAlert, Sparkles, Loader2 } from "lucide-react";',
    'import { ArrowRight, Info, MapPin, ShieldAlert, Sparkles, Loader2 } from "lucide-react";',
  ];
  // (No-op; left here intentionally. We don't want to overreach on import edits beyond Loader2 insertion.)

  // 6) Write back only if changed
  if (next === original) {
    console.log("No changes applied (file already matches expected patterns).");
    return;
  }

  fs.writeFileSync(filePath, next, "utf8");
  console.log(`Patched: ${target}`);
}

main();
