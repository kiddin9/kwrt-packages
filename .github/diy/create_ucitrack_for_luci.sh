#!/bin/bash
# SPDX-License-Identifier: GPL-2.0-only
# --------------------------------------------------------
# Script for creating new UCI track file for each LuCI APP

DEFAULT_COLOR="\033[0m"

function __error_bg() {
	echo -e "\033[41;37m$*$DEFAULT_COLOR"
}

function __error_msg() {
        echo -e "\033[31m[ERROR]$DEFAULT_COLOR $*"
}

function __info_msg() {
        echo -e "\033[36m[INFO]$DEFAULT_COLOR $*"
}

function __success_bg() {
	echo -e "\033[42;37m$*$DEFAULT_COLOR"
}

function __success_msg() {
        echo -e "\033[32m[SUCCESS]$DEFAULT_COLOR $*"
}

function __warning_bg() {
	echo -e "\033[43;37m$*$DEFAULT_COLOR"
}

function __warning_msg() {
        echo -e "\033[33m[WARNING]$DEFAULT_COLOR $*"
}

function clean_outdated_files() {
	rm -f "create_ucitrack_for_luci.err" "create_ucitrack_for_luci.warn" "create_ucitrack_for_luci.ok"
}

function check_if_ucitrack_exist() {
	ls "$1/root/usr/share/ucitrack"/*.json >"/dev/null" 2>&1 && return 0 || return 1
}

function check_config_files() {
	[ "$(ls "$1/root/etc/config"/* 2>/dev/null | wc -l)" -ne "1" ] && return 0 || return 1
}

function check_init_files() {
	[ "$(ls "$1/root/etc/init.d"/* 2>/dev/null | wc -l)" -ne "1" ] && return 0
	! grep -q "procd_add_reload_trigger" "$1/root/etc/init.d"/* 2>"/dev/null" && return 1 || return 0
}

function get_target_name() {
	ls "$1/root/etc/$2"/* 2>"/dev/null" | awk -F '/' '{print $NF}'
}

function create_ucitrack_file() {
	mkdir -p "$1"
	echo -e "{
	\"config\": \"$3\",
	\"init\": [ \"$4\" ]
}" > "$1/$2.json"
}

function auto_create_ucitrack() {
	luci_app_list="$(find ./ -maxdepth 1 | grep -Eo "luci-app-[a-zA-Z0-9_-]+" | sort -s)"

	[ "$(echo -e "$luci_app_list" | wc -l)" -gt "0" ] && for i in $luci_app_list
	do
		if check_if_ucitrack_exist "$i"; then
			__warning_bg "$i: has ucitrack file already, skipping..."
		elif check_config_files "$i"; then
			__error_bg "$i: has no/multi config file(s), skipping..."
		elif check_init_files "$i"; then
			__error_bg "$i: has no/multi/procd init script(s), skipping..."
		else
			create_ucitrack_file "$i/root/usr/share/ucitrack" "${i##*/}" "$(get_target_name "$i" "config")" "$(get_target_name "$i" "init.d")"
			__success_bg "$i: ucitrack file has been generated."
		fi
	done
}

while getopts "achmli:n:p:" input_arg
do
	case $input_arg in
	a)
		auto_create_ucitrack
		exit
		;;
	m)
		manual_mode="1"
		;;
	p)
		ucitrack_path="$OPTARG"
		;;
	l)
		luci_name="$OPTARG"
		;;
	n)
		conf_name="$OPTARG"
		;;
	i)
		init_name="$OPTARG"
		;;
	c)
		clean_outdated_files
		exit
		;;
	h|?|*)
		__info_msg "Usage: $0 [-a|-m (-p <path-to-ucitrack>) -l <luci-name> -n <conf-name> -i <init-name>|-c]"
		exit 2
		;;
	esac
done

if [ "$manual_mode" == "1" ] && [ -n "$luci_name" ] && [ -n "$conf_name" ] && [ -n "$init_name" ]; then
	ucitrack_path="${ucitrack_path:-root/usr/share/ucitrack}"
	if create_ucitrack_file "$ucitrack_path" "$luci_name" "$conf_name" "$init_name"; then
		__success_msg "Output file: $(ls "$ucitrack_path/$luci_name.json")"
		__green_bg "$(cat "$ucitrack_path/$luci_name.json")"
		__green_bg "$luci_name: ucitrack file has been generated." >> "create_ucitrack_for_luci.ok"
		[ -e "create_ucitrack_for_luci.err" ] && sed -i "/$luci_name/d" "create_ucitrack_for_luci.err"
	else
		__error_msg "Failed to create file $ucitrack_path/$luci_name.json"
		__error_bg "$luci_name: Failed to create ucitrack file." >> "create_ucitrack_for_luci.err"
	fi
else
	__info_msg "Usage: $0 [-a|-m -p <path-to-ucitrack> -l <luci-name> -n <conf-name> -i <init-name>|-c]"
	exit 2
fi
