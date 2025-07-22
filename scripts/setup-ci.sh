#!/bin/bash
# run this to quickly add required files to all services

for service in frontend backend realtime auth-service; do
  cd $service
  
  # Add basic package.json scripts if missing
  if ! grep -q "lint" package.json; then
    npm install --save-dev eslint prettier typescript @typescript-eslint/parser @typescript-eslint/eslint-plugin
    
    # Add scripts to package.json
    npx json -I -f package.json -e 'this.scripts.lint="eslint . --ext .ts,.tsx"'
    npx json -I -f package.json -e 'this.scripts["format:check"]="prettier --check \"src/**/*.{ts,tsx}\""'
    npx json -I -f package.json -e 'this.scripts.build="tsc"'
  fi
  
  # Add basic .eslintrc.json
  echo '{
    "parser": "@typescript-eslint/parser",
    "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
    "rules": {}
  }' > .eslintrc.json
  
  # Add .prettierrc
  echo '{
    "semi": true,
    "singleQuote": true,
    "tabWidth": 2
  }' > .prettierrc
  
  cd ..
done