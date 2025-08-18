#!/bin/bash

# Check if we're in a service directory
if [ ! -f "package.json" ]; then
  echo "❌ No package.json found. Run this from your service directory."
  exit 1
fi

echo "📦 Installing ESLint and Prettier (with ESLint v8)..."
# Use ESLint v8 specifically to avoid the config format change
npm install --save-dev eslint@^8.57.0 @typescript-eslint/parser@^6.21.0 @typescript-eslint/eslint-plugin@^6.21.0 prettier@^3.2.5 eslint-config-prettier@^9.1.0 eslint-plugin-prettier@^5.1.3 typescript @types/node

echo "📝 Creating config files..."

# Create .eslintrc.json
cat > .eslintrc.json << 'EOF'
{
  "parser": "@typescript-eslint/parser",
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended"
  ],
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module"
  },
  "env": {
    "node": true,
    "es2020": true
  },
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": ["error", { 
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_"
    }],
    "no-console": "warn"
  },
  "ignorePatterns": ["dist", "node_modules", "*.js"]
}
EOF

# Create .prettierrc
cat > .prettierrc << 'EOF'
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
EOF

# Create .prettierignore
cat > .prettierignore << 'EOF'
node_modules
dist
build
coverage
.env
*.min.js
*.min.css
EOF

# Create .eslintignore
cat > .eslintignore << 'EOF'
node_modules
dist
build
coverage
*.config.js
*.config.ts
EOF

echo "📦 Updating package.json scripts..."

# Add scripts to package.json using Node.js
node -e "
const fs = require('fs');
const package = JSON.parse(fs.readFileSync('package.json', 'utf8'));
package.scripts = {
  ...package.scripts,
  'lint': 'eslint . --ext .ts,.tsx',
  'lint:fix': 'eslint . --ext .ts,.tsx --fix',
  'format': 'prettier --write .',
  'format:check': 'prettier --check .',
  'type-check': 'tsc --noEmit'
};
fs.writeFileSync('package.json', JSON.stringify(package, null, 2));
"

echo "✅ Setup complete!"
echo ""
echo "Now run:"
echo "  npm run format       # Format your code"
echo "  npm run lint:fix     # Fix linting issues"
echo "  npm run type-check   # Check TypeScript"