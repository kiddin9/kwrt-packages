module("luci.controller.nbtverify", package.seeall)

function index()
    entry({"admin", "services", "nbtverify"}, cbi("nbtverify"), "NBT Verify", 60)
    entry({"admin", "services", "nbtverify_status"}, call("act_status"))
end


function act_status()
	local sys  = require "luci.sys"
	local e = { }
	e.running = sys.call("pidof nbtverify >/dev/null") == 0
    e.data = sys.exec("cat /var/log/nbtverify.log")
	luci.http.prepare_content("application/json")
	luci.http.write_json(e)
end