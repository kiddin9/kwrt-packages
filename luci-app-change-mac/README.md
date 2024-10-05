LuCI for MAC address randomizer
===============================

## Introduction
This is a project for changing the interface MAC on Openwrt

## Dependencies
`bash`, **[rgmac][]**, `getopt`

## Releases
You can find the prebuilt-ipks [here](https://fantastic-packages.github.io/packages/)

## Screenshots
![0](https://user-images.githubusercontent.com/7929014/198278355-37d684df-64c0-427e-93b0-0bb2d375f27a.png)

## Build

 - Compile from OpenWrt/LEDE [SDK][]

   ``` bash
   # Take the ar71xx platform as an example
   tar xjf OpenWrt-SDK-ar71xx-for-linux-x86_64-gcc-4.8-linaro_uClibc-0.9.33.2.tar.bz2
   # Go to the SDK root dir
   cd OpenWrt-SDK-ar71xx-*
   # First run to generate a .config file
   make menuconfig
   ./scripts/feeds update -a
   ./scripts/feeds install -a
   # Get Makefile
   git clone --depth 1 --branch master --single-branch --no-checkout https://github.com/muink/luci-app-change-mac.git package/luci-app-change-mac
   pushd package/luci-app-change-mac
   umask 022
   git checkout
   popd
   # Select the package LuCI -> Applications -> luci-app-change-mac
   make menuconfig
   # Start compiling
   make package/luci-app-change-mac/compile V=99
   ```

## License
MIT License

----------

  [rgmac]: https://github.com/muink/openwrt-rgmac
  [SDK]: http://wiki.openwrt.org/doc/howto/obtain.firmware.sdk
