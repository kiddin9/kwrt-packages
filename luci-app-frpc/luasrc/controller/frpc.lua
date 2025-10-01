-- Copyright 2019 Xingwang Liao <kuoruan@gmail.com>
-- Licensed to the public under the MIT License.

local http = require "luci.http"
local uci = require "luci.model.uci".cursor()
local sys = require "luci.sys"

-- 查看配置文件所需
local e=require"nixio.fs"
local t=require"luci.sys"
local a=require"luci.template"
local t=require"luci.i18n"

module("luci.controller.frpc", package.seeall)

function index()
	if not nixio.fs.access("/etc/config/frpc") then
		return
	end

	entry({"admin", "services", "frpc"},
		firstchild(), _("Frpc")).dependent = false

	entry({"admin", "services", "frpc", "common"},
		cbi("frpc/common"), _("设置"), 1)

	entry({"admin", "services", "frpc", "rules"},
		arcombine(cbi("frpc/rules"), cbi("frpc/rule-detail")),
		_("规则"), 2).leaf = true

	entry({"admin", "services", "frpc", "servers"},
		arcombine(cbi("frpc/servers"), cbi("frpc/server-detail")),
		_("服务器"), 3).leaf = true

	entry({"admin", "services", "frpc", "status"}, call("action_status"))
	
	entry({"admin", "services", "frpc", "configuration"}, call("view_conf"), _("查看配置"), 5).leaf = true
	
	entry({"admin", "services", "frpc", "get_log"}, call("get_log")).leaf = true
	entry({"admin", "services", "frpc", "clear_log"}, call("clear_log")).leaf = true
	entry({"admin", "services", "frpc", "log"}, cbi("frpc/log"), _("查看日志"), 8).leaf = true
end


function action_status()
	local running = false

	local client = uci:get("frpc", "main", "client_file")
	if client and client ~= "" then
		local file_name = client:match(".*/([^/]+)$") or ""
		if file_name ~= "" then
			running = sys.call("pidof %s >/dev/null" % file_name) == 0
		end
	end

	http.prepare_content("application/json")
	http.write_json({
		running = running
	})
end

function view_conf()
local e=e.readfile("/var/etc/frpc/frpc.main.toml")or""
a.render("frpc/file_viewer",
{title=t.translate("Frpc - 查看配置文件"),content=e})
end

function get_log()
	luci.http.write(luci.sys.exec("cat /tmp/frpc_log_link.txt"))
end
function clear_log()
	luci.sys.call("true > /tmp/frpc_log_link.txt")
end
