local sys  = require "luci.sys"
local http = require "luci.http"

module("luci.controller.thunder", package.seeall)

function index()
	entry({"admin", "nas"}, firstchild(), _("NAS") , 45).dependent = false
	if not nixio.fs.access("/etc/config/thunder") then
		return
	end

	local page
	page = entry({ "admin", "nas", "thunder" }, alias("admin", "nas", "thunder", "client"), _("Thunder"), 10)
	page.dependent = true
	page.acl_depends = { "luci-app-thunder" }

	entry({ "admin", "nas", "thunder", "client" }, cbi("thunder/client"), _("Settings"), 10).leaf = true
	entry({ "admin", "nas", "thunder", "log" }, form("thunder/log"), _("Log"), 30).leaf = true
	
	entry({"admin", "nas", "thunder", "status"}, call("act_status")).leaf = true
	entry({ "admin", "nas", "thunder", "logtail" }, call("action_logtail")).leaf = true
end

function act_status()
	local e = {}
	e.running = sys.call("pgrep -f thunder >/dev/null") == 0
	e.application = luci.sys.exec("thunder --version")
	http.prepare_content("application/json")
	http.write_json(e)
end

function action_logtail()
	local fs = require "nixio.fs"
	local log_path = "/var/log/thunder.log"
	local e = {}
	e.running = luci.sys.call("pidof thunder >/dev/null") == 0
	if fs.access(log_path) then
		e.log = luci.sys.exec("tail -n 100 %s | sed 's/\\x1b\\[[0-9;]*m//g'" % log_path)
	else
		e.log = ""
	end
	luci.http.prepare_content("application/json")
	luci.http.write_json(e)
end