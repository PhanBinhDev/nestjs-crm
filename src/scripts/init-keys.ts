import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Ưu tiên đọc từ Render secrets trước, nếu không có thì tạo local
const renderSecretsDir = '/etc/secrets';
const localSecretsDir = path.resolve(process.cwd(), 'secrets');

// Kiểm tra xem có secret files từ Render không
const hasRenderSecrets =
  fs.existsSync(renderSecretsDir) &&
  fs.existsSync(path.join(renderSecretsDir, 'private.key')) &&
  fs.existsSync(path.join(renderSecretsDir, 'public.key'));

if (hasRenderSecrets) {
  console.log('Using RSA keys from Render secrets...');
  // Copy từ /etc/secrets/ sang /app/secrets/ để app có thể đọc
  if (!fs.existsSync(localSecretsDir)) {
    fs.mkdirSync(localSecretsDir, { recursive: true });
  }

  fs.copyFileSync(
    path.join(renderSecretsDir, 'private.key'),
    path.join(localSecretsDir, 'private.key'),
  );
  fs.copyFileSync(
    path.join(renderSecretsDir, 'public.key'),
    path.join(localSecretsDir, 'public.key'),
  );
} else {
  // Generate local keys nếu không có Render secrets
  const privateKeyPath = path.join(localSecretsDir, 'private.key');
  const publicKeyPath = path.join(localSecretsDir, 'public.key');

  if (!fs.existsSync(localSecretsDir)) {
    fs.mkdirSync(localSecretsDir, { recursive: true });
  }

  if (!fs.existsSync(privateKeyPath)) {
    console.log('Generating new RSA private key...');
    execSync(
      `openssl genpkey -algorithm RSA -out ${privateKeyPath} -pkeyopt rsa_keygen_bits:2048`,
    );
  }

  if (!fs.existsSync(publicKeyPath)) {
    console.log('Generating new RSA public key...');
    execSync(`openssl rsa -pubout -in ${privateKeyPath} -out ${publicKeyPath}`);
  }
}
