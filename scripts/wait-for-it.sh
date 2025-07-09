#!/bin/bash
# Basic wait script for services
set -e

host="$1"
shift
cmd="$@"

until curl -f "http://$host" > /dev/null 2>&1; do
  >&2 echo "Service at $host is unavailable - sleeping"
  sleep 1
done

>&2 echo "Service at $host is up"
exec $cmd