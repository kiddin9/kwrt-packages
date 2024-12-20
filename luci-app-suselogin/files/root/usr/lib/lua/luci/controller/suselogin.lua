-- Copyright 2020 BlackYau <blackyau426@gmail.com>
-- GNU General Public License v3.0


local controller = {}

function controller.index()
    entry({"admin", "network", "suselogin"}, firstchild(), _("SUSE Login"), 100).dependent = false
    entry({"admin", "network", "suselogin", "general"}, cbi("suselogin"), _("Base Setting"), 1)
    entry({"admin", "network", "suselogin", "log"}, form("suseloginlog"), _("Log"), 2)
end

return controller
