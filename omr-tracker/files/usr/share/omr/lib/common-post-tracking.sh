#!/bin/sh
#
# Copyright (C) 2018-2024 Ycarus (Yannick Chabanois) <ycarus@zugaina.org> for OpenMPTCProuter
#
# This is free software, licensed under the GNU General Public License v2.
# See /LICENSE for more information.
#

. /lib/functions/network.sh

find_network_device() {
	local device="${1}"
	local device_section=""

	check_device() {
		local cfg="${1}"
		local device="${2}"

		local name
		config_get name "${cfg}" name

		[ "${name}" = "${device}" ] && device_section="${cfg}"
	}
	if [ -n "$device" ]; then
		config_load network
		config_foreach check_device device "$(uci -q network.${device}.device)"
	fi
	echo "${device_section}"
}

set_route() {
	local multipath_config_route interface_gw interface_if
	INTERFACE=$1
	PREVINTERFACE=$2
	SETDEFAULT=$3
	[ -z "$SETDEFAULT" ] && SETDEFAULT="yes"
	[ -z "$INTERFACE" ] && return
	multipath_config_route=$(uci -q get openmptcprouter.$INTERFACE.multipath)
	[ -z "$multipath_config_route" ] && multipath_config_route=$(uci -q get network.$INTERFACE.multipath || echo "off")
	[ "$(uci -q get openmptcprouter.$INTERFACE.multipathvpn)" = "1" ] && {
		[ "$(uci -q get openmptcprouter.settings.mptcpovervpn)" = "openvpn" ] && multipath_config_route="$(uci -q get openmptcprouter.ovpn${INTERFACE}.multipath || echo "off")"
		[ "$(uci -q get openmptcprouter.settings.mptcpovervpn)" = "wireguard" ] && multipath_config_route="$(uci -q get openmptcprouter.wg${INTERFACE}.multipath || echo "off")"
	}
	#network_get_device interface_if $INTERFACE
	interface_up=$(ifstatus "$INTERFACE" 2>/dev/null | jsonfilter -q -e '@["up"]')
	[ -z "$interface_if" ] && interface_if=$(ifstatus "$INTERFACE" 2>/dev/null | jsonfilter -q -e '@["l3_device"]')
	[ -z "$interface_if" ] && interface_if=$(ifstatus "${INTERFACE}_4" 2>/dev/null | jsonfilter -q -e '@["l3_device"]')
	[ -z "$interface_if" ] && interface_if=$(uci -q get network.$INTERFACE.device)
	[ -z "$interface_if" ] && interface_if=$(uci -q get network.$INTERFACE.device)
	[ -n "$(echo $interface_if | grep '@')" ] && interface_if=$(ifstatus "${INTERFACE}" | jsonfilter -q -e '@["device"]')
	interface_current_config=$(uci -q get openmptcprouter.$INTERFACE.state || echo "up")
	if [ "$multipath_config_route" != "off" ] && [ "$SETROUTE" != true ] && [ "$INTERFACE" != "$PREVINTERFACE" ] && [ "$interface_current_config" = "up" ] && [ "$interface_up" = "true" ]; then
		interface_gw="$(uci -q get network.$INTERFACE.gateway)"
		if [ -z "$interface_gw" ]; then
			interface_gw=$(ubus call network.interface.$INTERFACE status 2>/dev/null | jsonfilter -q -l 1 -e '@.inactive.route[@.target="0.0.0.0"].nexthop' | tr -d "\n")
		fi
		if [ -z "$interface_gw" ]; then
			interface_gw=$(ubus call network.interface.$INTERFACE status 2>/dev/null | jsonfilter -q -l 1 -e '@.route[@.target="0.0.0.0"].nexthop' | tr -d "\n")
		fi
		if [ -z "$interface_gw" ]; then
			interface_gw=$(ubus call network.interface.${INTERFACE}_4 status 2>/dev/null | jsonfilter -q -l 1 -e '@.inactive.route[@.target="0.0.0.0"].nexthop' | tr -d "\n")
		fi
		if [ "$interface_gw" != "" ] && [ "$interface_if" != "" ]; then
			[ "$(uci -q get openmptcprouter.settings.debug)" = "true" ] && [ "$SETDEFAULT" = "yes" ] && _log "$PREVINTERFACE down. Replace default route by $interface_gw dev $interface_if"
			[ "$(uci -q get openmptcprouter.settings.debug)" = "true" ] && [ "$SETDEFAULT" != "yes" ] && _log "$PREVINTERFACE down. Replace default in table 991337 route by $interface_gw dev $interface_if"
			[ "$SETDEFAULT" = "yes" ] && [ "$(uci -q openmptcprouter.settings.defaultgw)" != "0" ] && ip route replace default scope global metric 1 via $interface_gw dev $interface_if $initcwrwnd >/dev/null 2>&1
			ip route replace default via $interface_gw dev $interface_if table 991337 $initcwrwnd >/dev/null 2>&1 && SETROUTE=true
		fi
	fi
}

set_route6() {
	local multipath_config_route interface_gw interface_if
	INTERFACE=$1
	PREVINTERFACE=$2
	SETDEFAULT=$3
	[ -z "$SETDEFAULT" ] && SETDEFAULT="yes"
	[ -z "$INTERFACE" ] && return
	multipath_config_route=$(uci -q get openmptcprouter.$INTERFACE.multipath)
	[ -z "$multipath_config_route" ] && multipath_config_route=$(uci -q get network.$INTERFACE.multipath || echo "off")
	[ "$(uci -q get openmptcprouter.$INTERFACE.multipathvpn)" = "1" ] && {
		[ "$(uci -q get openmptcprouter.settings.mptcpovervpn)" = "openvpn" ] && multipath_config_route="$(uci -q get openmptcprouter.ovpn${INTERFACE}.multipath || echo "off")"
		[ "$(uci -q get openmptcprouter.settings.mptcpovervpn)" = "wireguard" ] && multipath_config_route="$(uci -q get openmptcprouter.wg${INTERFACE}.multipath || echo "off")"
	}
	#network_get_device interface_if $INTERFACE
	interface_up=$(ifstatus "$INTERFACE" 2>/dev/null | jsonfilter -q -e '@["up"]')
	[ -z "$interface_if" ] && interface_if=$(ifstatus "$INTERFACE" 2>/dev/null | jsonfilter -q -e '@["l3_device"]')
	[ -z "$interface_if" ] && interface_if=$(ifstatus "${INTERFACE}_4" 2>/dev/null | jsonfilter -q -e '@["l3_device"]')
	[ -z "$interface_if" ] && interface_if=$(uci -q get network.$INTERFACE.device)
	[ -z "$interface_if" ] && interface_if=$(uci -q get network.$INTERFACE.device)
	[ -n "$(echo $interface_if | grep '@')" ] && interface_if=$(ifstatus "$INTERFACE" | jsonfilter -q -e '@["device"]')
	interface_current_config=$(uci -q get openmptcprouter.$INTERFACE.state || echo "up")
	if [ "$multipath_config_route" != "off" ] && [ "$SETROUTE" != true ] && [ "$INTERFACE" != "$PREVINTERFACE" ] && [ "$interface_current_config" = "up" ] && [ "$interface_up" = "true" ]; then
		interface_gw="$(uci -q get network.$INTERFACE.gateway)"
		if [ -z "$interface_gw" ]; then
			interface_gw=$(ubus call network.interface.$INTERFACE status 2>/dev/null | jsonfilter -q -l 1 -e '@.inactive.route[@.target="::"].nexthop' | tr -d "\n")
		fi
		if [ -z "$interface_gw" ]; then
			interface_gw=$(ubus call network.interface.$INTERFACE status 2>/dev/null | jsonfilter -q -l 1 -e '@.route[@.target="::"].nexthop' | tr -d "\n")
		fi
		if [ -z "$interface_gw" ]; then
			interface_gw=$(ubus call network.interface.${INTERFACE}_6 status 2>/dev/null | jsonfilter -q -l 1 -e '@.inactive.route[@.target="::"].nexthop' | tr -d "\n")
		fi
		if [ "$interface_gw" != "" ] && [ "$interface_if" != "" ] && [ -n "$(echo $interface_gw | grep ':')" ]; then
			[ "$(uci -q get openmptcprouter.settings.debug)" = "true" ] && _log "$PREVINTERFACE down. Replace default route by $interface_gw dev $interface_if"
			[ "$SETDEFAULT" = "yes" ] && [ "$(uci -q openmptcprouter.settings.defaultgw)" != "0" ] && ip -6 route replace default scope metric 1 global nexthop via $interface_gw dev $interface_if >/dev/null 2>&1
			ip -6 route replace default via $interface_gw dev $interface_if table 6991337 >/dev/null 2>&1 && SETROUTE=true
		fi
	fi
}

