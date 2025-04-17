#!/bin/sh

#
# (c) 2024 Cezary Jackiewicz <cezary@eko.one.pl>
#

NETWORK=$1
if [ -n "$NETWORK" ]; then
	eval $(ifstatus ${NETWORK} | jsonfilter -q -e 'UP=@.up' -e 'CT=@.uptime' -e 'IFACE=@.l3_device')
	if [ "x$UP" = "x1" ]; then
		STATUS="CONNECTED"
		if [ -n "$CT" ]; then
			D=$(expr $CT / 60 / 60 / 24)
			H=$(expr $CT / 60 / 60 % 24)
			M=$(expr $CT / 60 % 60)
			S=$(expr $CT % 60)
			CONN_TIME=$(printf "%dd, %02d:%02d:%02d" $D $H $M $S)
			CONN_TIME_SINCE=$(date "+%Y%m%d%H%M%S" -d "@$(($(date +%s) - CT))")
		fi
		if [ -n "$IFACE" ]; then
			RX=$(ifconfig $IFACE | awk -F[\(\)] '/bytes/ {printf "%s",$2}')
			TX=$(ifconfig $IFACE | awk -F[\(\)] '/bytes/ {printf "%s",$4}')
		fi
	else
		STATUS="DISCONNECTED"
	fi
fi

cat <<EOF
{
"status": "${STATUS}",
"conn_time": "${CONN_TIME}",
"conn_time_sec": "${CT}",
"conn_time_since": "${CONN_TIME_SINCE}",
"rx": "${RX}",
"tx": "${TX}"
}
EOF

exit 0
