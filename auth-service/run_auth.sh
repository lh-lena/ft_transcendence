#!/bin/bash

echo "Hello Mrs Eastman"

export ACCESS_TOKEN_SECRET=${JWT_SECRET:-$(openssl rand -base64 64)}
export REFRESH_TOKEN_SECRET=${JWT_SECRET:-$(openssl rand -base64 64)}

npm run start
