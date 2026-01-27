if /etc/init.d/dockerd enabled && [ -f /etc/config/dockerd ]; then
    fstab_add_essential_mountpoint "$(uci -q get dockerd.globals.data_root)"
fi
