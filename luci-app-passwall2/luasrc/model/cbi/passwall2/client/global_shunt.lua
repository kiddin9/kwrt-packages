local m, s = ...

s:tab("Shunt", translate("Shunt Rule"))

local function get_cfgvalue()
	return function(self, section)
		return m:get(current_node_id, self.option)
	end
end
local function get_write()
	return function(self, section, value)
		if s.fields["node"]:formvalue(section) == current_node_id then
			m:set(current_node_id, self.option, value)
		end
	end
end
local function get_remove()
	return function(self, section)
		if s.fields["node"]:formvalue(section) == current_node_id then
			m:del(current_node_id, self.option)
		end
	end
end

if current_node.type == "Xray" then
	o = s:taboption("Shunt", ListValue, "domainStrategy", translate("Domain Strategy"))
	o:value("AsIs")
	o:value("IPIfNonMatch")
	o:value("IPOnDemand")
	o:depends("node", current_node_id)
	o.default = "IPOnDemand"
	o.description = "<br /><ul><li>" .. translate("'AsIs': Only use domain for routing. Default value.")
		.. "</li><li>" .. translate("'IPIfNonMatch': When no rule matches current domain, resolves it into IP addresses (A or AAAA records) and try all rules again.")
		.. "</li><li>" .. translate("'IPOnDemand': As long as there is a IP-based rule, resolves the domain into IP immediately.")
		.. "</li></ul>"
	o.cfgvalue = get_cfgvalue()
	o.write = get_write()
	o.remove = get_remove()

	o = s:taboption("Shunt", ListValue, "domainMatcher", translate("Domain matcher"))
	o:value("hybrid")
	o:value("linear")
	o:depends("node", current_node_id)
	o.cfgvalue = get_cfgvalue()
	o.write = get_write()
	o.remove = get_remove()
end

o = s:taboption("Shunt", Flag, "preproxy_enabled", translate("Preproxy") .. " " .. translate("Main switch"))
o:depends("node", current_node_id)
o.cfgvalue = get_cfgvalue()
o.write = get_write()
o.remove = get_remove()

main_node = s:taboption("Shunt", ListValue, "main_node", string.format('<a style="color:red">%s</a>', translate("Preproxy Node")), translate("Set the node to be used as a pre-proxy. Each rule (including <code>Default</code>) has a separate switch that controls whether this rule uses the pre-proxy or not."))
main_node:depends("preproxy_enabled", true)
main_node.template = appname .. "/cbi/nodes_listvalue"
main_node.group = {}
main_node.cfgvalue = get_cfgvalue()
main_node.write = get_write()
main_node.remove = get_remove()

o = s:taboption("Shunt", Flag, "fakedns", '<a style="color:#FF8C00">FakeDNS</a>' .. " " .. translate("Main switch"), translate("Use FakeDNS work in the domain that proxy.") .. "<br>" ..
	translate("Suitable scenarios for let the node servers get the target domain names.") .. "<br>" ..
	translate("Such as: DNS unlocking of streaming media, reducing DNS query latency, etc."))
o:depends("node", current_node_id)
o.cfgvalue = get_cfgvalue()
o.write = get_write()
o.remove = get_remove()

local shunt_rules = {}
m.uci:foreach(appname, "shunt_rules", function(e)
	e.id = e[".name"]
	e["_node_option"] = e[".name"]
	e["_node_default"] = ""
	e["_fakedns_option"] = e[".name"] .. "_fakedns"
	e["_proxy_tag_option"] = e[".name"] .. "_proxy_tag"
	table.insert(shunt_rules, e)
end)
table.insert(shunt_rules, {
	id = ".default",
	remarks = translate("Default"),
	_node_option = "default_node",
	_node_default = "_direct",
	_fakedns_option = "default_fakedns",
	_proxy_tag_option = "default_proxy_tag",
})

s2 = m:section(Table, shunt_rules, " ")
s2.config = appname
s2.sectiontype = "shunt_option_list"

o = s2:option(DummyValue, "remarks", translate("Rule"))

