#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { getConnection } from '../src/db';

dotenv.config();

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const filesArg = args.find(a => a.startsWith('--files='));

  const sqlDir = path.resolve(__dirname, '..', 'sql');
  let files: string[] = [];
  if (filesArg) {
    files = filesArg.replace('--files=', '').split(',').map(s => s.trim());
  } else {
    files = fs.readdirSync(sqlDir).filter(f => f.toLowerCase().endsWith('.sql')).sort();
  }

  console.log('SQL runner — directory:', sqlDir);
  console.log('Execution mode:', apply ? 'APPLY (will commit)' : 'DRY-RUN (no commits)');
  console.log('Files to run:', files.join(', '));

  const conn = await getConnection();
  try {
    // We'll run everything with manual control of commit/rollback.
    for (const f of files) {
      const filePath = path.join(sqlDir, f);
      if (!fs.existsSync(filePath)) {
        console.warn('Skipping missing file:', filePath);
        continue;
      }

      console.log('\n--- Running file:', f, '---');
      const raw = fs.readFileSync(filePath, 'utf8');
      const parts = splitSqlPlusScript(raw);

      for (const [ix, part] of parts.entries()) {
        const stmt = preprocessPart(part, !apply);
        if (!stmt.trim()) continue;

        try {
          const execResult = await conn.execute(stmt, [], { autoCommit: false });
          if (execResult.rows) {
            console.log(`  [${ix + 1}] SELECT returned ${execResult.rows.length} rows`);
          } else if (typeof execResult.rowsAffected === 'number') {
            console.log(`  [${ix + 1}] rowsAffected=${execResult.rowsAffected}`);
          } else {
            console.log(`  [${ix + 1}] OK`);
          }
        } catch (err) {
          console.error(`  [${ix + 1}] ERROR executing statement:`, err);
          // On error stop processing this file and rethrow so we can rollback in dry-run or apply.
          throw err;
        }
      }
    }

    if (apply) {
      await conn.commit();
      console.log('\nAll files executed. Changes COMMITTED.');
    } else {
      await conn.rollback();
      console.log('\nDry-run complete. All changes ROLLED BACK (no commits).');
    }
  } catch (err) {
    console.error('\nExecution aborted due to error. Performing rollback.');
    try { await conn.rollback(); } catch (e) { console.error('Rollback failed:', e); }
    process.exitCode = 1;
  } finally {
    try { await conn.close(); } catch (e) { /* ignore */ }
  }
}

function splitSqlPlusScript(content: string): string[] {
  // Split on lines that contain only a slash (/), which SQL*Plus uses to execute PL/SQL blocks.
  const lines = content.split(/\r?\n/);
  const parts: string[] = [];
  let buf: string[] = [];

  for (const line of lines) {
    if (line.trim() === '/') {
      parts.push(buf.join('\n'));
      buf = [];
    } else {
      buf.push(line);
    }
  }
  if (buf.length) parts.push(buf.join('\n'));
  return parts;
}

function preprocessPart(part: string, dryRun: boolean): string {
  let p = part;
  // Remove SQL*Plus commands that are not valid SQL (e.g., SET SERVEROUTPUT ON)
  p = p.split(/\r?\n/).filter(l => !/^\s*SET\b/i.test(l)).join('\n');

  if (dryRun) {
    // Disable COMMITs in dry-run: replace standalone COMMIT; lines
    p = p.replace(/^\s*COMMIT;?\s*$/gim, "/* COMMIT removed in dry-run */");
  }

  // Trim trailing semicolon that comes from scripts (SQL*Plus style)
  p = p.replace(/;\s*$/m, '');

  return p;
}

main().catch(err => { console.error('Fatal error:', err); process.exit(1); });