set_server_default_route() {
	local server=$1
	server_route() {
		local serverip multipath_config_route
		serverip=$1
		[ -n "$serverip" ] && serverip="$(resolveip -4 -t 5 $serverip | head -n 1 | tr -d '\n')"
		config_get disabled $server disabled
		[ "$disabled" = "1" ] && return
		[ -z "$OMR_TRACKER_INTERFACE" ] && return
		multipath_config_route=$(uci -q get openmptcprouter.$OMR_TRACKER_INTERFACE.multipath)
		[ -z "$multipath_config_route" ] && multipath_config_route=$(uci -q get network.$OMR_TRACKER_INTERFACE.multipath || echo "off")
		[ "$(uci -q get openmptcprouter.$OMR_TRACKER_INTERFACE.multipathvpn)" = "1" ] && {
			[ "$(uci -q get openmptcprouter.settings.mptcpovervpn)" = "openvpn" ] && multipath_config_route="$(uci -q get openmptcprouter.ovpn${OMR_TRACKER_INTERFACE}.multipath || echo "off")"
			[ "$(uci -q get openmptcprouter.settings.mptcpovervpn)" = "wireguard" ] && multipath_config_route="$(uci -q get openmptcprouter.wg${OMR_TRACKER_INTERFACE}.multipath || echo "off")"
		}
		if [ "$serverip" != "" ] && [ "$OMR_TRACKER_DEVICE_GATEWAY" != "" ] && [ -n "$OMR_TRACKER_DEVICE" ] && [ "$(ip route show dev $OMR_TRACKER_DEVICE metric 1 | grep $serverip | grep $OMR_TRACKER_DEVICE_GATEWAY)" = "" ] && [ "$multipath_config_route" != "off" ]; then
			[ "$(uci -q get openmptcprouter.settings.debug)" = "true" ] && _log "Set server $server ($serverip) default route via $OMR_TRACKER_DEVICE_GATEWAY"
			if [ "$(ip r show $serverip | grep nexthop)" != "" ]; then
				ip r delete $serverip >/dev/null 2>&1
			fi
			ip route replace $serverip via $OMR_TRACKER_DEVICE_GATEWAY dev $OMR_TRACKER_DEVICE metric 1 $initcwrwnd >/dev/null 2>&1
		fi
	}
	config_list_foreach $server ip server_route
}

set_server_default_route6() {
	local server=$1
	server_route() {
		local serverip multipath_config_route
		serverip=$1
		[ -n "$serverip" ] && serverip="$(resolveip -6 -t 5 $serverip | head -n 1 | tr -d '\n')"
		config_get disabled $server disabled
		[ "$disabled" = "1" ] && return
		[ -z "$OMR_TRACKER_INTERFACE" ] && return
		multipath_config_route=$(uci -q get openmptcprouter.$OMR_TRACKER_INTERFACE.multipath)
		[ -z "$multipath_config_route" ] && multipath_config_route=$(uci -q get network.$OMR_TRACKER_INTERFACE.multipath || echo "off")
		[ "$(uci -q get openmptcprouter.$OMR_TRACKER_INTERFACE.multipathvpn)" = "1" ] && {
			[ "$(uci -q get openmptcprouter.settings.mptcpovervpn)" = "openvpn" ] && multipath_config_route="$(uci -q get openmptcprouter.ovpn${OMR_TRACKER_INTERFACE}.multipath || echo "off")"
			[ "$(uci -q get openmptcprouter.settings.mptcpovervpn)" = "wireguard" ] && multipath_config_route="$(uci -q get openmptcprouter.wg${OMR_TRACKER_INTERFACE}.multipath || echo "off")"
		}
		if [ "$serverip" != "" ] && [ "$OMR_TRACKER_DEVICE_GATEWAY6" != "" ] && [ -n "$OMR_TRACKER_DEVICE" ] && [ "$(ip -6 route show dev $OMR_TRACKER_DEVICE metric 1 | grep $serverip | grep $OMR_TRACKER_DEVICE_GATEWAY6)" = "" ] && [ "$multipath_config_route" != "off" ]; then
			[ "$(uci -q get openmptcprouter.settings.debug)" = "true" ] && _log "Set server $server ($serverip) default route via $OMR_TRACKER_DEVICE_GATEWAY6"
			if [ "$(ip -6 r show $serverip | grep nexthop)" != "" ]; then
				ip -6 r delete $serverip >/dev/null 2>&1
			fi
			ip -6 route replace $serverip via $OMR_TRACKER_DEVICE_GATEWAY6 dev $OMR_TRACKER_DEVICE metric 1 >/dev/null 2>&1
		fi
	}
	config_list_foreach $server ip server_route
}

delete_server_default_route() {
	local server=$1
	delete_route() {
		local serverip=$1
		[ -n "$serverip" ] && serverip="$(resolveip -4 -t 5 $serverip | head -n 1 | tr -d '\n')"
		config_get disabled $server disabled
		[ "$disabled" = "1" ] && return
		if [ "$serverip" != "" ] && [ "$(ip route show $serverip metric 1)" != "" ]; then
			[ "$(uci -q get openmptcprouter.settings.debug)" = "true" ] && _log "Delete server ($serverip) default route"
			[ -n "$(ip route show $serverip metric 1)" ] && ip route del $serverip metric 1 >/dev/null 2>&1
		fi
	}
	config_list_foreach $server ip delete_route
}

delete_server_default_route6() {
	local server=$1
	delete_route() {
		local serverip=$1
		[ -n "$serverip" ] && serverip="$(resolveip -6 -t 5 $serverip | head -n 1 | tr -d '\n')"
		config_get disabled $server disabled
		[ "$disabled" = "1" ] && return
		if [ "$serverip" != "" ] && [ "$(ip -6 route show $serverip metric 1)" != "" ]; then
			[ "$(uci -q get openmptcprouter.settings.debug)" = "true" ] && _log "Delete server ($serverip) default route"
			[ -n "$(ip -6 route show $serverip metric 1)" ] && ip -6 route del $serverip metric 1 >/dev/null 2>&1
		fi
	}
	config_list_foreach $server ip delete_route
}

