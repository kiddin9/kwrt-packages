# luci-app-xjay

Another luci app for xray-core. The app requires the certain level of knowlege of xray-core configurations. The logic and pattern of the configurations are almost the same as original guidelines. You may need to read the official [xray-core documentation](https://xtls.github.io/) for reference. You might need some translation tools for help. Thank all the developers who contributed to the xray-core project.

## Features
* Inbound / Outbound / DNS / Routing / Log configurations.
* IPv6 support.
* NFtables support (openwrt 22.03.x supported).
* IPtables support (openwrt 21.02.x supported).

## Supported Protocols
* Inbound: dokodemo-door, http, shadowsocks, socks, trojan, vless, vmess
* Outbound: blackhole, dns, freedom, http, shadowsocks, socks, trojan, vless, vmess

## Supported Transport Configurations
* Network Types: tcp, kcp, websocket, http/2, quic, domainsocket, grpc
* Security: TLS, XTLS, Reality
* Socket Options

## Guide for Compilation on OpenWrt
* When compile in openwrt, select nftables or iptables based on your own openwrt version.
    * For 21.02.x, please select "iptables support (21.02.x and below)".
    * For 22.03.x, please select "nftables support (22.03.x and above)".

## Warnings

* If you see `WARNING: at least one of asset files (geoip.dat, geosite.dat) is not found under /usr/share/xray. Xray may not work properly` and don't know what to do:
    * try `opkg update && opkg install v2ray-geosite v2ray-geoip` (at least OpenWrt 21.02 releases)
* This project **DOES NOT SUPPORT** the following versions of OpenWrt due to the fact that client side rendering requires LuCI client side APIs shipped with at least OpenWrt 19.07 releases. 
    * LEDE 17.01
    * OpenWrt 18.06

## Disclaimer
* I write this project based on interest. The project may not be regular updated.
* No gaurantee on bug fix or safety of usage. Use at your own risks.
* This app is not for casual users. Learn by yourself to get it running for your own use case.
* Considering your local law of such kind of tools, espeically for countries with strict policies of cross border traffics.
* I may or may not accept any pull requests and may not provide any comments.

## Todo

* [x] IPv6 support
* [x] nftables support
* [x] multiple inbounds configurations
* [x] multiple outbounds for routing rules
* [x] multiple users for inbound services
* [x] multiple fallbacks for inbound services
* [x] reality support
* [ ] geosite asset viewer and picker
* [ ] policy configurations
* [ ] stats configurations
* [ ] reverse proxy configurations
* [ ] fakedns configurations
