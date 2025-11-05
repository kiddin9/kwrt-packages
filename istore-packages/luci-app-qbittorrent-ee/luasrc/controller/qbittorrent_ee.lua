module("luci.controller.qbittorrent_ee",package.seeall)

function index()
	if not nixio.fs.access("/etc/config/qbittorrent_ee") then
		return
	end
	
	entry({"admin", "nas", "qBittorrent-EE"}, alias("admin", "nas", "qBittorrent-EE", "basic"), _("qBittorrent EE"), 29).dependent = true
	entry({"admin", "nas", "qBittorrent-EE", "basic"}, cbi("qbittorrent_ee/basic"), _("Basic Settings"), 1).leaf = true
	entry({"admin", "nas", "qBittorrent-EE", "connection"}, cbi("qbittorrent_ee/connection"), _("Connection Settings"), 2).leaf = true
	entry({"admin", "nas", "qBittorrent-EE", "downloads"}, cbi("qbittorrent_ee/downloads"), _("Download Settings"), 3).leaf = true
	entry({"admin", "nas", "qBittorrent-EE", "bittorrent"}, cbi("qbittorrent_ee/bittorrent"), _("Bittorrent Settings"), 4).leaf = true
	entry({"admin", "nas", "qBittorrent-EE", "webgui"}, cbi("qbittorrent_ee/webgui"), _("WebUI Settings"), 5).leaf = true
	entry({"admin", "nas", "qBittorrent-EE", "advanced"}, cbi("qbittorrent_ee/advanced"), _("Advance Settings"), 6).leaf = true
	entry({"admin", "nas", "qBittorrent-EE", "status"}, call("act_status")).leaf = true
end

function act_status()
	local e = {}
	e.running = luci.sys.call("pgrep qbittorrent-ee-nox >/dev/null") == 0
	luci.http.prepare_content("application/json")
	luci.http.write_json(e)
end