_node = s2:option(Value, "_node", translate("Node"))
_node.template = appname .. "/cbi/nodes_listvalue"
_node.group = {"","","",""}
_node:value("", translate("Close (Not use)"))
_node:value("_default", translate("Use default node"))
_node:value("_direct", translate("Direct Connection"))
_node:value("_blackhole", translate("Blackhole (Block)"))
_node.cfgvalue = function(self, section)
	return m:get(current_node_id, shunt_rules[section]["_node_option"]) or shunt_rules[section]["_node_default"]
end
_node.write = function(self, section, value)
	if s.fields["node"]:formvalue(global_cfgid) == current_node_id then
		return m:set(current_node_id, shunt_rules[section]["_node_option"], value)
	end
end
_node.remove = function(self, section)
	if s.fields["node"]:formvalue(global_cfgid) == current_node_id then
		return m:del(current_node_id, shunt_rules[section]["_node_option"])
	end
end

o = s2:option(Flag, "_fakedns", '<a style="color:#FF8C00">FakeDNS</a>')
o.cfgvalue = function(self, section)
	return m:get(current_node_id, shunt_rules[section]["_fakedns_option"])
end
o.write = function(self, section, value)
	if s.fields["node"]:formvalue(global_cfgid) == current_node_id then
		return m:set(current_node_id, shunt_rules[section]["_fakedns_option"], value)
	end
end
o.remove = function(self, section)
	if s.fields["node"]:formvalue(global_cfgid) == current_node_id then
		return m:del(current_node_id, shunt_rules[section]["_fakedns_option"])
	end
end

o = s2:option(ListValue, "_proxy_tag", string.format('<a style="color:red">%s</a>', translate("Preproxy")))
o:value("", translate("Close (Not use)"))
o:value("main", translate("Use preproxy node"))
o.cfgvalue = function(self, section)
	return m:get(current_node_id, shunt_rules[section]["_proxy_tag_option"])
end
o.write = function(self, section, value)
	if s.fields["node"]:formvalue(global_cfgid) == current_node_id then
		return m:set(current_node_id, shunt_rules[section]["_proxy_tag_option"], value)
	end
end
o.remove = function(self, section)
	if s.fields["node"]:formvalue(global_cfgid) == current_node_id then
		return m:del(current_node_id, shunt_rules[section]["_proxy_tag_option"])
	end
end

for k, v in pairs(socks_list) do
	main_node:value(v.id, v.remark)
	main_node.group[#main_node.group+1] = (v.group and v.group ~= "") and v.group or translate("default")

	_node:value(v.id, v.remark)
	_node.group[#_node.group+1] = (v.group and v.group ~= "") and v.group or translate("default")
end
if urltest_list then
	for k, v in pairs(urltest_list) do
		main_node:value(v.id, v.remark)
		main_node.group[#main_node.group+1] = (v.group and v.group ~= "") and v.group or translate("default")

		_node:value(v.id, v.remark)
		_node.group[#_node.group+1] = (v.group and v.group ~= "") and v.group or translate("default")
	end
end
if balancing_list then
	for k, v in pairs(balancing_list) do
		main_node:value(v.id, v.remark)
		main_node.group[#main_node.group+1] = (v.group and v.group ~= "") and v.group or translate("default")

		_node:value(v.id, v.remark)
		_node.group[#_node.group+1] = (v.group and v.group ~= "") and v.group or translate("default")
	end
end
for k, v in pairs(iface_list) do
	main_node:value(v.id, v.remark)
	main_node.group[#main_node.group+1] = (v.group and v.group ~= "") and v.group or translate("default")

	_node:value(v.id, v.remark)
	_node.group[#_node.group+1] = (v.group and v.group ~= "") and v.group or translate("default")
end
for k, v in pairs(normal_list) do
	main_node:value(v.id, v.remark)
	main_node.group[#main_node.group+1] = (v.group and v.group ~= "") and v.group or translate("default")

	_node:value(v.id, v.remark)
	_node.group[#_node.group+1] = (v.group and v.group ~= "") and v.group or translate("default")
end

if #main_node.keylist > 0 then
	main_node.default = main_node.keylist[1]
end