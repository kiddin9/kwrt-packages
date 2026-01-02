#!/bin/sh
awk '/^nameserver/ { print $2 }' /var/resolv.conf.d/resolv.conf.auto | sort | uniq
