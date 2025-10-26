#!/bin/sh

export DATABASE_URL="file:../../data/db.sqlite"
echo "Hello DR DR Eastmann"

if [ ! -f ../data/db.sqlite ]
then
  npx prisma migrate deploy
  npx prisma db seed
fi

npx prisma generate
npm run dev
