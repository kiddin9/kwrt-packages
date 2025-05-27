-- Copyright 2018-2019 Ycarus (Yannick Chabanois) <ycarus@zugaina.org>
-- Licensed to the public under the Apache License 2.0.

local ipc = require "luci.ip"
local sys = require "luci.sys"
local net = require "luci.model.network".init()

m = Map("dscp", translate("DSCP by domain"), translate("Set DSCP by domains."))

s = m:section(TypedSection, "domains", translate("Domains"))
s.addremove = true
s.anonymous = true
s.template = "cbi/tblsection"

hn = s:option(Value, "name", translate("Domain"))
hn.datatype = "hostname"
hn.optional = false
--hn.rmempty  = true

t = s:option(ListValue, "class", translate("Class"))
t:value("cs0", translate("CS0 - Normal/Best Effort"))
t:value("cs1", translate("CS1 - Low priority"))
t:value("cs2", translate("CS2 - High priority"))
t:value("cs3", translate("CS3 - SIP"))
t:value("cs4", translate("CS4 - Real-Time Interactive"))
t:value("cs5", translate("CS5 - Broadcast video"))
t:value("cs6", translate("CS6 - Network routing"))
t:value("cs7", translate("CS7 - Latency sensitive"))
t:value("ef", translate("EF Voice"))

c = s:option(Value, "comment", translate("Comment"))
c.optional = true


return m
