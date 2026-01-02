#!/bin/sh
ifaces=$(uci show network | sed -n "s/network.\(\S*\).device='$1'/\1/p")
status="Disabled"
for iface in $ifaces; do
    dhcp=$(uci get "network.$iface.proto")
    if [ "$dhcp" == "dhcp" ] || [ "$dhcp" == "dhcpv6" ] ; then
        status="Enabled"
        break
    fi
done
echo $status
