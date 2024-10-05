rgmac for OpenWrt/LEDE
======================

## Introduction
This project is the software package of [rgmac][] running on OpenWrt/LEDE

## Dependencies
`bash`, `curl`, `coreutils-cksum`, `getopt`

## Releases
You can find the prebuilt-ipks [here](https://fantastic-packages.github.io/packages/)

### Usage
See [Source project][]

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
   git clone --depth 1 --branch master --single-branch https://github.com/muink/openwrt-rgmac.git package/rgmac
   # Select the package Utilities -> rgmac
   make menuconfig
   # Start compiling
   make package/rgmac/compile V=99
   ```

## Releases
You can find the prebuilt-ipks [here](https://fantastic-packages.github.io/packages/)

## License
MIT License

----------

  [rgmac]: https://github.com/muink/rgmac
  [Source project]: https://github.com/muink/rgmac/blob/master/Readme.md
  [SDK]: http://wiki.openwrt.org/doc/howto/obtain.firmware.sdk
