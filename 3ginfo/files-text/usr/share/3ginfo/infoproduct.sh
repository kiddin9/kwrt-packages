#!/bin/sh

#
# (c) 2024-2025 Cezary Jackiewicz <cezary@eko.one.pl>
#

DEVICE=$1
if [ -n "$DEVICE" ] && [ -e "$DEVICE" ]; then
	O=$(gcom -d "$DEVICE" -s /usr/share/3ginfo/vendorproduct.gcom)
	T=$(echo "$O" | awk '/CGMI:/{gsub(/.*CGMI[ ]*:[ ]*/,"");gsub(/"/,"");print $0}')
	[ -n "$T" ] && VENDOR="$T"
	T=$(echo "$O" | awk '/CGMM:/{gsub(/.*CGMM[ ]*:[ ]*/,"");gsub(/"/,"");print $0}')
	[ -n "$T" ] && PRODUCT="$T"
	T=$(echo "$O" | awk '/CGMR:/{gsub(/.*CGMR[ ]*:[ ]*/,"");gsub(/"/,"");print $0}')
	[ -n "$T" ] && REVISION="$T"
	T=$(echo "$O" | awk '/CGSN:/{gsub(/.*CGSN[ ]*:[ ]*/,"");gsub(/"/,"");print $0}')
	[ -n "$T" ] && IMEI="$T"
	T=$(echo "$O" | awk '/CCID:/{gsub(/.*CCID[ ]*:[ ]*/,"");gsub(/"/,"");print $0}')
	[ -n "$T" ] && ICCID="$T"
	T=$(echo "$O" | awk '/CIMI:/{gsub(/.*CIMI[ ]*:[ ]*/,"");gsub(/"/,"");print $0}')
	[ -n "$T" ] && IMSI="$T"
fi

cat <<EOF
{
"vendor":"${VENDOR}",
"product":"${PRODUCT}",
"revision":"${REVISION}",
"imei":"${IMEI}",
"iccid":"${ICCID}",
"imsi":"${IMSI}"
}
EOF

exit 0