set_routes_intf() {
	local multipath_config_route
	local interface_if
	local INTERFACE=$1
	[ -z "$INTERFACE" ] && return
	[ "$INTERFACE" = "omrvpn" ] && return
	multipath_config_route=$(uci -q get openmptcprouter.$INTERFACE.multipath)
	[ -z "$multipath_config_route" ] && multipath_config_route=$(uci -q get network.$INTERFACE.multipath || echo "off")
	[ "$(uci -q get openmptcprouter.$INTERFACE.multipathvpn)" = "1" ] && {
		[ "$(uci -q get openmptcprouter.settings.mptcpovervpn)" = "openvpn" ] && multipath_config_route="$(uci -q get openmptcprouter.ovpn${INTERFACE}.multipath || echo "off")"
		[ "$(uci -q get openmptcprouter.settings.mptcpovervpn)" = "wireguard" ] && multipath_config_route="$(uci -q get openmptcprouter.wg${INTERFACE}.multipath || echo "off")"
	}
	#network_get_device interface_if $INTERFACE
	interface_if=$(ifstatus "$INTERFACE" 2>/dev/null | jsonfilter -q -e '@["l3_device"]')
	[ -z "$interface_if" ] && interface_if=$(ifstatus "${INTERFACE}_4" 2>/dev/null | jsonfilter -q -e '@["l3_device"]')
	[ -z "$interface_if" ] && interface_if=$(uci -q get network.$INTERFACE.device)
	[ -z "$interface_if" ] && interface_if=$(uci -q get network.$INTERFACE.device)
	[ -n "$(echo $interface_if | grep '@')" ] && interface_if=$(ifstatus "$INTERFACE" | jsonfilter -q -e '@["device"]')
	interface_up=$(ifstatus "$INTERFACE" 2>/dev/null | jsonfilter -q -e '@["up"]')
	#multipath_current_config=$(multipath $interface_if | grep 'deactivated')
	interface_current_config=$(uci -q get openmptcprouter.$INTERFACE.state || echo "up")
	interface_vpn=$(uci -q get openmptcprouter.$INTERFACE.vpn || echo "0")
	if { [ "$interface_vpn" = "0" ] || [ "$(uci -q get openmptcprouter.settings.allmptcpovervpn)" = "0" ]; } && [ "$multipath_config_route" != "off" ] && [ "$interface_current_config" = "up" ] && [ "$interface_if" != "" ] && [ "$interface_up" = "true" ]; then
		interface_gw="$(uci -q get network.$INTERFACE.gateway)"
		if [ -z "$interface_gw" ]; then
			interface_gw=$(ubus call network.interface.$INTERFACE status 2>/dev/null | jsonfilter -q -l 1 -e '@.inactive.route[@.target="0.0.0.0"].nexthop' | tr -d "\n")
		fi
		if [ -z "$interface_gw" ]; then
			interface_gw=$(ubus call network.interface.$INTERFACE status 2>/dev/null | jsonfilter -q -l 1 -e '@.route[@.target="0.0.0.0"].nexthop' | tr -d "\n")
		fi
		if [ -z "$interface_gw" ]; then
			interface_gw=$(ubus call network.interface.${INTERFACE}_4 status 2>/dev/null | jsonfilter -q -l 1 -e '@.inactive.route[@.target="0.0.0.0"].nexthop' | tr -d "\n")
		fi
		#if [ "$interface_gw" != "" ] && [ "$interface_if" != "" ] && [ -n "$serverip" ] && [ "$(ip route show $serverip | grep $interface_if)" = "" ]; then
		if [ "$interface_gw" != "" ] && [ "$interface_if" != "" ] && [ -z "$(echo $interface_gw | grep :)" ]; then
			if [ "$multipath_config_route" = "master" ]; then
				weight=100
			else
				weight=1
			fi
			if [ "$multipath_config_route" = "backup" ]; then
				nbintfb=$((nbintfb+1))
				if [ -z "$routesintfbackup" ]; then
					routesintfbackup="nexthop via $interface_gw dev $interface_if weight $weight"
				else
					routesintfbackup="$routesintfbackup nexthop via $interface_gw dev $interface_if weight $weight"
				fi
			else
				nbintf=$((nbintf+1))
				if [ -z "$routesintf" ]; then
					routesintf="nexthop via $interface_gw dev $interface_if weight $weight"
				else
					routesintf="$routesintf nexthop via $interface_gw dev $interface_if weight $weight"
				fi
			fi
		fi
	fi
}

set_routes_intf6() {
	local multipath_config_route
	local interface_if
	local INTERFACE=$1
	[ -z "$INTERFACE" ] && return
	[ "$INTERFACE" = "omr6in4" ] && return
	[ "$INTERFACE" = "omrvpn" ] && return
	multipath_config_route=$(uci -q get openmptcprouter.$INTERFACE.multipath)
	[ -z "$multipath_config_route" ] && multipath_config_route=$(uci -q get network.$INTERFACE.multipath || echo "off")
	[ "$(uci -q get openmptcprouter.$INTERFACE.multipathvpn)" = "1" ] && {
		[ "$(uci -q get openmptcprouter.settings.mptcpovervpn)" = "openvpn" ] && multipath_config_route="$(uci -q get openmptcprouter.ovpn${INTERFACE}.multipath || echo "off")"
		[ "$(uci -q get openmptcprouter.settings.mptcpovervpn)" = "wireguard" ] && multipath_config_route="$(uci -q get openmptcprouter.wg${INTERFACE}.multipath || echo "off")"
	}
	#network_get_device interface_if $INTERFACE
	interface_if=$(ifstatus "$INTERFACE" 2>/dev/null | jsonfilter -q -e '@["l3_device"]')
	[ -z "$interface_if" ] && interface_if=$(ifstatus "${INTERFACE}_6" 2>/dev/null | jsonfilter -q -e '@["l3_device"]')
	[ -z "$interface_if" ] && interface_if=$(uci -q get network.$INTERFACE.device)
	[ -z "$interface_if" ] && interface_if=$(uci -q get network.$INTERFACE.device)
	[ -n "$(echo $interface_if | grep '@')" ] && interface_if=$(ifstatus "$INTERFACE" | jsonfilter -q -e '@["device"]')
	interface_up=$(ifstatus "$INTERFACE" 2>/dev/null | jsonfilter -q -e '@["up"]')
	#multipath_current_config=$(multipath $interface_if | grep 'deactivated')
	interface_current_config=$(uci -q get openmptcprouter.$INTERFACE.state || echo "up")
	interface_vpn=$(uci -q get openmptcprouter.$INTERFACE.vpn || echo "0")
	if { [ "$interface_vpn" = "0" ] || [ "$(uci -q get openmptcprouter.settings.allmptcpovervpn)" = "0" ]; } && [ "$multipath_config_route" != "off" ] && [ "$interface_current_config" = "up" ] && [ "$interface_if" != "" ] && [ "$interface_up" = "true" ]; then
		interface_gw="$(uci -q get network.$INTERFACE.ip6gw)"
		interface_ip6="$(uci -q get network.$INTERFACE.ip6)"
		if [ -z "$interface_gw" ]; then
			interface_gw=$(ubus call network.interface.$INTERFACE status 2>/dev/null | jsonfilter -q -l 1 -e "@.inactive.route[@.source=\"${interface_ip6}\"].nexthop" | tr -d "\n")
		fi
		if [ -z "$interface_gw" ]; then
			interface_gw=$(ubus call network.interface.$INTERFACE status 2>/dev/null | jsonfilter -q -l 1 -e "@.inactive.route[@.source=\"${interface_ip6}/64\"].nexthop" | tr -d "\n")
		fi
		if [ -z "$interface_gw" ]; then
			interface_gw=$(ubus call network.interface.$INTERFACE status 2>/dev/null | jsonfilter -q -l 1 -e "@.inactive.route[@.source=\"${interface_ip6}/56\"].nexthop" | tr -d "\n")
		fi
		if [ -z "$interface_gw" ]; then
			interface_gw=$(ubus call network.interface.$INTERFACE status 2>/dev/null | jsonfilter -q -l 1 -e '@.inactive.route[@.target="::"].nexthop' | tr -d "\n")
		fi
		if [ -z "$interface_gw" ]; then
			interface_gw=$(ubus call network.interface.$INTERFACE status 2>/dev/null | jsonfilter -q -l 1 -e '@.inactive.route[@.nexthop="::"].target' | tr -d "\n")
		fi
		if [ -z "$interface_gw" ]; then
			interface_gw=$(ubus call network.interface.$INTERFACE status 2>/dev/null | jsonfilter -q -l 1 -e '@.route[@.target="::"].nexthop' | tr -d "\n")
		fi
		if [ -z "$interface_gw" ]; then
			interface_gw=$(ubus call network.interface.$INTERFACE status 2>/dev/null | jsonfilter -q -l 1 -e '@.route[@.nexthop="::"].target' | tr -d "\n")
		fi
		if [ -z "$interface_gw" ]; then
			interface_gw=$(ubus call network.interface.${INTERFACE}_6 status 2>/dev/null | jsonfilter -q -l 1 -e '@.inactive.route[@.target="::"].nexthop' | tr -d "\n")
		fi
		#if [ "$interface_gw" != "" ] && [ "$interface_if" != "" ] && [ -n "$serverip" ] && [ "$(ip -6 route show $serverip | grep $interface_if)" = "" ]; then
		if [ "$interface_gw" != "" ] && [ "$interface_if" != "" ] && [ -n "$(echo $interface_gw | grep :)" ]; then
			if [ "$multipath_config_route" = "master" ]; then
				weight=100
			else
				weight=1
			fi
			if [ "$multipath_config_route" = "backup" ]; then
				nbintfb6=$((nbintfb6+1))
				if [ -z "$routesintfbackup6" ]; then
					routesintfbackup6="nexthop via $interface_gw dev $interface_if weight $weight"
				else
					routesintfbackup6="$routesintfbackup6 nexthop via $interface_gw dev $interface_if weight $weight"
				fi
			else
				nbintf6=$((nbintf6+1))
				if [ -z "$routesintf6" ]; then
					routesintf6="nexthop via $interface_gw dev $interface_if weight $weight"
				else
					routesintf6="$routesintf6 nexthop via $interface_gw dev $interface_if weight $weight"
				fi
			fi
		fi
	fi
}

