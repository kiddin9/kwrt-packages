require("luci.sys")

m = Map("nbtverify", translate("nbtverify Client"), translate("Configure nbtverify client."))
m:section(SimpleSection).template = "nbtverify_status"

s = m:section(TypedSection, "server", "")
s.addremove = false
s.anonymous = true

enabled = s:option(Flag, "enabled", translate("Enable"))
username = s:option(Value, "username", translate("Username"))
pass = s:option(Value, "password", translate("Password"))
mobile = s:option(Flag, "mobile", translate("Mobile"))
pass.password = true
m.apply_on_parse = true
m.on_after_apply = function(self, map)
    luci.sys.exec("/etc/init.d/nbtverify restart")
end
return m
