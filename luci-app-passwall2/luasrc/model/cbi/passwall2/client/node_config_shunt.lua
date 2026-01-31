local m, s = ...

if type_name == "Xray" then
	o = s:option(ListValue, "domainStrategy", translate("Domain Strategy"))
	o:value("AsIs")
	o:value("IPIfNonMatch")
	o:value("IPOnDemand")
	o.default = "IPOnDemand"
	o.description = "<br /><ul><li>" .. translate("'AsIs': Only use domain for routing. Default value.")
		.. "</li><li>" .. translate("'IPIfNonMatch': When no rule matches current domain, resolves it into IP addresses (A or AAAA records) and try all rules again.")
		.. "</li><li>" .. translate("'IPOnDemand': As long as there is a IP-based rule, resolves the domain into IP immediately.")
		.. "</li></ul>"

	o = s:option(ListValue, "domainMatcher", translate("Domain matcher"))
	o:value("hybrid")
	o:value("linear")
end

o = s:option(Flag, "preproxy_enabled", translate("Preproxy") .. " " .. translate("Main switch"))

main_node = s:option(ListValue, "main_node", string.format('<a style="color:red">%s</a>', translate("Preproxy Node")), translate("Set the node to be used as a pre-proxy. Each rule (including <code>Default</code>) has a separate switch that controls whether this rule uses the pre-proxy or not."))
main_node:depends("preproxy_enabled", true)
main_node.template = appname .. "/cbi/nodes_listvalue"
main_node.group = {}

o = s:option(Flag, "fakedns", '<a style="color:#FF8C00">FakeDNS</a>' .. " " .. translate("Main switch"), translate("Use FakeDNS work in the domain that proxy.") .. "<br>" ..
	translate("Suitable scenarios for let the node servers get the target domain names.") .. "<br>" ..
	translate("Such as: DNS unlocking of streaming media, reducing DNS query latency, etc."))

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

o = s2:option(DummyValue, "remarks", translate("Rule"))

_node = s2:option(Value, "_node", translate("Node"))
_node.template = appname .. "/cbi/nodes_listvalue"
_node.group = {"","","",""}
_node:value("", translate("Close (Not use)"))
_node:value("_default", translate("Use default node"))
_node:value("_direct", translate("Direct Connection"))
_node:value("_blackhole", translate("Blackhole (Block)"))
_node.cfgvalue = function(self, section)
	return m:get(arg[1], shunt_rules[section]["_node_option"]) or shunt_rules[section]["_node_default"]
end
_node.write = function(self, section, value)
	return m:set(arg[1], shunt_rules[section]["_node_option"], value)
end
_node.remove = function(self, section)
	return m:del(arg[1], shunt_rules[section]["_node_option"])
end

o = s2:option(Flag, "_fakedns", '<a style="color:#FF8C00">FakeDNS</a>')
o.cfgvalue = function(self, section)
	return m:get(arg[1], shunt_rules[section]["_fakedns_option"])
end
o.write = function(self, section, value)
	return m:set(arg[1], shunt_rules[section]["_fakedns_option"], value)
end
o.remove = function(self, section)
	return m:del(arg[1], shunt_rules[section]["_fakedns_option"])
end

o = s2:option(ListValue, "_proxy_tag", string.format('<a style="color:red">%s</a>', translate("Preproxy")))
o:value("", translate("Close (Not use)"))
o:value("main", translate("Use preproxy node"))
o.cfgvalue = function(self, section)
	return m:get(arg[1], shunt_rules[section]["_proxy_tag_option"])
end
o.write = function(self, section, value)
	return m:set(arg[1], shunt_rules[section]["_proxy_tag_option"], value)
end
o.remove = function(self, section)
	return m:del(arg[1], shunt_rules[section]["_proxy_tag_option"])
end

for k, v in pairs(socks_list) do
	main_node:value(v.id, v.remark)
	main_node.group[#main_node.group+1] = (v.group and v.group ~= "") and v.group or translate("default")

	_node:value(v.id, v.remark)
	_node.group[#_node.group+1] = (v.group and v.group ~= "") and v.group or translate("default")
end
if urltest_table then
	for k, v in pairs(urltest_table) do
		main_node:value(v.id, v.remark)
		main_node.group[#main_node.group+1] = (v.group and v.group ~= "") and v.group or translate("default")

		_node:value(v.id, v.remark)
		_node.group[#_node.group+1] = (v.group and v.group ~= "") and v.group or translate("default")
	end
end
if balancers_table then
	for k, v in pairs(balancers_table) do
		main_node:value(v.id, v.remark)
		main_node.group[#main_node.group+1] = (v.group and v.group ~= "") and v.group or translate("default")

		_node:value(v.id, v.remark)
		_node.group[#_node.group+1] = (v.group and v.group ~= "") and v.group or translate("default")
	end
end
for k, v in pairs(iface_table) do
	main_node:value(v.id, v.remark)
	main_node.group[#main_node.group+1] = (v.group and v.group ~= "") and v.group or translate("default")

	_node:value(v.id, v.remark)
	_node.group[#_node.group+1] = (v.group and v.group ~= "") and v.group or translate("default")
end
for k, v in pairs(nodes_table) do
	main_node:value(v.id, v.remark)
	main_node.group[#main_node.group+1] = (v.group and v.group ~= "") and v.group or translate("default")

	_node:value(v.id, v.remark)
	_node.group[#_node.group+1] = (v.group and v.group ~= "") and v.group or translate("default")
end

if #main_node.keylist > 0 then
	main_node.default = main_node.keylist[1]
end