set_route_balancing() {
	local multipath_config_route interface_gw interface_if
	INTERFACE=$1
	[ -z "$INTERFACE" ] && return
	[ "$INTERFACE" = "omrvpn" ] && return
	multipath_config_route=$(uci -q get openmptcprouter.$INTERFACE.multipath)
	[ -z "$multipath_config_route" ] && multipath_config_route=$(uci -q get network.$INTERFACE.multipath || echo "off")
	[ "$(uci -q get openmptcprouter.$INTERFACE.multipathvpn)" = "1" ] && {
		[ "$(uci -q get openmptcprouter.settings.mptcpovervpn)" = "openvpn" ] && multipath_config_route="$(uci -q get openmptcprouter.ovpn${INTERFACE}.multipath || echo "off")"
		[ "$(uci -q get openmptcprouter.settings.mptcpovervpn)" = "wireguard" ] && multipath_config_route="$(uci -q get openmptcprouter.wg${INTERFACE}.multipath || echo "off")"
	}
	#network_get_device interface_if $INTERFACE
	[ -z "$interface_if" ] && interface_if=$(ifstatus "$INTERFACE" 2>/dev/null | jsonfilter -q -e '@["l3_device"]')
	[ -z "$interface_if" ] && interface_if=$(ifstatus "${INTERFACE}_4" 2>/dev/null | jsonfilter -q -e '@["l3_device"]')
	[ -z "$interface_if" ] && interface_if=$(uci -q get network.$INTERFACE.device)
	[ -z "$interface_if" ] && interface_if=$(uci -q get network.$INTERFACE.device)
	[ -n "$(echo $interface_if | grep '@')" ] && interface_if=$(ifstatus "$INTERFACE" | jsonfilter -q -e '@["device"]')
	interface_up=$(ifstatus "$INTERFACE" 2>/dev/null | jsonfilter -q -e '@["up"]')
	interface_current_config=$(uci -q get openmptcprouter.$INTERFACE.state || echo "up")
	interface_vpn=$(uci -q get openmptcprouter.$INTERFACE.vpn || echo "0")
	if { [ "$interface_vpn" = "0" ] || [ "$(uci -q get openmptcprouter.settings.allmptcpovervpn)" = "0" ]; } && [ "$multipath_config_route" != "off" ] && [ "$interface_current_config" = "up" ] && [ "$interface_up" = "true" ]; then
		interface_gw="$(uci -q get network.$INTERFACE.gateway)"
		if [ -z "$interface_gw" ]; then
			interface_gw=$(ubus call network.interface.$INTERFACE status 2>/dev/null | jsonfilter -q -l 1 -e '@.inactive.route[@.target="0.0.0.0"].nexthop' | tr -d "\n")
		fi
		if [ -z "$interface_gw" ]; then
			interface_gw=$(ubus call network.interface.$INTERFACE status 2>/dev/null | jsonfilter -q -l 1 -e '@.route[@.target="0.0.0.0"].nexthop' | tr -d "\n")
		fi
		if [ -z "$interface_gw" ]; then
			interface_gw=$(ubus call network.interface.${INTERFACE}_4 status 2>/dev/null | jsonfilter -q -l 1 -e '@.inactive.route[@.target="0.0.0.0"].nexthop' | tr -d "\n")
		fi
		if [ "$interface_gw" != "" ] && [ "$interface_if" != "" ]; then
			if [ "$(uci -q get network.$INTERFACE.weight)" != "" ]; then
				weight=$(uci -q get network.$INTERFACE.weight)
			elif [ "$(uci -q get openmtpcprouter.$INTERFACE.weight)" != "" ]; then
				weight=$(uci -q get openmtpcprouter.$INTERFACE.weight)
			elif [ "$multipath_config_route" = "master" ]; then
				weight=100
			else
				weight=1
			fi
			if [ "$multipath_config_route" = "backup" ]; then
				nbintfb=$((nbintfb+1))
				if [ -z "$routesbalancingbackup" ]; then
					routesbalancingbackup="nexthop via $interface_gw dev $interface_if weight $weight"
				else
					routesbalancingbackup="$routesbalancingbackup nexthop via $interface_gw dev $interface_if weight $weight"
				fi
			else
				nbintf=$((nbintf+1))
				if [ -z "$routesbalancing" ]; then
					routesbalancing="nexthop via $interface_gw dev $interface_if weight $weight"
				else
					routesbalancing="$routesbalancing nexthop via $interface_gw dev $interface_if weight $weight"
				fi
			fi
		fi
	fi
}

