#!/bin/sh

# 定义文件路径
PROG_BIN="/usr/share/natpierce/natpierce"
WORK_DIR="/tmp/natpierce_upgrade"

# 获取 UCI 配置工具
uci_tool=/sbin/uci

command -v wget >/dev/null || { echo "错误: 依赖'wget'未安装."; exit 1; }
command -v tar >/dev/null || { echo "错误: 依赖'tar'未安装."; exit 1; }

# 获取当前和最新版本
current_version=$($uci_tool get natpierce.status.current_version 2>/dev/null)
latest_version=$($uci_tool get natpierce.status.latest_version 2>/dev/null)

# 检查最新版本号是否已获取，如果UCI中没有，则为N/A
[ -z "$current_version" ] && current_version="N/A"
[ -z "$latest_version" ] && latest_version="N/A"

# 检查最新版本号是否有效
if [ "$latest_version" = "N/A" ]; then
    echo "错误: 最新版本号未知。请先执行'检查更新'。"
    exit 1
fi

# 比较版本号，如果相同则无需更新
if [ "$current_version" = "$latest_version" ]; then
    echo "当前版本 ($current_version) 已是最新版本。无需更新。"
    exit 0
fi

echo "开始下载新版本：$latest_version"

# 定义URL
URL_AMD64="https://natpierce.oss-cn-beijing.aliyuncs.com/linux/natpierce-amd64-v${latest_version}.tar.gz"
URL_ARM64="https://natpierce.oss-cn-beijing.aliyuncs.com/linux/natpierce-arm64-v${latest_version}.tar.gz"
URL_ARM32="https://natpierce.oss-cn-beijing.aliyuncs.com/linux/natpierce-arm32-v${latest_version}.tar.gz"
URL_mips="https://natpierce.oss-cn-beijing.aliyuncs.com/linux/natpierce-mips-v${latest_version}.tar.gz"
URL_mipsel="https://natpierce.oss-cn-beijing.aliyuncs.com/linux/natpierce-mipsel-v${latest_version}.tar.gz"
# 获取系统架构
arch=$(uname -m)

# 根据架构获取文件
case "$arch" in
  x86_64)
    URL=$URL_AMD64
    ;;
  aarch64 | arm64)
    URL=$URL_ARM64
    ;;
  armv7*)
    URL=$URL_ARM32
    ;;
  arm*)
    echo "不支持的架构: $arch"
    exit 1
    ;;
  i386 | i686)
    echo "不支持的架构: $arch"
    exit 1
    ;;        
  mips | mipsel)
    if [ "$arch" = "mipsel" ]; then
        URL=$URL_mipsel
    else
        first_byte=$(printf '\1' | hexdump -e '1/1 "%02x"')
        if [ "$first_byte" = "01" ]; then
            URL=$URL_mipsel
        else
            URL=$URL_mips
        fi
    fi
    ;;
  *)
    echo "不支持的架构: $arch"
    exit 1
    ;;
esac

# 创建临时工作目录并进入
mkdir -p "$WORK_DIR"
cd "$WORK_DIR"

# 下载压缩包
wget -q -O natpierce.tar.gz "$URL"
if [ "$?" -ne 0 ]; then
    echo "错误: 下载失败，请检查网络连接。"
    rm -rf "$WORK_DIR"
    exit 1
fi

# 停止服务
# /etc/init.d/natpierce stop

# 解压并替换二进制文件
tar -xzvf natpierce.tar.gz
if [ ! -f "natpierce" ]; then
    echo "错误: 解压失败，未找到 natpierce 二进制文件。"
    rm -rf "$WORK_DIR"
    # /etc/init.d/natpierce start # 重新启动旧服务
    exit 1
fi

mv "natpierce" "$PROG_BIN"
chmod +x "$PROG_BIN"

# 更新 UCI 中的版本号
$uci_tool set natpierce.status.current_version="$latest_version"
$uci_tool commit natpierce

echo "更新成功！新版本：$latest_version"

# 清理临时目录
rm -rf "$WORK_DIR"

# 重新启动服务
# /etc/init.d/natpierce start

exit 0