#!/bin/bash

# Make sure we're in the right directory
cd . || exit 1

# Find all matching files, except 000_config.ts
# Sort in **reverse** order to avoid overwriting
for file in $(ls [0-9][0-9][0-9]_*.ts | grep -v '^000_' | sort -r); do
    # Extract the number and the rest of the filename
    num=$(echo "$file" | cut -d'_' -f1)
    rest=$(echo "$file" | cut -d'_' -f2-)

    # Increment the number
    new_num=$(printf "%03d" $((10#$num + 1)))

    # Rename the file
    mv "$file" "${new_num}_${rest}"
done