set_route_balancing6() {
	local multipath_config_route interface_gw interface_if
	INTERFACE=$1
	[ -z "$INTERFACE" ] && return
	[ "$INTERFACE" = "omr6in4" ] && return
	[ "$INTERFACE" = "omrvpn" ] && return
	multipath_config_route=$(uci -q get openmptcprouter.$INTERFACE.multipath)
	[ -z "$multipath_config_route" ] && multipath_config_route=$(uci -q get network.$INTERFACE.multipath || echo "off")
	[ "$(uci -q get openmptcprouter.$INTERFACE.multipathvpn)" = "1" ] && {
		[ "$(uci -q get openmptcprouter.settings.mptcpovervpn)" = "openvpn" ] && multipath_config_route="$(uci -q get openmptcprouter.ovpn${INTERFACE}.multipath || echo "off")"
		[ "$(uci -q get openmptcprouter.settings.mptcpovervpn)" = "wireguard" ] && multipath_config_route="$(uci -q get openmptcprouter.wg${INTERFACE}.multipath || echo "off")"
	}
	#network_get_device interface_if $INTERFACE
	[ -z "$interface_if" ] && interface_if=$(ifstatus "$INTERFACE" 2>/dev/null | jsonfilter -q -e '@["l3_device"]')
	[ -z "$interface_if" ] && interface_if=$(ifstatus "${INTERFACE}_4" 2>/dev/null | jsonfilter -q -e '@["l3_device"]')
	[ -z "$interface_if" ] && interface_if=$(uci -q get network.$INTERFACE.device)
	[ -z "$interface_if" ] && interface_if=$(uci -q get network.$INTERFACE.device)
	[ -n "$(echo $interface_if | grep '@')" ] && interface_if=$(ifstatus "$INTERFACE" | jsonfilter -q -e '@["device"]')
	interface_up=$(ifstatus "$INTERFACE" 2>/dev/null | jsonfilter -q -e '@["up"]')
	interface_current_config=$(uci -q get openmptcprouter.$INTERFACE.state || echo "up")
	interface_vpn=$(uci -q get openmptcprouter.$INTERFACE.vpn || echo "0")
	if { [ "$interface_vpn" = "0" ] || [ "$(uci -q get openmptcprouter.settings.allmptcpovervpn)" = "0" ]; } && [ "$multipath_config_route" != "off" ] && [ "$interface_current_config" = "up" ] && [ "$interface_up" = "true" ]; then
		interface_gw="$(uci -q get network.$INTERFACE.gateway)"
		interface_ip6="$(uci -q get network.$INTERFACE.ip6)"
		if [ -z "$interface_gw" ]; then
			interface_gw=$(ubus call network.interface.$INTERFACE status 2>/dev/null | jsonfilter -q -l 1 -e "@.inactive.route[@.source=\"${interface_ip6}\"].nexthop" | tr -d "\n")
		fi
		if [ -z "$interface_gw" ]; then
			interface_gw=$(ubus call network.interface.$INTERFACE status 2>/dev/null | jsonfilter -q -l 1 -e "@.inactive.route[@.source=\"${interface_ip6}/64\"].nexthop" | tr -d "\n")
		fi
		if [ -z "$interface_gw" ]; then
			interface_gw=$(ubus call network.interface.$INTERFACE status 2>/dev/null | jsonfilter -q -l 1 -e "@.inactive.route[@.source=\"${interface_ip6}/56\"].nexthop" | tr -d "\n")
		fi
		if [ -z "$interface_gw" ]; then
			interface_gw=$(ubus call network.interface.$INTERFACE status 2>/dev/null | jsonfilter -q -l 1 -e '@.inactive.route[@.target="::"].nexthop' | tr -d "\n")
		fi
		if [ -z "$interface_gw" ]; then
			interface_gw=$(ubus call network.interface.$INTERFACE status 2>/dev/null | jsonfilter -q -l 1 -e '@.inactive.route[@.nexthop="::"].target' | tr -d "\n")
		fi
		if [ -z "$interface_gw" ]; then
			interface_gw=$(ubus call network.interface.$INTERFACE status 2>/dev/null | jsonfilter -q -l 1 -e '@.route[@.target="::"].nexthop' | tr -d "\n")
		fi
		if [ -z "$interface_gw" ]; then
			interface_gw=$(ubus call network.interface.$INTERFACE status 2>/dev/null | jsonfilter -q -l 1 -e '@.route[@.nexthop="::"].target' | tr -d "\n")
		fi
		if [ -z "$interface_gw" ]; then
			interface_gw=$(ubus call network.interface.${INTERFACE}_6 status 2>/dev/null | jsonfilter -q -l 1 -e '@.inactive.route[@.target="::"].nexthop' | tr -d "\n")
		fi
		if [ "$interface_gw" != "" ] && [ "$interface_if" != "" ] && [ -n "$(echo $interface_gw | grep :)" ]; then
			if [ "$(uci -q get network.$INTERFACE.weight)" != "" ]; then
				weight=$(uci -q get network.$INTERFACE.weight)
			elif [ "$(uci -q get openmtpcprouter.$INTERFACE.weight)" != "" ]; then
				weight=$(uci -q get openmtpcprouter.$INTERFACE.weight)
			elif [ "$multipath_config_route" = "master" ]; then
				weight=100
			else
				weight=1
			fi
			if [ "$multipath_config_route" = "backup" ]; then
				nbintfb6=$((nbintfb6+1))
				if [ -z "$routesbalancingbackup6" ]; then
					routesbalancingbackup6="nexthop via $interface_gw dev $interface_if weight $weight"
				else
					routesbalancingbackup6="$routesbalancingbackup6 nexthop via $interface_gw dev $interface_if weight $weight"
				fi
			else
				nbintf6=$((nbintf6+1))
				if [ -z "$routesbalancing6" ]; then
					routesbalancing6="nexthop via $interface_gw dev $interface_if weight $weight"
				else
					routesbalancing6="$routesbalancing6 nexthop via $interface_gw dev $interface_if weight $weight"
				fi
			fi
		fi
	fi
}

set_server_all_routes() {
	local server=$1
	[ -z "$OMR_TRACKER_INTERFACE" ] && return
	server_route() {
		local serverip multipath_config_route
		serverip=$1
		[ -n "$serverip" ] && serverip="$(resolveip -4 -t 5 $serverip | head -n 1 | tr -d '\n')"
		config_get disabled $server disabled
		[ "$disabled" = "1" ] && return
		#network_get_device interface_if $OMR_TRACKER_INTERFACE
		[ -z "$interface_if" ] && interface_if=$(ifstatus "$OMR_TRACKER_INTERFACE" 2>/dev/null | jsonfilter -q -e '@["l3_device"]')
		[ -z "$interface_if" ] && interface_if=$(ifstatus "${OMR_TRACKER_INTERFACE}_4" 2>/dev/null | jsonfilter -q -e '@["l3_device"]')
		[ -z "$interface_if" ] && interface_if=$(ifstatus "$OMR_TRACKER_INTERFACE" | jsonfilter -q -e '@["device"]')
		[ -z "$interface_if" ] && interface_if=$(uci -q get network.$OMR_TRACKER_INTERFACE.device)
		[ -z "$interface_if" ] && interface_if=$(uci -q get network.$OMR_TRACKER_INTERFACE.device)
		interface_up=$(ifstatus "$OMR_TRACKER_INTERFACE" 2>/dev/null | jsonfilter -q -e '@["up"]')
		multipath_config_route=$(uci -q get openmptcprouter.$OMR_TRACKER_INTERFACE.multipath || echo "off")
		[ -z "$multipath_config_route" ] && multipath_config_route=$(uci -q get network.$OMR_TRACKER_INTERFACE.multipath || echo 'off')
		[ "$(uci -q get openmptcprouter.$OMR_TRACKER_INTERFACE.multipathvpn)" = "1" ] && {
			[ "$(uci -q get openmptcprouter.settings.mptcpovervpn)" = "openvpn" ] && multipath_config_route="$(uci -q get openmptcprouter.ovpn${OMR_TRACKER_INTERFACE}.multipath || echo "off")"
			[ "$(uci -q get openmptcprouter.settings.mptcpovervpn)" = "wireguard" ] && multipath_config_route="$(uci -q get openmptcprouter.wg${OMR_TRACKER_INTERFACE}.multipath || echo "off")"
		}
		if [ "$serverip" != "" ] && [ "$OMR_TRACKER_DEVICE_GATEWAY" != "" ] && [ "$multipath_config_route" != "off" ] && [ "$interface_up" = "true" ]; then
			routesintf=""
			routesintfbackup=""
			nbintf=0
			nbintfb=0
			config_load network
			config_foreach set_routes_intf interface
			uintf="$(echo $routesintf | awk '{print $5}')"
			uintfb="$(echo $routesintfbackup | awk '{print $5}')"
			if [ -n "$routesintf" ] && { [ "$nbintf" -gt "1" ] && [ "$(ip r show $serverip metric 1 | tr -d '\t' | tr -d '\n' | sed 's/ *$//' | tr ' ' '\n' | sort | tr -d '\n')" != "$(echo $serverip $routesintf | sed 's/ *$//' | tr ' ' '\n' | sort | tr -d '\n')" ]; } || { [ "$nbintf" = "1" ] && [ -n "$uintf" ] && [ "$(ip r show $serverip metric 1 | grep $uintf)" = "" ]; }; then
				while [ "$(ip r show $serverip | grep -v nexthop | sed 's/ //g' | tr -d '\n')" != "$serverip" ] && [ "$(ip r show $serverip | grep -v nexthop | sed 's/ //g' | tr -d '\n')" != "" ]; do
					ip r del $serverip
				done
				[ "$(uci -q get openmptcprouter.settings.debug)" = "true" ] && _log "Set server $server ($serverip) default route $serverip $routesintf"
				ip route replace $serverip scope global metric 1 $routesintf >/dev/null 2>&1
				[ "$(uci -q get openmptcprouter.settings.debug)" = "true" ] && _log "New server route is $(ip r show $serverip metric 1 | tr -d '\t' | tr -d '\n')"
			fi
			if [ -n "$routesintfbackup" ] && { [ "$nbintfb" -gt "1" ] && [ "$(ip r show $serverip metric 999 | tr -d '\t' | tr -d '\n' | sed 's/ *$//' | tr ' ' '\n' | sort | tr -d '\n')" != "$(echo $serverip $routesintfbackup | sed 's/ *$//' | tr ' ' '\n' | sort | tr -d '\n')" ]; } || { [ "$nbintfb" = "1" ] && [ -n "$uintfb" ] && [ "$(ip r show $serverip metric 999 | grep $uintfb)" = "" ]; }; then
				[ "$(uci -q get openmptcprouter.settings.debug)" = "true" ] && _log "Set server $server ($serverip) backup default route $serverip $routesintfbackup nbintfb $nbintfb $OMR_TRACKER_DEVICE"
				ip route replace $serverip scope global metric 999 $routesintfbackup >/dev/null 2>&1
			fi
		fi
	}
	config_load openmptcprouter
	config_list_foreach $server ip server_route
}

