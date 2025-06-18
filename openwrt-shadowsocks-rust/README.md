# Just a core

## Build

``` shell
# Take the x86_64 platform as an example
tar xjf openwrt-sdk-23.05.0-x86-64_gcc-12.3.0_musl.Linux-x86_64.tar.xz
# Go to the SDK root dir
cd OpenWrt-sdk-*-x86_64_*
# First run to generate a .config file
make defconfig
./scripts/feeds update -a
./scripts/feeds install -a
# Get Makefile
git clone --depth 1 --branch master --single-branch --no-checkout https://github.com/muink/openwrt-shadowsocks-rust.git package/shadowsocks-rust
pushd package/shadowsocks-rust
umask 022
git checkout
popd
# Select the package Network -> Web Servers/Proxies -> shadowsocks-rust
make menuconfig
# Start compiling
make package/shadowsocks-rust/compile V=s BUILD_LOG=y -j$(nproc)
```

## License

This project is licensed under the MIT License
