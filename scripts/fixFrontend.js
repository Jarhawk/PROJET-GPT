#!/usr/bin/env node
/* eslint-disable no-console */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import glob from "glob";
import * as recast from "recast";
import traverse from "@babel/traverse";
import * as parser from "@babel/parser";
import * as t from "@babel/types";

const projectRoot = process.cwd();
const SRC = path.resolve(projectRoot, "src");
const TEST_DIRS = [
  path.resolve(projectRoot, "test"),
  path.resolve(projectRoot, "__tests__"),
  path.resolve(projectRoot, "tests"),
  path.resolve(projectRoot, "src/__tests__"),
];
const MOCK_DIRS = [
  path.resolve(projectRoot, "test/__mocks__"),
  path.resolve(projectRoot, "__mocks__"),
  path.resolve(projectRoot, "src/__mocks__"),
];
const REPORT = path.resolve(projectRoot, "REPORTS/FIX_FRONTEND.md");
const DRY = !process.argv.includes("--write");

fs.mkdirSync(path.dirname(REPORT), { recursive: true });

const report = {
  time: new Date().toISOString(),
  dryRun: DRY,
  a11yFixed: [],
  a11ySkipped: [],
  mocksAligned: [],
  mocksCreated: [],
  mocksChanged: [],
  mocksWarnings: [],
  duplicatesFixed: [],
  duplicatesWarnings: [],
  errors: [],
};

function read(file) {
  return fs.readFileSync(file, "utf8");
}
function write(file, content) {
  if (!DRY) fs.writeFileSync(file, content, "utf8");
}
function parse(code, filename) {
  return recast.parse(code, {
    parser: {
      parse(src) {
        return parser.parse(src, {
          sourceType: "module",
          plugins: [
            "jsx",
            "typescript",
            "classProperties",
            "decorators-legacy",
            "objectRestSpread",
            "dynamicImport",
            "importMeta",
            "topLevelAwait",
          ],
        });
      },
    },
  });
}
function print(ast) {
  return recast.print(ast).code;
}
function safeIdBase(str) {
  return (str || "")
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 30) || "field";
}
function genIdFromLabel(label, fallback = "fld") {
  const base = safeIdBase(label);
  const rand = Math.random().toString(36).slice(2, 6);
  return `${fallback}-${base}-${rand}`;
}

function isLabel(node) {
  return t.isJSXIdentifier(node.openingElement?.name, { name: "label" });
}
function isControl(node) {
  const name = node.openingElement?.name;
  if (!t.isJSXIdentifier(name)) return false;
  return ["input", "select", "textarea", "Input", "Select", "Textarea", "Checkbox"]
    .includes(name.name);
}
function getAttr(node, attrName) {
  const attrs = node.openingElement?.attributes || [];
  for (const a of attrs) {
    if (t.isJSXAttribute(a) && t.isJSXIdentifier(a.name, { name: attrName })) {
      return a;
    }
  }
  return null;
}
function setAttr(node, attrName, valueLiteral) {
  const existing = getAttr(node, attrName);
  const val = t.stringLiteral(valueLiteral);
  if (existing) {
    existing.value = t.stringLiteral(valueLiteral);
    return;
  }
  node.openingElement.attributes.push(t.jsxAttribute(t.jsxIdentifier(attrName), t.stringLiteral(valueLiteral)));
}
function getLabelText(node) {
  const children = node.children || [];
  const text = children
    .map((ch) => (t.isJSXText(ch) ? ch.value : ""))
    .join(" ")
    .trim();
  return text || "label";
}
function findNearestControl(astPath) {
  // Heuristique : chercher un contrôle dans les siblings ou descendants proches
  // 1) Descendants immédiats du même parent
  const parent = astPath.parentPath && astPath.parentPath.parentPath;
  if (parent && parent.node && t.isJSXElement(parent.node)) {
    const siblings = parent.node.children || [];
    for (const s of siblings) {
      if (t.isJSXElement(s) && isControl(s)) return s;
    }
  }
  // 2) Dans le label lui-même (cas label -> input imbriqué)
  const node = astPath.node;
  const inner = (node.children || []).find((c) => t.isJSXElement(c) && isControl(c));
  if (inner) return inner;

  return null;
}