set_server_all_routes6() {
	local server=$1
	[ -z "$OMR_TRACKER_INTERFACE" ] && return
	server_route() {
		local serverip multipath_config_route
		serverip=$1
		[ -n "$serverip" ] && serverip="$(resolveip -6 -t 5 $serverip | head -n 1 | tr -d '\n')"
		config_get disabled $server disabled
		[ "$disabled" = "1" ] && return
		#network_get_device interface_if $OMR_TRACKER_INTERFACE
		[ -z "$interface_if" ] && interface_if=$(ifstatus "$OMR_TRACKER_INTERFACE" 2>/dev/null | jsonfilter -q -e '@["l3_device"]')
		[ -z "$interface_if" ] && interface_if=$(ifstatus "${OMR_TRACKER_INTERFACE}_6" 2>/dev/null | jsonfilter -q -e '@["l3_device"]')
		[ -z "$interface_if" ] && interface_if=$(ifstatus "$OMR_TRACKER_INTERFACE" | jsonfilter -q -e '@["device"]')
		[ -z "$interface_if" ] && interface_if=$(uci -q get network.$OMR_TRACKER_INTERFACE.device)
		[ -z "$interface_if" ] && interface_if=$(uci -q get network.$OMR_TRACKER_INTERFACE.device)
		interface_up=$(ifstatus "$OMR_TRACKER_INTERFACE" 2>/dev/null | jsonfilter -q -e '@["up"]')
		multipath_config_route=$(uci -q get openmptcprouter.$OMR_TRACKER_INTERFACE.multipath || echo "off")
		[ "$(uci -q get openmptcprouter.$OMR_TRACKER_INTERFACE.multipathvpn)" = "1" ] && {
			[ "$(uci -q get openmptcprouter.settings.mptcpovervpn)" = "openvpn" ] && multipath_config_route="$(uci -q get openmptcprouter.ovpn${OMR_TRACKER_INTERFACE}.multipath || echo "off")"
			[ "$(uci -q get openmptcprouter.settings.mptcpovervpn)" = "wireguard" ] && multipath_config_route="$(uci -q get openmptcprouter.wg${OMR_TRACKER_INTERFACE}.multipath || echo "off")"
		}
		if [ "$serverip" != "" ] && [ "$OMR_TRACKER_DEVICE_GATEWAY6" != "" ] && [ "$multipath_config_route" != "off" ] && [ "$interface_up" = "true" ]; then
			routesintf=""
			routesintfbackup=""
			nbintf6=0
			nbintfb6=0
			config_load network
			config_foreach set_routes_intf6 interface
			uintf="$(echo $routesintf6 | awk '{print $5}')"
			uintfb="$(echo $routesintfbackup6 | awk '{print $5}')"
			if [ -n "$routesintf6" ] && { [ "$nbintf6" -gt "1" ] && [ "$(ip -6 r show $serverip metric 1 | tr -d '\t' | sort | tr -d '\n' | sed 's/ *$//')" != "$(echo $serverip $routesintf6 | sort | sed 's/ *$//')" ]; } || { [ "$nbintf6" = "1" ] && [ -n "$uintf" ] && [ "$(ip -6 r show $serverip metric 1 | grep $uintf)" = "" ]; }; then
				while [ "$(ip -6 r show $serverip | grep -v nexthop | sed 's/ //g' | tr -d '\n')" != "$serverip" ] && [ "$(ip -6 r show $serverip | grep -v nexthop | sed 's/ //g' | tr -d '\n')" != "" ]; do
					ip -6 r del $serverip
				done
				[ "$(uci -q get openmptcprouter.settings.debug)" = "true" ] && _log "Set server $server ($serverip) default route $serverip $routesintf6"
				ip -6 route replace $serverip scope global metric 1 $routesintf6 >/dev/null 2>&1
				[ "$(uci -q get openmptcprouter.settings.debug)" = "true" ] && _log "New server route is $(ip -6 r show $serverip metric 1 | tr -d '\t' | tr -d '\n')"
			fi
			if [ -n "$routesintfbackup6" ] && { [ "$nbintfb6" -gt "1" ] && [ "$(ip -6 r show $serverip metric 999 | tr -d '\t' | tr -d '\n')" != "$serverip $routesintfbackup6 " ]; } || { [ "$nbintfb6" = "1" ] && [ -n "$uintfb" ] && [ "$(ip -6 r show $serverip metric 999 | grep $uintfb)" = "" ]; }; then
				[ "$(uci -q get openmptcprouter.settings.debug)" = "true" ] && _log "Set server $server ($serverip) backup default route $serverip $routesintfbackup6 nbintfb $nbintfb6 $OMR_TRACKER_DEVICE"
				ip -6 route replace $serverip scope global metric 999 $routesintfbackup6 >/dev/null 2>&1
			fi
		fi
	}
	config_load openmptcprouter
	config_list_foreach $server ip server_route
}



