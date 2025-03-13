# luci-app-qosmate

This repository uses the central README from the [qosmate repository](https://github.com/hudra0/qosmate).




#### Install one-liner:

```bash
mkdir -p /www/luci-static/resources/view/qosmate /usr/share/luci/menu.d /usr/share/rpcd/acl.d /usr/libexec/rpcd && \
wget -O /www/luci-static/resources/view/qosmate/settings.js https://raw.githubusercontent.com/hudra0/luci-app-qosmate/main/htdocs/luci-static/resources/view/settings.js && \
wget -O /www/luci-static/resources/view/qosmate/hfsc.js https://raw.githubusercontent.com/hudra0/luci-app-qosmate/main/htdocs/luci-static/resources/view/hfsc.js && \
wget -O /www/luci-static/resources/view/qosmate/cake.js https://raw.githubusercontent.com/hudra0/luci-app-qosmate/main/htdocs/luci-static/resources/view/cake.js && \
wget -O /www/luci-static/resources/view/qosmate/advanced.js https://raw.githubusercontent.com/hudra0/luci-app-qosmate/main/htdocs/luci-static/resources/view/advanced.js && \
wget -O /www/luci-static/resources/view/qosmate/rules.js https://raw.githubusercontent.com/hudra0/luci-app-qosmate/main/htdocs/luci-static/resources/view/rules.js && \
wget -O /www/luci-static/resources/view/qosmate/connections.js https://raw.githubusercontent.com/hudra0/luci-app-qosmate/main/htdocs/luci-static/resources/view/connections.js && \
wget -O /www/luci-static/resources/view/qosmate/custom_rules.js https://raw.githubusercontent.com/hudra0/luci-app-qosmate/main/htdocs/luci-static/resources/view/custom_rules.js && \
wget -O /www/luci-static/resources/view/qosmate/ipsets.js https://raw.githubusercontent.com/hudra0/luci-app-qosmate/main/htdocs/luci-static/resources/view/ipsets.js && \
wget -O /www/luci-static/resources/view/qosmate/statistics.js https://raw.githubusercontent.com/hudra0/luci-app-qosmate/main/htdocs/luci-static/resources/view/statistics.js && \
wget -O /usr/share/luci/menu.d/luci-app-qosmate.json https://raw.githubusercontent.com/hudra0/luci-app-qosmate/main/root/usr/share/luci/menu.d/luci-app-qosmate.json && \
wget -O /usr/share/rpcd/acl.d/luci-app-qosmate.json https://raw.githubusercontent.com/hudra0/luci-app-qosmate/main/root/usr/share/rpcd/acl.d/luci-app-qosmate.json && \
wget -O /usr/libexec/rpcd/luci.qosmate https://raw.githubusercontent.com/hudra0/luci-app-qosmate/main/root/usr/libexec/rpcd/luci.qosmate && \
wget -O /usr/libexec/rpcd/luci.qosmate_stats https://raw.githubusercontent.com/hudra0/luci-app-qosmate/main/root/usr/libexec/rpcd/luci.qosmate_stats && \
chmod +x /usr/libexec/rpcd/luci.qosmate && \
chmod +x /usr/libexec/rpcd/luci.qosmate_stats && \
/etc/init.d/rpcd restart && \
/etc/init.d/uhttpd restart
# End of command - Press Enter after pasting

```
