local function is_running(name)
	if luci.sys.call("pidof %s >/dev/null" %{name}) == 0 then
		return translate("RUNNING")
	else
		return translate("NOT RUNNING")
	end
end

require("luci.sys")

m = Map("minieap", translate("minieap"))
m.description = translate("Configure minieap for Ruijie 802.1x Authentication")

s = m:section(TypedSection, "minieap", translate("Status"))
s.anonymous = true

status = s:option(DummyValue,"_minieap_status", "minieap")
status.value = "<span id=\"_minieap_status\">%s</span>" %{is_running("minieap")}
status.rawhtml = true

o = m:section(TypedSection, "minieap", translate("Settings"))
o.addremove = false
o.anonymous = true

o:tab("base", translate("Normal Settings"))
o:tab("advanced", translate("Advanced Settings"))
o:tab("plugins", translate("Plugins List"))
o:tab("ruijie", translate("Ruijie EAP Settings"))

enable = o:taboption("base", Flag, "enable", translate("Enable"))

name = o:taboption("base", Value, "username", translate("Username"))
name.description = translate("The username given to you by your network administrator")

pass = o:taboption("base", Value, "password", translate("Password"))
pass.description = translate("The password you set or given to you by your network administrator")
pass.password = true

ifname = o:taboption("base", ListValue, "nic", translate("Interfaces"))
ifname.description = translate("Physical interface of WAN")
for k, v in ipairs(luci.sys.net.devices()) do
	if v ~= "lo" then
		ifname:value(v)
	end
end

stage_timeout = o:taboption("advanced", Value, "stage_timeout", translate("Auth Timeout"))
stage_timeout.description = translate("802.11X auth timeout (in second). [default: 5]")
stage_timeout.default = "5"

wait_after_fail = o:taboption("advanced", Value, "wait_after_fail", translate("Wait after failed"))
wait_after_fail.description = translate("Wait time between failed and next time (in second). [default: 30]")
wait_after_fail.default = "30"

max_fail = o:taboption("advanced", Value, "max_fail", translate("Max fail"))
max_fail.description = translate("Maximum allowed number of failures. [default: 3]")
max_fail.default = "3"

no_auto_reauth = o:taboption("advanced", ListValue, "no_auto_reauth", translate("Disable auto reauth"))
no_auto_reauth.description = translate("Disable auto reauth after offline. [default: False]")
no_auto_reauth:value(0, translate("False"))
no_auto_reauth:value(1, translate("True"))
no_auto_reauth.default = 0

proxy_lan_iface = o:taboption("advanced", Value, "proxy_lan_iface", translate("Proxy LAN's name"))
proxy_lan_iface.description = translate("Name of LAN interface when use proxy auth. [default: None]")
proxy_lan_iface.default = ""

auth_round = o:taboption("advanced", Value, "auth_round", translate("Auth times"))
auth_round.description = translate("Number of times required for auth. [default: 1]")
auth_round.default = "1"

max_retries = o:taboption("advanced", Value, "max_retries", translate("Max timeout"))
max_retries.description = translate("Maximum retry time after timeout. [default: 3]")
max_retries.default = "3"

pid_file = o:taboption("advanced", Value, "pid_file", translate("PID file"))
pid_file.description = translate("Path of PID file. (Set 'None' to disable) [default: /var/run/minieap.pid]")
pid_file:value("/var/run/minieap.pid")
pid_file.default = "/var/run/minieap.pid"

if_impl = o:taboption("advanced", ListValue, "if_impl", translate("Network Module"))
if_impl.description = translate("Network module for send and recv packages (openwrt support sockraw only)")
if_impl:value("sockraw")
if_impl.default = "sockraw"

plugins = o:taboption("plugins", DynamicList, "module", translate("Plugins list"))
plugins.description = translate("Packets flow through these plug-ins in sequence. Pay attention to the order in the environment where the package plug-in is modified")
plugins:value("printer", translate("printer: Print length of packets"))
plugins:value("rjv3", translate('rjv3: Ruijie 802.11X. Support V3 verification algorithm'))
plugins.default = "rjv3"

heartbeat = o:taboption("ruijie", Value, "heartbeat", translate("Heartbeat interval"))
heartbeat.description = translate("Interval for sending Heartbeat packets (seconds) [Default: 20]")
heartbeat.default = "20"

eap_bcast_addr = o:taboption("ruijie", ListValue, "eap_bcast_addr", translate("Broadcast address"))
eap_bcast_addr.description = translate("Broadcast address type when searching for servers [Default: Ruijie private]")
eap_bcast_addr:value(0, translate("Standard"))
eap_bcast_addr:value(1, translate("Ruijie private"))
eap_bcast_addr.default = 1

dhcp_type = o:taboption("ruijie", ListValue, "dhcp_type", translate("DhcpMode"))
dhcp_type.description = translate("DHCP method [Default: After certification]")
dhcp_type:value(0, translate("None"))
dhcp_type:value(1, translate("Secondary authentication"))
dhcp_type:value(2, translate("Before certification"))
dhcp_type:value(3, translate("After certification"))
dhcp_type.default = 3

dhcp_script = o:taboption("ruijie", Value, "dhcp_script", translate("DhcpScript"))
dhcp_script.description = translate("DHCP script [Default: None]")
dhcp_script.default = ""

service = o:taboption("ruijie", Value, "service", translate("Service"))
service.description = translate("Service From Ruijie Server [Default: internet]")
service.default = "internet"

version_str = o:taboption("ruijie", Value, "version_str", translate("Version String"))
version_str.description = translate("Custom version [Default: RG-SU For Linux V1.30]")
version_str:value("RG-SU For Linux V1.30")
version_str.default = "RG-SU For Linux V1.30"

fake_dns1 = o:taboption("ruijie", Value, "fake_dns1", translate("Main DNS server"))
fake_dns1.description = translate("Custom main DNS server [Default: From System]")

fake_dns2 = o:taboption("ruijie", Value, "fake_dns2", translate("Second DNS server"))
fake_dns2.description = translate("Custom second DNS server [Default: From System]")

fake_serial = o:taboption("ruijie", Value, "fake_serial", translate("Disk serial"))
fake_serial.description = translate("Custom disk serial [Default: From boot disk]")

max_dhcp_count = o:taboption("ruijie", Value, "max_dhcp_count", translate("DHCP try times"))
max_dhcp_count.description = translate("DHCP try times [Default: 3]")
max_dhcp_count.default = "3"

rj_option = o:taboption("ruijie", DynamicList, "rj_option", translate("Custom EAP Options"))
rj_option.description = translate("Format &lt;type&gt;:&lt;value&gt;[:r]. Add a option type: &lt;type&gt;, value: &lt;value&gt;. :r for replace")

local apply = luci.http.formvalue("cbi.apply")
if apply then
	io.popen("/etc/init.d/minieap restart")
end

return m
