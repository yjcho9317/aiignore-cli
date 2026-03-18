export const DEFAULT_PATTERNS = {
  secrets: [
    '.env',
    '.env.*',
    '.env.local',
    '.env.*.local',
  ],
  credentials: [
    'credentials.json',
    'service-account*.json',
    '*secret*',
    '*credential*',
    'token.json',
  ],
  keys: [
    '*.pem',
    '*.key',
    '*.p12',
    '*.pfx',
    '*.jks',
    '*.keystore',
  ],
  ssh: [
    '.ssh/',
    'id_rsa*',
    'id_ed25519*',
    'id_ecdsa*',
    'known_hosts',
  ],
  cloud: [
    '.aws/',
    '.gcp/',
    '.azure/',
    'gcloud/',
  ],
  app: [
    'config/secrets.yml',
    'config/master.key',
    '.secret',
    'vault.json',
    '*.secrets',
  ],
  database: [
    '*.sqlite',
    '*.db',
    'dump.sql',
    '*.dump',
  ],
  certs: [
    '*.crt',
    '*.cer',
    '*.ca-bundle',
  ],
};

export function getAllPatterns(): string[] {
  return Object.values(DEFAULT_PATTERNS).flat();
}
