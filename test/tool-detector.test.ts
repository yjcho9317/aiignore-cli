import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { detectTools, ALL_TOOL_IDS } from '../src/scanners/tool-detector.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

describe('detectTools', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aiignore-detect-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('detects cursor by .cursor/ directory', () => {
    fs.mkdirSync(path.join(tmpDir, '.cursor'));
    const tools = detectTools(tmpDir);
    const cursor = tools.find((t) => t.id === 'cursor');
    expect(cursor?.detected).toBe(true);
    expect(cursor?.signals).toContain('.cursor/');
  });

  it('detects claude code by .claude/ directory', () => {
    fs.mkdirSync(path.join(tmpDir, '.claude'));
    const tools = detectTools(tmpDir);
    const claude = tools.find((t) => t.id === 'claudeCode');
    expect(claude?.detected).toBe(true);
  });

  it('detects jetbrains by .idea/ directory', () => {
    fs.mkdirSync(path.join(tmpDir, '.idea'));
    const tools = detectTools(tmpDir);
    const jb = tools.find((t) => t.id === 'jetbrains');
    expect(jb?.detected).toBe(true);
  });

  it('returns no detections for empty directory', () => {
    const tools = detectTools(tmpDir);
    const detected = tools.filter((t) => t.detected);
    expect(detected).toHaveLength(0);
  });

  it('detects multiple tools simultaneously', () => {
    fs.mkdirSync(path.join(tmpDir, '.cursor'));
    fs.mkdirSync(path.join(tmpDir, '.claude'));
    fs.writeFileSync(path.join(tmpDir, '.geminiignore'), '');
    const tools = detectTools(tmpDir);
    const detected = tools.filter((t) => t.detected);
    expect(detected.length).toBeGreaterThanOrEqual(3);
  });

  it('ALL_TOOL_IDS contains all tools', () => {
    expect(ALL_TOOL_IDS).toContain('cursor');
    expect(ALL_TOOL_IDS).toContain('claudeCode');
    expect(ALL_TOOL_IDS).toContain('copilot');
    expect(ALL_TOOL_IDS).toContain('geminiCli');
    expect(ALL_TOOL_IDS).toContain('jetbrains');
    expect(ALL_TOOL_IDS).toContain('windsurf');
    expect(ALL_TOOL_IDS).toContain('aider');
    expect(ALL_TOOL_IDS).toContain('cline');
    expect(ALL_TOOL_IDS).toContain('roo');
    expect(ALL_TOOL_IDS).toHaveLength(9);
  });
});
