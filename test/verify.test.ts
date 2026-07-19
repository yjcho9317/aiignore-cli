import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { verifyCommand } from '../src/commands/verify.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

describe('verifyCommand', () => {
  let tmpDir: string;
  let cwd: string;
  let logs: string[];
  let exitCodes: number[];
  let logSpy: ReturnType<typeof vi.spyOn>;
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aiignore-verify-'));
    cwd = process.cwd();
    process.chdir(tmpDir);
    logs = [];
    exitCodes = [];
    logSpy = vi.spyOn(console, 'log').mockImplementation((msg?: unknown) => {
      logs.push(String(msg ?? ''));
    });
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      exitCodes.push(code ?? 0);
      return undefined as never;
    }) as never);
  });

  afterEach(() => {
    process.chdir(cwd);
    logSpy.mockRestore();
    exitSpy.mockRestore();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function writeClaudeSettings(deny: string[]): void {
    const dir = path.join(tmpDir, '.claude');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'settings.json'), JSON.stringify({ permissions: { deny } }));
  }

  function jsonResults(): Array<Record<string, unknown>> {
    return JSON.parse(logs.join('\n'));
  }

  it('reports Claude Code as unprotected when settings.json has no Read deny', () => {
    // Bug 1: a settings.json that merely exists (empty deny) must NOT read as protected.
    writeClaudeSettings([]);
    verifyCommand({ json: true });
    const claude = jsonResults().find((r) => r.tool === 'Claude Code');
    expect(claude?.status).toBe('none');
  });

  it('reports Claude Code as configured once a Read deny exists', () => {
    writeClaudeSettings(['Read(.env)', 'Read(*.pem)', 'Read(*.key)', 'Read(credentials.json)']);
    verifyCommand({ json: true });
    const claude = jsonResults().find((r) => r.tool === 'Claude Code');
    expect(claude?.status).toBe('configured');
    expect(claude?.missingPatterns).toEqual([]);
  });

  it('treats Copilot as guide-only and does not fail --ci on it', () => {
    // Bug 3: a repo with only Copilot detected must be able to pass --ci.
    fs.mkdirSync(path.join(tmpDir, '.github'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, '.github', 'copilot-instructions.md'), '');
    verifyCommand({ json: true });
    const copilot = jsonResults().find((r) => r.tool === 'GitHub Copilot');
    expect(copilot?.status).toBe('guide');

    verifyCommand({ ci: true, quiet: true });
    expect(exitCodes).not.toContain(1);
  });

  it('composes --json with --ci: prints JSON and still exits 1 when unprotected', () => {
    // Bug 2: --json used to return before the exit gate ran.
    fs.mkdirSync(path.join(tmpDir, '.cursor'), { recursive: true }); // detected, no .cursorignore
    verifyCommand({ json: true, ci: true });
    expect(() => jsonResults()).not.toThrow();
    expect(jsonResults().find((r) => r.tool === 'Cursor')?.status).toBe('none');
    expect(exitCodes).toContain(1);
  });

  it('--ci passes but --strict fails when a file exists with missing critical patterns', () => {
    // Presence (ci) vs completeness (strict).
    fs.writeFileSync(path.join(tmpDir, '.cursorignore'), '.env\n'); // exists, missing *.pem/*.key/credentials.json
    fs.mkdirSync(path.join(tmpDir, '.cursor'), { recursive: true });

    verifyCommand({ ci: true, quiet: true });
    expect(exitCodes).not.toContain(1);

    exitCodes = [];
    verifyCommand({ strict: true, quiet: true });
    expect(exitCodes).toContain(1);
  });

  it('does not count a commented pattern as protection', () => {
    // Bug 6: `# .env` and `.env.example` must not satisfy the `.env` requirement.
    fs.mkdirSync(path.join(tmpDir, '.cursor'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, '.cursorignore'), '# .env\n.env.example\n');
    verifyCommand({ json: true });
    const cursor = jsonResults().find((r) => r.tool === 'Cursor');
    expect(cursor?.missingPatterns).toContain('.env');
  });

  it('honors .aiignorerc tool lock instead of detection', () => {
    // Bug 7: verify previously ignored .aiignorerc.
    fs.writeFileSync(path.join(tmpDir, '.aiignorerc'), JSON.stringify({ tools: ['jetbrains'] }));
    verifyCommand({ json: true });
    const tools = jsonResults().map((r) => r.tool);
    expect(tools).toEqual(['JetBrains AI']);
  });
});
