import { execSync } from 'child_process';
import fs from 'fs';

const dbDir = '/data';
if ( !fs.existsSync(dbDir) ) {
  fs.mkdirSync(dbDir, { recursive: true });
}

execSync("npx prisma migrate deploy", { stdio: "inherit" });

execSync("npx prisma generate", { stdio: "inherit" });
