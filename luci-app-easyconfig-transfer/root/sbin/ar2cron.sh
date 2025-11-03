#!/bin/sh

[ -e /etc/crontabs/root ] || touch /etc/crontabs/root

sleep 4
ONF=$(uci -q get easyconfig_transfer.global.auto_reset)
if [ "x$ONF" != "x1" ]; then
	if grep -q "auto_reset_statistics" /etc/crontabs/root; then
		grep -v "auto_reset_statistics" /etc/crontabs/root > /tmp/new_cron
		mv /tmp/new_cron /etc/crontabs/root
		/etc/init.d/cron restart
	fi
	exit 0
fi

if ! grep -q "auto_reset_statistics" /etc/crontabs/root; then

	grep -v "auto_reset_statistics" /etc/crontabs/root > /tmp/new_cron
	mv /tmp/new_cron /etc/crontabs/root

	echo "0 0 1 1 * /usr/bin/auto_reset_statistics.sh" >> /etc/crontabs/root
	/etc/init.d/cron restart
	exit 0
fi

exit 0
