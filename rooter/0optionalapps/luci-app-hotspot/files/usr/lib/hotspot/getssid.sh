#!/bin/sh

wif=$(uci -q get travelmate.global.freq)
RADIO=$(uci get wireless.wwan$wif.device)
ap_list="$(ubus -S call network.wireless status | jsonfilter -e "@.$RADIO.interfaces[@.config.mode=\"ap\"].device")"
if [ -z $ap_list ]; then
	wifi up
	ap_list="$(ubus -S call network.wireless status | jsonfilter -e "@.$RADIO.interfaces[@.config.mode=\"ap\"].device")"
fi

rm -f /tmp/ssidlist
for ap in ${ap_list}
do
	iwinfo "${ap}" scan >> /tmp/ssidlist
done
