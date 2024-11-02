#!/bin/sh

# Ini adalah perangkat lunak open source, dilisensikan di bawah Lisensi Open Source Kustom
#
# Hak Cipta (C) 2024 BobbyUnknown
#
# Deskripsi:
# Perangkat lunak ini menyediakan aplikasi filemanager tinyfilemanager untuk OpenWrt.
# Aplikasi ini memungkinkan pengguna untuk mengelola file dan direktori pada router
# OpenWrt melalui antarmuka web yang mudah digunakan.

create_symlink() {
    local target="$1"
    local path
    local linkname

    case "$target" in
        rootfs)
            path="/"
            linkname="rootfs"
            ;;
        openclash)
            path="/etc/openclash"
            linkname="openclash"
            ;;
        mihomo)
            path="/etc/mihomo"
            linkname="mihomo"
            ;;
        *)
            echo "Target tidak valid"
            exit 1
            ;;
    esac

    ln -s "$path" "/www/tinyfm/$linkname"
    if [ $? -eq 0 ]; then
        echo "Symlink berhasil dibuat: $linkname"
    else
        echo "Gagal membuat symlink: $linkname"
    fi
}

# Periksa apakah argumen diberikan
if [ $# -eq 0 ]; then
    echo "Penggunaan: $0 <target>"
    exit 1
fi

create_symlink "$1"
