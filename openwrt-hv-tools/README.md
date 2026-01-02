# openwrt-hv-tools

Hyper-V Linux Guest Services for OpenWrt

## About `hv_fcopy_uio_daemon`

This should be used on Linux 6.10 or later (6.12 WIP for OpenWrt), but currently it does not work at all.

### Compiling

Currently it does not compile with OpenWrt toolchain (complaining about `__always_inline`). Seems can be solved by:

```diff
diff --git a/tools/hv/vmbus_bufring.c b/tools/hv/vmbus_bufring.c
index bac32c1109df..ee9f48511a71 100644
--- a/tools/hv/vmbus_bufring.c
+++ b/tools/hv/vmbus_bufring.c
@@ -58,7 +58,7 @@ void vmbus_br_setup(struct vmbus_br *br, void *buf, unsigned int blen)
        br->dsize = blen - sizeof(struct vmbus_bufring);
 }
 
-static inline __always_inline void
+static inline __attribute__((always_inline)) void
 rte_smp_mb(void)
 {
        asm volatile("lock addl $0, -128(%%rsp); " ::: "memory");
```

### Running

It requires some `uio` related `vmbus` device which unfortunately I don't know how to initialize. 

```
Wed Apr 16 23:30:57 2025 user.info HV_UIO_FCOPY: starting; pid is:5065
Wed Apr 16 23:30:57 2025 user.err HV_UIO_FCOPY: Failed to open directory (errno=No such file or directory).
Wed Apr 16 23:30:57 2025 user.err HV_UIO_FCOPY: open /dev/ failed; error: 21 Is a directory
```

Tried following [Generic Hyper-V UIO driver](https://www.kernel.org/doc/html/v6.12/driver-api/uio-howto.html#generic-hyper-v-uio-driver) but no `uio*` seen under `/dev` or `/sys/bus/vmbus/devices/eb765408-105f-49b6-b4aa-c123b64d17d4` ([source](https://github.com/torvalds/linux/blob/v6.12/tools/hv/hv_fcopy_uio_daemon.c#L40))

```
# ls -al /sys/bus/vmbus/devices/eb765408-105f-49b6-b4aa-c123b64d17d4/
drwxr-xr-x    4 root     root             0 Apr 16 23:47 .
drwxr-xr-x   22 root     root             0 Apr 16 23:47 ..
-r--r--r--    1 root     root          4096 Apr 16 23:47 channel_vp_mapping
drwxr-xr-x    3 root     root             0 Apr 16 23:47 channels
-r--r--r--    1 root     root          4096 Apr 16 23:47 class_id
-r--r--r--    1 root     root          4096 Apr 16 23:47 device
-r--r--r--    1 root     root          4096 Apr 16 23:47 device_id
-rw-r--r--    1 root     root          4096 Apr 16 23:49 driver_override
-r--r--r--    1 root     root          4096 Apr 16 23:47 id
-r--r--r--    1 root     root          4096 Apr 16 23:47 in_intr_mask
-r--r--r--    1 root     root          4096 Apr 16 23:47 in_read_bytes_avail
-r--r--r--    1 root     root          4096 Apr 16 23:47 in_read_index
-r--r--r--    1 root     root          4096 Apr 16 23:47 in_write_bytes_avail
-r--r--r--    1 root     root          4096 Apr 16 23:47 in_write_index
-r--r--r--    1 root     root          4096 Apr 16 23:47 modalias
-r--r--r--    1 root     root          4096 Apr 16 23:47 out_intr_mask
-r--r--r--    1 root     root          4096 Apr 16 23:47 out_read_bytes_avail
-r--r--r--    1 root     root          4096 Apr 16 23:47 out_read_index
-r--r--r--    1 root     root          4096 Apr 16 23:47 out_write_bytes_avail
-r--r--r--    1 root     root          4096 Apr 16 23:47 out_write_index
drwxr-xr-x    2 root     root             0 Apr 16 23:47 power
-r--r--r--    1 root     root          4096 Apr 16 23:47 state
lrwxrwxrwx    1 root     root             0 Apr 16 23:47 subsystem -> ../../../../../../bus/vmbus
-rw-r--r--    1 root     root          4096 Apr 16 23:47 uevent
-r--r--r--    1 root     root          4096 Apr 16 23:47 vendor
```

Manually binding device does not work as well:

```
# echo -n eb765408-105f-49b6-b4aa-c123b64d17d4 > /sys/bus/vmbus/drivers/uio_hv_generic/bind
ash: write error: No such device
```

At the same time this seems also not working on Ubuntu 25.04 Beta (Running `linux-azure` kernel variant). The problem seems same as running on OpenWrt:

```
Apr 16 16:44:55 yichya-ubuntu sudo[1146]:   yichya : TTY=tty1 ; PWD=/usr/lib/linux-azure-tools-6.14.0-1004 ; USER=root ; COMMAND=./hv_fcopy_uio_daemon -n
Apr 16 16:44:55 yichya-ubuntu sudo[1146]: pam_unix(sudo:session): session opened for user root(uid=0) by yichya(uid=1000)
Apr 16 16:44:55 yichya-ubuntu HV_UIO_FCOPY[1148]: starting; pid is:1148
Apr 16 16:44:55 yichya-ubuntu HV_UIO_FCOPY[1148]: Failed to open directory (errno=No such file or directory).
Apr 16 16:44:55 yichya-ubuntu HV_UIO_FCOPY[1148]: open /dev/ failed; error: 21 Is a directory
```

Not sure if it's related to Hyper-V version (Tried both on Windows 11 24H2 and Windows Server 2022, both not working) or kernel configuration. 

### TL;DR

Since it is broken and not very useful, there's an option in this package to exclude any `fcopy` implementation.

Legacy `hv_fcopy_daemon` does not work on Linux 6.10 or later because it needs `/dev/vmbus/hv_fcopy` which is available only on older kernel versions.
