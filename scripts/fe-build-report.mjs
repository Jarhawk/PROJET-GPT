import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const execAsync = promisify(exec);
const rootDir = path.resolve(__dirname, '..');
const cmds = ['npm run typecheck', 'npm run lint', 'npm run build'];

const results = [];
for (const cmd of cmds) {
  try {
    const { stdout, stderr } = await execAsync(cmd, {
      cwd: rootDir,
      env: { ...process.env, FORCE_COLOR: '0' },
      maxBuffer: 10 * 1024 * 1024,
    });
    results.push({ cmd, ok: true, stdout, stderr });
  } catch (err) {
    results.push({ cmd, ok: false, stdout: err.stdout, stderr: err.stderr });
  }
}

async function countFiles(dir) {
  let count = 0;
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        count += await countFiles(full);
      } else {
        count++;
      }
    }
  } catch {
    // ignore if dir does not exist
  }
  return count;
}

const today = new Date().toISOString().split('T')[0];
let md = `# Rapport build front ${today}\n\n`;
md += '## Résumé\n';
for (const r of results) {
  if (r.ok) {
    if (r.cmd.includes('build')) {
      const files = await countFiles(path.join(rootDir, 'dist'));
      r.fileCount = files;
      md += `- \`${r.cmd}\`: OK (${files} fichiers dans dist/)\n`;
    } else {
      md += `- \`${r.cmd}\`: OK\n`;
    }
  } else {
    md += `- \`${r.cmd}\`: KO\n`;
  }
}
md += '\n## Détails\n';
for (const r of results) {
  md += `### ${r.cmd}\n`;
  if (r.ok) {
    if (r.cmd.includes('build')) {
      md += `- ${r.fileCount} fichiers dans \`dist/\`\n\n`;
    } else {
      md += '- OK\n\n';
    }
  } else {
    const output = (r.stdout + r.stderr).split('\n').filter(Boolean);
    for (const line of output) {
      md += `- ${line}\n`;
    }
    md += '\n';
  }
}

const reportPath = path.join(rootDir, `FRONT_BUILD_${today}.md`);
await fs.writeFile(reportPath, md);
console.log(`Rapport écrit dans ${reportPath}`);