// A) Corriger labels/id
function fixA11yInFile(file) {
  const code = read(file);
  const ast = parse(code, file);
  let changed = false;

  recast.types.visit(ast, {
    visitJSXElement(pathEl) {
      try {
        const node = pathEl.node;
        if (isLabel(node)) {
          const labelAttr = getAttr(node, "htmlFor");
          let control = null;
          // Si label englobe un input -> sort le contrôle et lie via htmlFor/id
          control = findNearestControl(pathEl);
          if (control) {
            // Garantir un id sur le contrôle
            let idAttr = getAttr(control, "id");
            if (!idAttr) {
              const labelTxt = getLabelText(node);
              const newId = genIdFromLabel(labelTxt);
              setAttr(control, "id", newId);
              idAttr = getAttr(control, "id");
              changed = true;
            }
            const idVal = idAttr?.value && idAttr.value.value;
            if (idVal && !labelAttr) {
              setAttr(node, "htmlFor", idVal);
              changed = true;
              report.a11yFixed.push(`${file} → label/htmlFor ↔ #${idVal}`);
            }
          } else {
            // Aucun contrôle trouvé : on ne modifie pas le DOM structurel, on génère un id et on log
            report.a11ySkipped.push(`${file} → label sans contrôle voisin (${getLabelText(node)})`);
          }
        }

        // Si c’est un contrôle sans id mais avec un label voisin qui le référence indirectement
        if (isControl(node)) {
          let idAttr = getAttr(node, "id");
          if (!idAttr) {
            const newId = genIdFromLabel("field");
            setAttr(node, "id", newId);
            changed = true;
            report.a11yFixed.push(`${file} → control @id = ${newId}`);
          }
        }
      } catch (e) {
        report.errors.push(`${file} → A11y visit error: ${String(e)}`);
      }
      this.traverse(pathEl);
    },
  });

  if (changed) {
    const out = print(ast);
    write(file, out);
  }
}

// B) Aligner mocks de hooks sur exports réels
function listSourceFiles(dir) {
  return glob.sync("**/*.{js,jsx,ts,tsx}", {
    cwd: dir,
    ignore: ["**/node_modules/**", "**/dist/**", "**/build/**"],
    absolute: true,
  });
}

function getExportsOfFile(file) {
  const code = read(file);
  let ast;
  try {
    ast = parse(code, file);
  } catch (e) {
    report.mocksWarnings.push(`Parse failed (exports): ${file} → ${String(e)}`);
    return { named: new Set(), hasDefault: false };
  }
  const named = new Set();
  let hasDefault = false;

  recast.types.visit(ast, {
    visitExportNamedDeclaration(p) {
      const { node } = p;
      if (node.declaration) {
        if (t.isFunctionDeclaration(node.declaration) && node.declaration.id) {
          named.add(node.declaration.id.name);
        } else if (t.isVariableDeclaration(node.declaration)) {
          node.declaration.declarations.forEach((d) => {
            if (t.isIdentifier(d.id)) named.add(d.id.name);
          });
        }
      }
      if (node.specifiers) {
        node.specifiers.forEach((s) => {
          if (t.isExportSpecifier(s)) named.add(s.exported.name);
        });
      }
      this.traverse(p);
    },
    visitExportDefaultDeclaration(p) {
      hasDefault = true;
      this.traverse(p);
    },
  });

  return { named, hasDefault };
}

