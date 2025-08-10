// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import fs from "fs";
import path from "path";

const reports = {
  missingId: [],
  missingHtmlFor: [],
  missingAriaInvalid: [],
  numberNoStep: [],
  submitNoType: [],
};

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) {
      const content = fs.readFileSync(full, "utf8");
      if (/(<input|<select|<textarea)(?![^>]*id=)/i.test(content)) reports.missingId.push(full);
      if (/<label(?![^>]*htmlFor=)/i.test(content)) reports.missingHtmlFor.push(full);
      if (/<p[^>]*text-red-600/i.test(content) && !/aria-invalid/i.test(content)) reports.missingAriaInvalid.push(full);
      if (/<input[^>]*type="number"(?![^>]*step="any")(?![^>]*inputMode)/i.test(content)) reports.numberNoStep.push(full);
      if (/<button(?![^>]*type="submit")[^>]*submit/i.test(content)) reports.submitNoType.push(full);
    }
  }
}

walk(path.resolve("src"));

const lines = [];
lines.push("# Forms audit\n");
for (const [key, files] of Object.entries(reports)) {
  lines.push(`## ${key}\n`);
  if (files.length) {
    files.forEach(f => lines.push(`- ${f}`));
  } else {
    lines.push("- aucun");
  }
  lines.push("");
}

fs.mkdirSync("REPORTS", { recursive: true });
fs.writeFileSync("REPORTS/FORMS_AUDIT.md", lines.join("\n"));

console.log("Form audit written to REPORTS/FORMS_AUDIT.md");

