# Peanut script

This script lists the IPv4 and IPv6 connections that the OpenWrt router is listening on, sorted by port number.  It uses the `netstat -peanut | grep LISTEN` command, but with processing to make it output better... 

## Requirements:

- bash

## Sample output:
![output](https://user-images.githubusercontent.com/43975081/206678026-d7732713-aeb6-4396-acbe-1ecc74f19ff3.png)
