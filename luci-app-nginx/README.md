# LuCI interface for Nginx

Highlights:

- Compatible with OpenWRT master and latest LuCI
- No Lua code, completely written in LuCI's JavaScript API

Useage:

Clone the repo:

Run `git clone https://github.com/zhanghua000/luci-app-nginx /path/to/openwrt/package/openwrt-packages`

Edit config

Run `make menuconfig` at `/path/to/openwrt` and go to `LuCI -> Applications -> luci-app-nginx`, set it to `y` or `m`

Start Building

Run `make /path/to/openwrt/package/openwrt-packages/luci-app-nginx/compile` and you will find .ipk file(s) at `/path/to/openwrt/bin/packages/$TARGET_ARCH/base` folder

Tested on [OpenWRT master](https://github.com/openwrt/openwrt) source code.
