import fg from 'fast-glob';
import fs from 'node:fs';
import path from 'node:path';
import { getAllPatterns } from '../data/default-patterns.js';

export interface ScanResult {
  foundFiles: string[];
  patterns: string[];
}

export async function scanForSecrets(projectDir: string): Promise<ScanResult> {
  const defaultPatterns = getAllPatterns();

  const foundFiles: string[] = [];

  for (const pattern of defaultPatterns) {
    const matches = await fg(pattern, {
      cwd: projectDir,
      dot: true,
      onlyFiles: true,
      ignore: ['node_modules/**', '.git/**'],
      suppressErrors: true,
    });
    foundFiles.push(...matches);
  }

  const gitignorePatterns = readGitignorePatterns(projectDir);
  const allPatterns = [...new Set([...defaultPatterns, ...gitignorePatterns])];

  return {
    foundFiles: [...new Set(foundFiles)],
    patterns: allPatterns,
  };
}

function readGitignorePatterns(projectDir: string): string[] {
  const gitignorePath = path.join(projectDir, '.gitignore');

  if (!fs.existsSync(gitignorePath)) {
    return [];
  }

  const content = fs.readFileSync(gitignorePath, 'utf-8');
  const securityRelated: string[] = [];

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    if (isSecurityPattern(trimmed)) {
      securityRelated.push(trimmed);
    }
  }

  return securityRelated;
}

function isSecurityPattern(pattern: string): boolean {
  const securityKeywords = [
    '.env', '.pem', '.key', '.p12', '.pfx', '.jks',
    'secret', 'credential', 'token', 'password',
    '.ssh', '.aws', '.gcp', '.azure',
    'id_rsa', 'id_ed25519', 'id_ecdsa',
    'vault', 'master.key', '.keystore',
  ];

  const lower = pattern.toLowerCase();
  return securityKeywords.some((kw) => lower.includes(kw));
}
