openwrt-alwaysonline
====================

> AlwaysOnline is a HTTP and DNS server which mocks a lot network/internet/portal detection servers.

## Introduction
This project is the software package of [alwaysonline][] running on OpenWrt

## Releases
You can find the prebuilt-ipks [here](https://fantastic-packages.github.io/packages/)

## Build

```shell
# Take the x86_64 platform as an example
tar xjf openwrt-sdk-21.02.3-x86-64_gcc-8.4.0_musl.Linux-x86_64.tar.xz
# Go to the SDK root dir
cd OpenWrt-sdk-*-x86_64_*
# First run to generate a .config file
make menuconfig
./scripts/feeds update -a
./scripts/feeds install -a
# Get Makefile
git clone --depth 1 --branch master --single-branch --no-checkout https://github.com/muink/openwrt-alwaysonline.git package/alwaysonline
pushd package/alwaysonline
umask 022
git checkout
popd
# Select the package Network -> alwaysonline
make menuconfig
# Start compiling
make package/alwaysonline/compile V=99
```

## License
This project is licensed under the MIT license

  [alwaysonline]: https://github.com/Jamesits/alwaysonline
