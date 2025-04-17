#!/bin/sh

#
# (c) 2024 Cezary Jackiewicz <cezary@eko.one.pl>
#

. /lib/functions.sh

RES="/usr/share/3ginfo"

SEPARATOR=""
parse_section() {
	[ -n "$SEPARATOR" ] && echo "$SEPARATOR"
	local section="$1"
	local device
	local network
	config_get device "$section" device ""
	if echo "x$device" | grep -q "192.168."; then
		$RES/addon/ecm/huawei.sh $device product
	else
		if [ ! -e /var/state/3ginfo-detected ]; then
			[ -z "$device" ] && device=$($RES/detectdevice.sh)
		fi
		config_get pincode "$section" pincode ""
		if [ -n "$pincode" ] && [ ! -e /var/state/3ginfo-pincode ]; then
			[ -n "$device" ] && sms_tool -d "$device" at "at+cpin=\"$pincode\""
		fi
		$RES/infoproduct.sh "$device" | tr -d '\n'
	fi
	SEPARATOR=","
}

config_load 3ginfo
echo -e "Content-type: application/json\n\n"
echo '{"res":['
config_foreach parse_section 3ginfo
echo ']}'
touch /var/state/3ginfo-detected
touch /var/state/3ginfo-pincode

exit 0
