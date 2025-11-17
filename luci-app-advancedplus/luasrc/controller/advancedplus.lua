--[[
LuCI - Lua Configuration Advancedplus
 Copyright (C) 2022-2024  sirpdboy <herboy2008@gmail.com> https://github.com/sirpdboy/luci-app-advancedplus
]]--

local fs = require "nixio.fs"
local http = require "luci.http"
local uci = require"luci.model.uci".cursor()
local name = 'advancedplus'
module("luci.controller.advancedplus", package.seeall)

function index()
	if not nixio.fs.access("/etc/config/advancedplus") then
		return
	end

	local page
	page = entry({"admin","system","advancedplus"},alias("admin","system","advancedplus","advancededit"),_("Advanced plus"),61)
	page.dependent = true
	page.acl_depends = { "luci-app-advancedplus" }
	
	entry({"admin","system","advancedplus","advancededit"},cbi("advancedplus/advancededit"),_("Advanced Edit"),10).leaf = true
	entry({"admin", "system", "advancedplus", "advancedrun"}, call("advanced_run"))
	entry({"admin", "system", "advancedplus", "check"}, call("act_check"))
end

function act_check()
	http.prepare_content("text/plain; charset=utf-8")
	local f=io.open("/tmp/advancedplus.log", "r+")
	local fdp=fs.readfile("/tmp/advancedpos") or 0
	f:seek("set",fdp)
	local a=f:read(2048000) or ""
	fdp=f:seek()
	fs.writefile("/tmp/advancedpos",tostring(fdp))
	f:close()
	http.write(a)
end

function advanced_run()
	local selectipk = luci.http.formvalue('select_ipk')
	uci:set(name, 'advancedplus', 'select_ipk', selectipk)
	uci:commit(name)
	fs.writefile("/tmp/advancedpos","0")
	http.prepare_content("application/json")
	http.write('')
	luci.sys.exec(string.format("bash /usr/bin/advancedplusipk " ..selectipk.. " > /tmp/advancedplus.log 2>&1 &" ))
end