set_server_route() {
	local server=$1
	[ -z "$OMR_TRACKER_INTERFACE" ] && return
	server_route() {
		local serverip multipath_config_route
		serverip=$1
		[ -n "$serverip" ] && serverip="$(resolveip -4 -t 5 $serverip | head -n 1 | tr -d '\n')"
		config_get disabled $server disabled
		[ "$disabled" = "1" ] && return
		local metric=$2
		[ -z "$metric" ] && metric=$(uci -q get network.$OMR_TRACKER_INTERFACE.metric)
		multipath_config_route=$(uci -q get openmptcprouter.$OMR_TRACKER_INTERFACE.multipath)
		[ "$multipath_config_route" ] && multipath_config_route=$(uci -q get network.$OMR_TRACKER_INTERFACE.multipath || echo "off")
		[ "$(uci -q get openmptcprouter.$OMR_TRACKER_INTERFACE.multipathvpn)" = "1" ] && {
			[ "$(uci -q get openmptcprouter.settings.mptcpovervpn)" = "openvpn" ] && multipath_config_route="$(uci -q get openmptcprouter.ovpn${OMR_TRACKER_INTERFACE}.multipath || echo "off")"
			[ "$(uci -q get openmptcprouter.settings.mptcpovervpn)" = "wireguard" ] && multipath_config_route="$(uci -q get openmptcprouter.wg${OMR_TRACKER_INTERFACE}.multipath || echo "off")"
		}
		#network_get_device interface_if $OMR_TRACKER_INTERFACE
		[ -z "$interface_if" ] && interface_if=$(ifstatus "$OMR_TRACKER_INTERFACE" 2>/dev/null | jsonfilter -q -e '@["l3_device"]')
		[ -z "$interface_if" ] && interface_if=$(ifstatus "${OMR_TRACKER_INTERFACE}_4" 2>/dev/null | jsonfilter -q -e '@["l3_device"]')
		[ -z "$interface_if" ] && interface_if=$(ifstatus "$OMR_TRACKER_INTERFACE" | jsonfilter -q -e '@["device"]')
		[ -z "$interface_if" ] && interface_if=$(uci -q get network.$OMR_TRACKER_INTERFACE.device)
		[ -z "$interface_if" ] && interface_if=$(uci -q get network.$OMR_TRACKER_INTERFACE.device)
		interface_up=$(ifstatus "$OMR_TRACKER_INTERFACE" 2>/dev/null | jsonfilter -q -e '@["up"]')
		#multipath_current_config=$(multipath $interface_if | grep "deactivated")
		interface_current_config=$(uci -q get openmptcprouter.$OMR_TRACKER_INTERFACE.state || echo "up")
		#if [ "$serverip" != "" ] && [ "$OMR_TRACKER_DEVICE_GATEWAY" != "" ] && [ "$(ip route show dev $OMR_TRACKER_DEVICE metric $metric | grep $serverip | grep $OMR_TRACKER_DEVICE_GATEWAY)" = "" ] && [ "$multipath_config_route" != "off" ] && [ "$multipath_current_config" = "" ]; then
		if [ "$serverip" != "" ] && [ -n "$OMR_TRACKER_DEVICE" ] && [ "$OMR_TRACKER_DEVICE_GATEWAY" != "" ] && [ "$(ip route show dev $OMR_TRACKER_DEVICE metric $metric | grep $serverip | grep $OMR_TRACKER_DEVICE_GATEWAY)" = "" ] && [ "$multipath_config_route" != "off" ] && [ "$interface_current_config" = "up" ] && [ "$interface_up" = "true" ]; then
			[ "$(uci -q get openmptcprouter.settings.debug)" = "true" ] && _log "Set server $server ($serverip) route via $OMR_TRACKER_DEVICE_GATEWAY metric $metric"
			ip route replace $serverip via $OMR_TRACKER_DEVICE_GATEWAY dev $OMR_TRACKER_DEVICE metric $metric $initcwrwnd >/dev/null 2>&1
		fi
	}
	config_list_foreach $server ip server_route
	if [ "$(uci -q get openmptcprouter.settings.defaultgw)" != "0" ] && [ -n "$metric" ] && [ "$OMR_TRACKER_DEVICE_GATEWAY" != "" ] && [ -n "$OMR_TRACKER_DEVICE" ] && [ "$(ip route show dev $OMR_TRACKER_DEVICE metric $metric | grep default | grep $OMR_TRACKER_DEVICE_GATEWAY)" = "" ] && [ "$multipath_config_route" != "off" ] && [ "$interface_current_config" = "up" ] && [ "$interface_up" = "true" ]; then
		ip route replace default via $OMR_TRACKER_DEVICE_GATEWAY dev $OMR_TRACKER_DEVICE metric $metric $initcwrwnd >/dev/null 2>&1
	fi
}

set_server_route6() {
	local server=$1
	[ -z "$OMR_TRACKER_INTERFACE" ] && return
	server_route() {
		local serverip multipath_config_route
		serverip=$1
		[ -n "$serverip" ] && serverip="$(resolveip -6 -t 5 $serverip | head -n 1 | tr -d '\n')"
		config_get disabled $server disabled
		[ "$disabled" = "1" ] && return
		local metric=$2
		[ -z "$metric" ] && metric=$(uci -q get network.$OMR_TRACKER_INTERFACE.metric)
		multipath_config_route=$(uci -q get openmptcprouter.$OMR_TRACKER_INTERFACE.multipath)
		[ "$multipath_config_route" ] && multipath_config_route=$(uci -q get network.$OMR_TRACKER_INTERFACE.multipath || echo "off")
		[ "$(uci -q get openmptcprouter.$OMR_TRACKER_INTERFACE.multipathvpn)" = "1" ] && {
			[ "$(uci -q get openmptcprouter.settings.mptcpovervpn)" = "openvpn" ] && multipath_config_route="$(uci -q get openmptcprouter.ovpn${OMR_TRACKER_INTERFACE}.multipath || echo "off")"
			[ "$(uci -q get openmptcprouter.settings.mptcpovervpn)" = "wireguard" ] && multipath_config_route="$(uci -q get openmptcprouter.wg${OMR_TRACKER_INTERFACE}.multipath || echo "off")"
		}
		#network_get_device interface_if $OMR_TRACKER_INTERFACE
		[ -z "$interface_if" ] && interface_if=$(ifstatus "$OMR_TRACKER_INTERFACE" 2>/dev/null | jsonfilter -q -e '@["l3_device"]')
		[ -z "$interface_if" ] && interface_if=$(ifstatus "${OMR_TRACKER_INTERFACE}_6" 2>/dev/null | jsonfilter -q -e '@["l3_device"]')
		[ -z "$interface_if" ] && interface_if=$(ifstatus "$OMR_TRACKER_INTERFACE" | jsonfilter -q -e '@["device"]')
		[ -z "$interface_if" ] && interface_if=$(uci -q get network.$OMR_TRACKER_INTERFACE.device)
		[ -z "$interface_if" ] && interface_if=$(uci -q get network.$OMR_TRACKER_INTERFACE.device)
		interface_up=$(ifstatus "$OMR_TRACKER_INTERFACE" 2>/dev/null | jsonfilter -q -e '@["up"]')
		#multipath_current_config=$(multipath $interface_if | grep "deactivated")
		interface_current_config=$(uci -q get openmptcprouter.$OMR_TRACKER_INTERFACE.state || echo "up")
		#if [ "$serverip" != "" ] && [ "$OMR_TRACKER_DEVICE_GATEWAY6" != "" ] && [ "$(ip -6 route show dev $OMR_TRACKER_DEVICE metric $metric | grep $serverip | grep $OMR_TRACKER_DEVICE_GATEWAY)" = "" ] && [ "$multipath_config_route" != "off" ] && [ "$multipath_current_config" = "" ]; then
		if [ "$serverip" != "" ] && [ "$OMR_TRACKER_DEVICE_GATEWAY6" != "" ] && [ -n "$OMR_TRACKER_DEVICE" ] && [ "$(ip -6 route show dev $OMR_TRACKER_DEVICE metric $metric | grep $serverip | grep $OMR_TRACKER_DEVICE_GATEWAY6)" = "" ] && [ "$multipath_config_route" != "off" ] && [ "$interface_current_config" = "up" ] && [ "$interface_up" = "true" ]; then
			[ "$(uci -q get openmptcprouter.settings.debug)" = "true" ] && _log "Set server $server ($serverip) route via $OMR_TRACKER_DEVICE_GATEWAY metric $metric"
			ip -6 route replace $serverip via $OMR_TRACKER_DEVICE_GATEWAY6 dev $OMR_TRACKER_DEVICE metric $metric >/dev/null 2>&1
		fi
	}
	config_list_foreach $server ip server_route
	if [ "$(uci -q get openmptcprouter.settings.defaultgw)" != "0" ] && [ "$OMR_TRACKER_DEVICE_GATEWAY6" != "" ] && [ -n "$OMR_TRACKER_DEVICE" ] && [ -n "$metric" ] && [ "$(ip -6 route show dev $OMR_TRACKER_DEVICE metric $metric | grep default | grep $OMR_TRACKER_DEVICE_GATEWAY6)" = "" ] && [ "$multipath_config_route" != "off" ] && [ "$interface_current_config" = "up" ] && [ "$interface_up" = "true" ]; then
		ip -6 route replace default via $OMR_TRACKER_DEVICE_GATEWAY6 dev $OMR_TRACKER_DEVICE metric $metric >/dev/null 2>&1
	fi
}