function ensureMockForHook(sourcePath) {
  // Ex: src/hooks/useAuth.(js|ts) → chercher mock sous test/__mocks__ ou __mocks__
  const rel = path.relative(projectRoot, sourcePath).replace(/\\/g, "/");
  const bn = path.basename(sourcePath).replace(/\.(jsx?|tsx?)$/, "");
  const isHook = /^use[A-Z]/.test(bn) || /\/hooks\//.test(rel);
  if (!isHook) return;

  const exp = getExportsOfFile(sourcePath);
  const mockFileCandidates = MOCK_DIRS.map((md) => path.resolve(md, rel));
  let mockFile = null;

  for (const base of MOCK_DIRS) {
    const mf = path.resolve(base, rel).replace(/\.(jsx?|tsx?)$/, ".js");
    fs.mkdirSync(path.dirname(mf), { recursive: true });
    if (fs.existsSync(mf)) {
      mockFile = mf;
      break;
    }
    // First hit becomes target
    if (!mockFile) mockFile = mf;
  }

  let content = "";
  if (fs.existsSync(mockFile)) {
    content = read(mockFile);
  }

  const mockAst = parse(content || "/* auto-mock */\n", mockFile);
  let changed = false;

  // Wipe file and rebuild deterministic mock
  const lines = [];
  lines.push("// AUTO-GENERATED MOCK. Do not edit manually.");
  lines.push("export const __isMock = true;");

  // Named exports
  exp.named.forEach((name) => {
    // Heuristique simple pour les hooks : retourne un objet minimal
    if (/^use[A-Z]/.test(name)) {
      lines.push(`export const ${name} = vi.fn(() => ({ loading: false, mamaId: "00000000-0000-0000-0000-000000000000", user: { id: "u-mock" } }));`);
    } else {
      lines.push(`export const ${name} = vi.fn(() => ({}));`);
    }
  });

  // Default export
  if (exp.hasDefault) {
    lines.push(`const __default = vi.fn(() => ({}));`);
    lines.push(`export default __default;`);
  }

  const newContent = lines.join("\n") + "\n";
  if (newContent !== content) {
    changed = true;
    write(mockFile, newContent);
    if (content) report.mocksChanged.push(`${mockFile}`);
    else report.mocksCreated.push(`${mockFile}`);
  }

  const nameList = [...exp.named].join(", ") + (exp.hasDefault ? " + default" : "");
  report.mocksAligned.push(`${rel} → [${nameList}]`);
}

