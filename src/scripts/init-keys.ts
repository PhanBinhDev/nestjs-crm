import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const secretsDir = path.resolve(process.cwd(), 'secrets');

const privateKeyPath = path.join(secretsDir, 'private.key');
const publicKeyPath = path.join(secretsDir, 'public.key');

// Nếu chưa có private key thì sinh mới bằng openssl
if (!fs.existsSync(privateKeyPath)) {
  console.log('Generating new RSA private key...');
  execSync(
    `openssl genpkey -algorithm RSA -out ${privateKeyPath} -pkeyopt rsa_keygen_bits:2048`,
  );
}

// Nếu chưa có public key thì sinh từ private key
if (!fs.existsSync(publicKeyPath)) {
  console.log('Generating new RSA public key...');
  execSync(`openssl rsa -pubout -in ${privateKeyPath} -out ${publicKeyPath}`);
}
