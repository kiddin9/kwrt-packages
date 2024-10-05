# openwrt-stuntman
[STUNTMAN][stuntman] - an open source STUN server and client code by john selbie. Compliant with the latest RFCs including 5389, 5769, and 5780. Also includes backwards compatibility for RFC 3489.

## Introduction
This project is the software package of [stuntman] running on OpenWrt

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
git clone --depth 1 --branch master --single-branch --no-checkout https://github.com/muink/openwrt-stuntman.git package/stuntman
pushd package/stuntman
umask 022
git checkout
popd
# Select the package Network -> stuntman
make menuconfig
# Start compiling
make package/stuntman/compile V=99
```

## License
This project is licensed under the [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0)

  [stuntman]: https://github.com/jselbie/stunserver