function fixMocks() {
  const hookFiles = listSourceFiles(SRC).filter((f) => /\/hooks\/|use[A-Z].*\.(j|t)sx?$/.test(f));
  hookFiles.forEach((f) => {
    try {
      ensureMockForHook(f);
    } catch (e) {
      report.mocksWarnings.push(`Mock align failed: ${f} → ${String(e)}`);
    }
  });

  // Assure que vitest a vi global
  const setupCandidates = [
    path.resolve(projectRoot, "test/setupTests.ts"),
    path.resolve(projectRoot, "test/setupTests.js"),
    path.resolve(projectRoot, "vitest.setup.ts"),
    path.resolve(projectRoot, "vitest.setup.js"),
  ];
  for (const s of setupCandidates) {
    if (fs.existsSync(s)) {
      const code = read(s);
      if (!/from\s+['"]vitest['"]/.test(code) || !/\bvi\b/.test(code)) {
        const patched = `import { vi } from "vitest";\n${code}`;
        write(s, patched);
      }
      break;
    }
  }
}

// C) Corriger doublons d’identifiants
function fixDuplicatesInFile(file) {
  const code = read(file);
  let ast;
  try {
    ast = parse(code, file);
  } catch (e) {
    report.duplicatesWarnings.push(`Parse failed: ${file} → ${String(e)}`);
    return;
  }
  let changed = false;

  // Map scope → names counts
  traverse(ast.program, {
    Scope(path) {
      const bindings = path.scope.getAllBindings();
      Object.entries(bindings).forEach(([name, binding]) => {
        const dupDecls = binding.constantViolations
          ? binding.constantViolations.filter((v) => t.isVariableDeclarator(v.node) || t.isFunctionDeclaration(v.node))
          : [];
        // On détecte les déclarations multiples dans le même scope en scannant les nodes
      });
    },
  });

  // Stratégie simple : repérer double déclarations au même niveau (const/let/var même nom)
  const seen = new Map(); // name -> first decl path
  recast.types.visit(ast, {
    visitVariableDeclarator(p) {
      try {
        const { node } = p;
        if (t.isIdentifier(node.id)) {
          const name = node.id.name;
          const key = `${name}@@${p.scope?.depth || 0}`;
          if (seen.has(key)) {
            // doublon détecté
            const prev = seen.get(key);
            // Si initializers identiques stringifiés -> supprimer cette déclaration
            const prevStr = recast.print(prev.parentPath.node).code;
            const currStr = recast.print(p.parentPath.node).code;
            if (prevStr === currStr) {
              // remove current whole declarator or declaration if single
              const decl = p.parentPath.node;
              if (decl.declarations.length === 1) {
                p.parentPath.prune();
              } else {
                p.prune();
              }
              changed = true;
              report.duplicatesFixed.push(`${file} → removed duplicated '${name}'`);
            } else {
              // Renommer de façon sécurisée (dans ce fichier seulement)
              const newName = `${name}_${Math.random().toString(36).slice(2, 5)}`;
              // rename occurrences confined to this declarator's references
              // (simple: rename only the declarator id)
              node.id.name = newName;
              changed = true;
              report.duplicatesFixed.push(`${file} → renamed '${name}' → '${newName}'`);
            }
          } else {
            seen.set(key, p);
          }
        }
      } catch (e) {
        report.duplicatesWarnings.push(`${file} → duplicate pass error: ${String(e)}`);
      }
      this.traverse(p);
    },
  });

  if (changed) {
    const out = print(ast);
    write(file, out);
  }
}

// MAIN
function main() {
  console.log(DRY ? "🔎 Dry-run mode" : "✍️  Write mode");

  // A) A11y fix
  const jsxFiles = listSourceFiles(SRC).filter((f) => /\.(jsx?|tsx?)$/.test(f));
  jsxFiles.forEach((f) => {
    try {
      fixA11yInFile(f);
    } catch (e) {
      report.errors.push(`${f} → A11y error: ${String(e)}`);
    }
  });

  // B) Mocks alignment
  try {
    fixMocks();
  } catch (e) {
    report.errors.push(`Mocks phase error: ${String(e)}`);
  }

  // C) Duplicates
  jsxFiles.forEach((f) => {
    try {
      fixDuplicatesInFile(f);
    } catch (e) {
      report.errors.push(`${f} → Duplicate error: ${String(e)}`);
    }
  });

  // Report
  const lines = [];
  lines.push("# FIX FRONTEND REPORT");
  lines.push("");
  lines.push(`- date: ${report.time}`);
  lines.push(`- dryRun: ${report.dryRun}`);
  lines.push("");
  lines.push("## A11y (labels/ids)");
  lines.push(`- fixed: ${report.a11yFixed.length}`);
  report.a11yFixed.slice(0, 500).forEach((x) => lines.push(`  - ${x}`));
  if (report.a11ySkipped.length) {
    lines.push(`- skipped (no nearby control): ${report.a11ySkipped.length}`);
    report.a11ySkipped.slice(0, 200).forEach((x) => lines.push(`  - ${x}`));
  }
  lines.push("");
  lines.push("## Hooks mocks");
  lines.push(`- aligned: ${report.mocksAligned.length}`);
  lines.push(`- created: ${report.mocksCreated.length}`);
  lines.push(`- changed: ${report.mocksChanged.length}`);
  if (report.mocksWarnings.length) {
    lines.push(`- warnings: ${report.mocksWarnings.length}`);
    report.mocksWarnings.slice(0, 200).forEach((x) => lines.push(`  - ${x}`));
  }
  lines.push("");
  lines.push("## Duplicate identifiers");
  lines.push(`- fixed: ${report.duplicatesFixed.length}`);
  if (report.duplicatesWarnings.length) {
    lines.push(`- warnings: ${report.duplicatesWarnings.length}`);
    report.duplicatesWarnings.slice(0, 200).forEach((x) => lines.push(`  - ${x}`));
  }
  lines.push("");
  if (report.errors.length) {
    lines.push("## Errors");
    report.errors.forEach((x) => lines.push(`- ${x}`));
  }

  write(REPORT, lines.join("\n") + "\n");
  console.log("📝 Report:", path.relative(projectRoot, REPORT));
  if (DRY) {
    console.log("ℹ️  Run with --write to apply changes.");
  }
}

main();
