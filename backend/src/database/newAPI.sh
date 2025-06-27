#!/bin/bash

if [ $# -ne 1 ]; then
	echo "Usage: $0 <path_to_new_api>"
	exit 1
fi

NEWAPI="$1"
TDIR="template"
NEWDIR="$NEWAPI"

if [ -d "$NEWDIR" ]; then
	echo "$NEWDIR exists already";
	exit 1
fi

mkdir $NEWDIR ||{ echo "mkdir fail"; exit 1; }

cp -r "$TDIR/." "$NEWDIR/." ||{ echo "copy fail"; exit 1; }

find $NEWDIR -type f -exec sed -i "s/TEMPLATE/$NEWAPI/g" {} + ||{  echo "sed fail"; exit 1; }

find $NEWDIR -depth -type f -name '*TEMPLATE*' | while read f; do
	mv "$f" "${f//TEMPLATE/$NEWAPI}"

cp "../routes/$TDIR" "../routes/$NEWAPI.ts" || { echo "copy route failed": exit 1; }

find "../routes/$NEWAPI.ts" -type f -exec sed -i "s/TEMPLATE/$NEWAPI/g" {} + || { echo "sed route fail"; exit 1; }

done
