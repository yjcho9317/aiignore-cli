export interface ToolIgnoreStatus {
  tool: string;
  ignoreFile: string;
  reliability: 'high' | 'medium' | 'low' | 'none';
  knownLimitations: string[];
  recommendedApproach: string;
  source: string;
  // Date this entry's claims were last checked against vendor docs/issues.
  // Security behavior drifts fast — treat older dates with suspicion.
  verifiedAt: string;
}

export const TOOL_STATUS: Record<string, ToolIgnoreStatus> = {
  cursor: {
    tool: 'Cursor',
    ignoreFile: '.cursorignore',
    reliability: 'low',
    knownLimitations: [
      'Not guaranteed — docs: "complete protection isn\'t guaranteed due to LLM unpredictability"',
      'CVE-2025-59944 (case-sensitivity bypass): fixed in Cursor 1.7',
      'CVE-2025-64110 (agent rewrites .cursorignore): fixed in Cursor 2.0 (GHSA-vhc2-fjv4-wqch)',
      'Terminal and MCP server tools cannot be blocked by .cursorignore',
      '@file reference: docs now say it is blocked, but forum reports conflict — verify in your version',
    ],
    recommendedApproach: '.cursorignore file with gitignore syntax; keep Cursor updated (>=2.0)',
    source: 'https://cursor.com/docs/reference/ignore-file',
    verifiedAt: '2026-07-19',
  },
  claudeCode: {
    tool: 'Claude Code',
    ignoreFile: '.claude/settings.json',
    reliability: 'medium',
    knownLimitations: [
      'Read() deny also blocks Bash cat/head/tail/sed (tested) — separate Bash deny not needed',
      'Arbitrary subprocesses (python/node scripts) reading files are NOT blocked by deny',
      'Enforcement gaps reported — e.g. #24846 (Read deny not applied to .env)',
      'CVE-2025-55284: prompt-injection DNS exfiltration (fixed pre-1.0.4)',
      '.claudeignore exists but only blocks the Read tool',
    ],
    recommendedApproach: 'settings.json deny patterns + PreToolUse hooks + Bash sandbox (bubblewrap/Seatbelt)',
    source: 'https://code.claude.com/docs/en/permissions',
    verifiedAt: '2026-07-19',
  },
  copilot: {
    tool: 'GitHub Copilot',
    ignoreFile: 'none',
    reliability: 'none',
    knownLimitations: [
      '.copilotignore does NOT exist',
      'Content Exclusion is Business/Enterprise only (org or repository admin configures it)',
      'Not applied in Agent, Edit, or CLI modes',
      'Individual developers have NO file-level protection',
    ],
    recommendedApproach: 'No file-level protection for individual developers — see generated guide',
    source: 'https://docs.github.com/en/copilot/concepts/context/content-exclusion',
    verifiedAt: '2026-07-19',
  },
  geminiCli: {
    tool: 'Gemini CLI',
    ignoreFile: '.geminiignore',
    reliability: 'low',
    knownLimitations: [
      'Negation patterns (!) are broken (issues #5444, #12290 open)',
      'list_dir ignores .geminiignore in Antigravity mode',
      'Custom ignore path now supported via CUSTOM_IGNORE_FILE_PATH env (PR #16487)',
      'Self-blocks .env, .pem, credentials.json regardless of .geminiignore (built-in policy)',
    ],
    recommendedApproach: '.geminiignore file with gitignore syntax (avoid negation)',
    source: 'https://github.com/google-gemini/gemini-cli',
    verifiedAt: '2026-07-19',
  },
  jetbrains: {
    tool: 'JetBrains AI',
    ignoreFile: '.aiignore',
    reliability: 'high',
    knownLimitations: [
      'Not 100% guaranteed (YouTrack LLM-17544)',
      'Claude Agent inside JetBrains may ignore .aiignore (LLM-20693)',
      'Also cross-recognizes .cursorignore / .codeiumignore / .aiexclude (no duplicate file needed)',
      'Sensitive-looking content (.env, .pem) may show REDACT instead of full block (AI policy overlap)',
    ],
    recommendedApproach: '.aiignore file (native) with gitignore syntax',
    source: 'https://www.jetbrains.com/help/ai-assistant/disable-ai-assistant.html',
    verifiedAt: '2026-07-19',
  },
  windsurf: {
    tool: 'Windsurf/Codeium',
    ignoreFile: '.codeiumignore',
    reliability: 'medium',
    knownLimitations: [
      'Negation (!) cannot override .gitignore exclusions (Issue #133)',
      '"Allow Cascade to access .gitignore files" toggle does not work (Issue #225)',
      'Autocomplete blocking is indirect (via indexing), not explicitly documented',
      'Still uses .codeiumignore (not .windsurfignore)',
    ],
    recommendedApproach: '.codeiumignore file with gitignore syntax (avoid negation)',
    source: 'https://docs.windsurf.com/context-awareness/windsurf-ignore',
    verifiedAt: '2026-07-19',
  },
  aider: {
    tool: 'Aider',
    ignoreFile: '.aiderignore',
    reliability: 'medium',
    knownLimitations: [
      '--aiderignore flag or .aider.conf.yml can override the ignore file path',
      'Explicit /add command can bypass .aiderignore',
      'Aider writes .aider.chat.history.md / .aider.input.history — protect those too',
    ],
    recommendedApproach: '.aiderignore file with gitignore syntax',
    source: 'https://aider.chat/docs/config/options.html',
    verifiedAt: '2026-07-19',
  },
  cline: {
    tool: 'Cline',
    ignoreFile: '.clineignore',
    reliability: 'medium',
    knownLimitations: [
      'Only controls file context loading, not terminal command execution',
      'Files can still be referenced if user explicitly adds them',
    ],
    recommendedApproach: '.clineignore file with gitignore syntax',
    source: 'https://docs.cline.bot/customization/clineignore',
    verifiedAt: '2026-07-19',
  },
  roo: {
    tool: 'Roo Code',
    ignoreFile: '.rooignore',
    reliability: 'medium',
    knownLimitations: [
      'Affects tool access and context mentions',
      'Terminal commands may bypass .rooignore restrictions',
    ],
    recommendedApproach: '.rooignore file with gitignore syntax',
    source: 'https://docs.roocode.com/features/rooignore',
    verifiedAt: '2026-07-19',
  },
};
