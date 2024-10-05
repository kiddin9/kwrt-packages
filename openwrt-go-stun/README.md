openwrt-go-stun
===============

A go implementation of the STUN client (RFC 3489 and RFC 5389)

## Introduction
This project is the software package of [go-stun][] running on OpenWrt  
Recommended to use it with `luci-app-commands`

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
git clone --depth 1 --branch master --single-branch --no-checkout https://github.com/muink/openwrt-go-stun.git package/go-stun
pushd package/go-stun
umask 022
git checkout
popd
# Select the package Network -> go-stun
make menuconfig
# Start compiling
make package/go-stun/compile V=99
```

## License
This project is licensed under the [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0)

  [go-stun]: https://github.com/ccding/go-stun
