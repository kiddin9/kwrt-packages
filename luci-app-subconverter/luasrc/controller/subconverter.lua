module("luci.controller.subconverter", package.seeall)

function index()
  subconverter = entry({"admin", "services", "subconverter"}, alias("admin", "services", "subconverter", "subconverter"), _("Subconverter"), 10)
  subconverter.dependent = true
  
  backend = entry({"admin", "services", "subconverter", "subconverter"}, template("subconverter/subconverter"), _("Subconverter"), 1)
  backend.leaf = true
  backend.dependent = true
  
  frontend = entry({"admin", "services", "subconverter", "prefini"}, template("subconverter/prefini"), _("pref.ini"), 2)
  frontend.dependent = true
end
