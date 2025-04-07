
module("luci.controller.gecoosac", package.seeall)

function index()
	if not nixio.fs.access("/etc/config/gecoosac") then
		return
	end
	entry({"admin", "control"}, firstchild(), "Control", 44).dependent = false
	local page
	page = entry({"admin", "control", "gecoosac"}, cbi("gecoosac"), _("Gecoos AC"), 100)
	page.dependent = true
	page = entry({"admin", "control", "gecoosac", "status"}, call("act_status"))
	page.leaf = true
end

function act_status()
	local e = {}
	local binpath = "/usr/bin/gecoosac"
	e = {
		running = luci.sys.call("pgrep " .. binpath .. " >/dev/null") == 0
	}
	luci.http.prepare_content("application/json")
	luci.http.write_json(e)
end

function clear_upload()
    local path = "/tmp/gecoosac/upload/"
    luci.sys.call("rm -rf " .. path .. "/*")
    luci.http.status(200, "OK")
end
