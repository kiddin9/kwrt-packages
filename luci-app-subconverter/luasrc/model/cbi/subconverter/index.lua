

local sys = require("luci.sys")
local fs = require("nixio.fs")
local http = require("luci.http")

local function basename(filename)
	return filename:match("(.+)%..+$") or filename
end

local clients = {
	Clash="clash",
	Singbox="singbox",
	ClashR="clashr",
	V2Ray="V2Ray",
	SSR="ssr"
}

local rules = {}
for fileName in fs.dir("/etc/subconverter/config") do
    if fileName:sub(1, 4) == "ACL4" then
		rules[basename(fileName)]="config/"..fileName
    end
end

local m,s,o,tpl
 
m = Map("subconverter", translate("Subconverter Web"), translate("A utility (web) page for converting between various subscription formats."))
m.description = translate("A utility (web) page for converting between various subscription formats.")
m.pageaction = false


s = m:section(NamedSection, "config", "subconverter",translate("Config Manage"))
s.anonymous = true
s.addremove   = false

o = s:option(DummyValue, "serviceStatus", translate("Service Status"))
o.readonly=true
o.rmempty = true
o.rawhtml = true
o.cfgvalue    = function(...)
	local serviceStatus = sys.exec("/etc/init.d/subconverter status")
	serviceStatus = string.gsub(serviceStatus, "[\n\r]+", "")
	local running = serviceStatus == "running"
	local content = translate('Not Running')
	local color = 'red'
	if running then
		content = translate('Running')
		color = 'green'
	end
    return string.format('<span style="color:%s;">%s</span>',color,content)
end

o = s:option(DummyValue, "version", translate("Version"))
o.readonly=true
o.rmempty = true
o.rawhtml = true
o.cfgvalue  = function(...)
	local version = sys.exec("curl http://127.0.0.1:25500/version")
    return string.format('<span>%s</span>',version)
end

o = s:option(ListValue, "client", translate("Client"))
for k, v in pairs(clients) do 
	o:value(v,k) 
end
o.rmempty = true

o = s:option(Value, "remoteConfig", translate("Rules Setting"))
o.rmempty  = false
for k, v in pairs(rules) do
    o:value(v,k)
end

o = s:option(TextValue, "subscribeAddress", translate("Subscribe Address"))
o.rmempty = true
o.rows = 20
o.cols = 60
o.description='<span style="color:green;font-size:large;font-weight:bold">1.多订阅链接或节点请确保每行一条 2.支持手动使用&quot;|&quot;分割多链接或节点</span>'
o.cfgvalue    = function(...)
    return Flag.cfgvalue(...) or nil
end

tpl = Template("subconverter/index")
tpl.title = "Subconverter"
m:append(tpl)

return m