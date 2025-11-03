#!/bin/sh

#
# (c) 2025 by Rafał Wabik (IceG) <https://github.com/4IceG>
#
# From eko.one.pl forum
#

DB=/tmp/easyconfig_statistics.json
SDB=/usr/lib/easyconfig/

CURRENT_YEAR=$(date +"%Y")
PREVIOUS_YEAR=$((CURRENT_YEAR - 1))
NEW_ST="easyconfig_statistics_${PREVIOUS_YEAR}.json"

mv "$DB" "$NEW_ST$SDB"
sleep 5
echo "{}" > /tmp/easyconfig_statistics.json
exit 0
