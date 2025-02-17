module("luci.controller.nezha-agent-v1", package.seeall)

function index()
	if not nixio.fs.access("/etc/config/nz.yml") then
		return
	end
	
	local page = entry({"admin", "services", "nezha-agent-v1"}, cbi("nezha-agent-v1"), _("哪吒监控"), 300)
	page.dependent = true
	
	entry({"admin", "services", "nezha-agent-v1", "status"}, call("act_status")).leaf = true
end

function act_status()
	local e = {}
	e.running = luci.sys.call("pgrep nezha-agent >/dev/null") == 0
	luci.http.prepare_content("application/json")
	luci.http.write_json(e)
end
