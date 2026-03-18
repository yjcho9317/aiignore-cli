import { describe, it, expect } from 'vitest';
import { resolveToolId, resolveToolIds } from '../src/utils/aliases.js';

describe('resolveToolId', () => {
  it('resolves known aliases', () => {
    expect(resolveToolId('cursor')).toBe('cursor');
    expect(resolveToolId('claude')).toBe('claudeCode');
    expect(resolveToolId('claude-code')).toBe('claudeCode');
    expect(resolveToolId('jb')).toBe('jetbrains');
    expect(resolveToolId('codeium')).toBe('windsurf');
  });

  it('is case insensitive', () => {
    expect(resolveToolId('Cursor')).toBe('cursor');
    expect(resolveToolId('CLAUDE')).toBe('claudeCode');
  });

  it('returns undefined for unknown input', () => {
    expect(resolveToolId('vscode')).toBeUndefined();
    expect(resolveToolId('')).toBeUndefined();
  });
});

describe('resolveToolIds', () => {
  it('resolves comma-separated tools', () => {
    const result = resolveToolIds('cursor,gemini');
    expect(result.ids).toEqual(['cursor', 'geminiCli']);
    expect(result.invalid).toEqual([]);
  });

  it('trims whitespace', () => {
    const result = resolveToolIds('cursor , gemini');
    expect(result.ids).toEqual(['cursor', 'geminiCli']);
  });

  it('deduplicates aliases for the same tool', () => {
    const result = resolveToolIds('claude,claude-code,claudecode');
    expect(result.ids).toEqual(['claudeCode']);
  });

  it('collects invalid tool names', () => {
    const result = resolveToolIds('cursor,fakeTool,gemini');
    expect(result.ids).toEqual(['cursor', 'geminiCli']);
    expect(result.invalid).toEqual(['fakeTool']);
  });

  it('handles single tool', () => {
    const result = resolveToolIds('cursor');
    expect(result.ids).toEqual(['cursor']);
    expect(result.invalid).toEqual([]);
  });

  it('handles all invalid', () => {
    const result = resolveToolIds('foo,bar');
    expect(result.ids).toEqual([]);
    expect(result.invalid).toEqual(['foo', 'bar']);
  });
});
