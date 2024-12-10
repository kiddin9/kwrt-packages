module("luci.controller.subconverter", package.seeall)

function index()
	entry({"admin", "services", "subconverter"}, cbi("subconverter/index"), _("Subconverter Web"), 1)
	entry({"admin", "services", "subconverter","restart"},call("restart_service"))
end

function restart_service()
	luci.sys.call("/etc/init.d/subconverter stop")
	luci.sys.call("/etc/init.d/subconverter start")
	luci.http.prepare_content("application/json")
	luci.http.write_json({
		code=200
	})
end