--- a/miniupnpd/files/upnpd.config
+++ b/miniupnpd/files/upnpd.config
@@ -1,5 +1,5 @@
 config upnpd config
-	option enabled		0
+	option enabled		1
 	option enable_natpmp	1
 	option enable_upnp	1
 	option secure_mode	1
@@ -13,7 +13,7 @@ config upnpd config
 	option upnp_lease_file	/var/run/miniupnpd.leases
 	option igdv1		1
 	option ipv6_disable	1
-	option use_stun		0
+	option use_stun		1
 	option stun_host	stun.miwifi.com
 	option stun_port	3478
 	option force_forwarding	1
 
 config perm_rule

--- a/miniupnpd/Makefile
+++ b/miniupnpd/Makefile
@@ -58,7 +58,6 @@ define Package/miniupnpd-nftables
   TITLE+= (nftables)
   VARIANT:=nftables
   DEFAULT_VARIANT:=1
-  CONFLICTS:=miniupnpd-iptables
 endef
 
 define Package/miniupnpd/conffiles/Default
