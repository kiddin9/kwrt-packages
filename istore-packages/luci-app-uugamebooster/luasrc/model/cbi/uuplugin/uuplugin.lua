require("luci.util")

mp = Map("uugamebooster", translate("UU Game Accelerator"))
mp.description = translate("A Paid Game Acceleration service")
mp:section(SimpleSection).template  = "uuplugin/uuplugin_status"

s = mp:section(NamedSection, "config")
s.anonymous=true
s.addremove=false

o = s:option(Flag, "enabled", translate("Enable"))
o.default = 0
o.optional = false

mp:section(SimpleSection).template  = "uuplugin/uuplugin_qcode"

return mp
