import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { scanForSecrets } from '../src/scanners/secret-detector.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

describe('scanForSecrets', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aiignore-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('detects .env files', async () => {
    fs.writeFileSync(path.join(tmpDir, '.env'), 'SECRET=x');
    const result = await scanForSecrets(tmpDir);
    expect(result.foundFiles).toContain('.env');
  });

  it('detects key files', async () => {
    fs.writeFileSync(path.join(tmpDir, 'server.pem'), 'key');
    const result = await scanForSecrets(tmpDir);
    expect(result.foundFiles).toContain('server.pem');
  });

  it('returns default patterns when no gitignore', async () => {
    const result = await scanForSecrets(tmpDir);
    expect(result.patterns.length).toBeGreaterThan(0);
    expect(result.patterns).toContain('.env');
    expect(result.patterns).toContain('*.pem');
  });

  it('merges security-related gitignore patterns', async () => {
    fs.writeFileSync(path.join(tmpDir, '.gitignore'), '.env.production\nnode_modules/\n*.secret.yaml\n');
    const result = await scanForSecrets(tmpDir);
    expect(result.patterns).toContain('.env.production');
    expect(result.patterns).toContain('*.secret.yaml');
    expect(result.patterns).not.toContain('node_modules/');
  });

  it('ignores comments and blank lines in gitignore', async () => {
    fs.writeFileSync(path.join(tmpDir, '.gitignore'), '# comment\n\n.env.staging\n');
    const result = await scanForSecrets(tmpDir);
    expect(result.patterns).toContain('.env.staging');
  });

  it('returns empty foundFiles for clean project', async () => {
    fs.writeFileSync(path.join(tmpDir, 'app.js'), 'console.log("hi")');
    const result = await scanForSecrets(tmpDir);
    expect(result.foundFiles).toEqual([]);
  });
});