del_default_route() {
	ip route del default dev $OMR_TRACKER_DEVICE >/dev/null 2>&1
}

del_server_route() {
	local server=$1
	remove_route() {
		local serverip="$1"
		[ -n "$serverip" ] && serverip="$(resolveip -4 -t 5 $serverip | head -n 1 | tr -d '\n')"
		[ -n "$serverip" ] && _log "Delete default route to $serverip dev $OMR_TRACKER_DEVICE"
		local metric
		if [ -z "$OMR_TRACKER_INTERFACE" ]; then
			metric=0
		else
			metric=$(uci -q get network.$OMR_TRACKER_INTERFACE.metric)
		fi
		[ -n "$metric" ] && [ -n "$OMR_TRACKER_DEVICE" ] && [ -n "$serverip" ] && [ -n "$(ip route show $serverip dev $OMR_TRACKER_DEVICE metric $metric)" ] && ip route del $serverip dev $OMR_TRACKER_DEVICE metric $metric >/dev/null 2>&1
		[ -n "$OMR_TRACKER_DEVICE" ] && [ -n "$serverip" ] && [ -n "$(ip route show $serverip dev $OMR_TRACKER_DEVICE)" ] && ip route del $serverip dev $OMR_TRACKER_DEVICE >/dev/null 2>&1
		[ -n "$OMR_TRACKER_DEVICE" ] && [ -n "$serverip" ] && [ -n "$(ip route show $serverip | grep $OMR_TRACKER_DEVICE)" ] && ip route del $serverip dev $OMR_TRACKER_DEVICE >/dev/null 2>&1
	}
	config_list_foreach $server ip remove_route
	if [ -n "$OMR_TRACKER_DEVICE_GATEWAY" ] && [ -n "$OMR_TRACKER_DEVICE" ]; then
		[ -n "$(ip route show default via $OMR_TRACKER_DEVICE_GATEWAY dev $OMR_TRACKER_DEVICE)" ] && ip route del default via $OMR_TRACKER_DEVICE_GATEWAY dev $OMR_TRACKER_DEVICE >/dev/null 2>&1
	elif [ -n "$OMR_TRACKER_DEVICE" ]; then
		[ -n "$(ip route show default dev $OMR_TRACKER_DEVICE)" ] && ip route del default dev $OMR_TRACKER_DEVICE >/dev/null 2>&1
	fi
}

del_server_route6() {
	local server=$1
	remove_route() {
		local serverip="$1"
		[ -n "$serverip" ] && serverip="$(resolveip -6 -t 5 $serverip | head -n 1 | tr -d '\n')"
		[ -n "$serverip" ] && _log "Delete default route to $serverip via $OMR_TRACKER_DEVICE_GATEWAY6 dev $OMR_TRACKER_DEVICE"
		local metric
		if [ -z "$OMR_TRACKER_INTERFACE" ]; then
			metric=0
		else
			metric=$(uci -q get network.$OMR_TRACKER_INTERFACE.metric)
		fi
		[ -n "$OMR_TRACKER_DEVICE" ] && [ -n "$metric" ] && [ -n "$serverip" ] && [ -n "$(ip -6 route show $serverip dev $OMR_TRACKER_DEVICE metric $metric)" ] && ip -6 route del $serverip dev $OMR_TRACKER_DEVICE metric $metric >/dev/null 2>&1
		[ -n "$OMR_TRACKER_DEVICE" ] && [ -n "$metric" ] && [ -n "$serverip" ] && [ -n "$(ip -6 route show $serverip dev $OMR_TRACKER_DEVICE)" ] && ip -6 route del $serverip dev $OMR_TRACKER_DEVICE >/dev/null 2>&1
	}
	config_list_foreach $server ip remove_route
	if [ -n "$OMR_TRACKER_DEVICE_GATEWAY6" ] && [ -n "$OMR_TRACKER_DEVICE" ]; then
		[ -n "$(ip -6 route show default via $OMR_TRACKER_DEVICE_GATEWAY6 dev $OMR_TRACKER_DEVICE)" ] && ip -6 route del default via $OMR_TRACKER_DEVICE_GATEWAY6 dev $OMR_TRACKER_DEVICE >/dev/null 2>&1
	elif [ -n "$OMR_TRACKER_DEVICE" ]; then
		[ -n "$(ip -6 route show default dev $OMR_TRACKER_DEVICE)" ] && ip -6 route del default dev $OMR_TRACKER_DEVICE >/dev/null 2>&1
	fi
}

enable_pihole() {
	local server=$1
	nbserver=$((nbserver+1))
	if [ -n "$server" ] && [ "$(uci -q get openmptcprouter.${server}.pihole)" = "1" ] && [ "$(uci -q get dhcp.@dnsmasq[0].server | grep '127.0.0.1#5353')" != "" ]; then
		piholeenabled=$((piholeenabled+1))
	fi
}

disable_pihole() {
	local server=$1
	if [ -n "$(uci -q get dhcp.@dnsmasq[0].server | grep '#53' | grep '10.255.25')" ]; then
		_log "Disable Pi-Hole..."
		uci -q del_list dhcp.@dnsmasq[0].server="$(uci -q get dhcp.@dnsmasq[0].server | tr ' ' '\n' | grep '#53' | grep '10.255.25')"
		if [ -z "$(uci -q get dhcp.@dnsmasq[0].server | grep '127.0.0.1#5353')" ]; then
			uci -q batch <<-EOF >/dev/null
				add_list dhcp.@dnsmasq[0].server='127.0.0.1#5353'
				commit dhcp
			EOF
		fi
		/etc/init.d/dnsmasq restart >/dev/null 2>&1
	fi
}

dns_flush() {
	_log "DNS flush"
	unbound-control flush-negative >/dev/null 2>&1
	unbound-control flush-bogus >/dev/null 2>&1
}

set_vpn_balancing_routes() {
	vpngw="$1"
	vpn_route() {
		local vpnname
		vpnname=$1
		[ -z "$(echo $vpnname | grep omr)" ] && return
		config_get enabled $vpnname enabled
		[ "$enabled" != "1" ] && return
		config_get dev $vpnname dev
		[ -z "$dev" ] && return
		allvpnroutes="$allvpnroutes nexthop via $vpngw dev $dev"
	}
	allvpnroutes=""
	config_load openvpn
	config_foreach vpn_route openvpn
	_log "allvpnroutes: $allvpnroutes"
	[ -n "$allvpnroutes" ] && ip route replace default scope global${allvpnroutes} >/dev/null 2>&1
}

