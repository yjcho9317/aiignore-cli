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
    '*.gpg',
    '*.asc',
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
  infrastructure: [
    'terraform.tfstate',
    'terraform.tfvars',
    '.docker/config.json',
    '.kube/config',
    'kubeconfig',
  ],
  registry: [
    '.npmrc',
    '.pypirc',
    '.netrc',
    '*.htpasswd',
  ],
  app: [
    'config/secrets.yml',
    'config/master.key',
    '.secret',
    'vault.json',
    '*.secrets',
    'wp-config.php',
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
