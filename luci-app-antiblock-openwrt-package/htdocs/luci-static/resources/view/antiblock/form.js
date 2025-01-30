'use strict';
'require view';
'require form';
'require tools.widgets as widgets';

return view.extend({
	render: function () {
		var m, s, o;

		m = new form.Map('antiblock', 'AntiBlock');

		s = m.section(form.NamedSection, 'config', 'antiblock', 'AntiBlock');
		s.addremove = true

		o = s.option(form.Flag, 'enabled', 'Enabled');

		o = s.option(form.Value, 'url', 'URL');
		o.default = 'https://antifilter.download/list/domains.lst';
		o.depends('antiblock.config.enabled', '1')

		o = s.option(form.Value, 'file', 'File');
		o.depends('antiblock.config.enabled', '1')

		o = s.option(form.Value, 'DNS', 'DNS');
		o.default = '1.1.1.1:53';
		o.depends('antiblock.config.enabled', '1')

		o = s.option(form.Value, 'listen', 'Listen');
		o.default = '192.168.1.1:5053';
		o.depends('antiblock.config.enabled', '1')

		o = s.option(widgets.DeviceSelect, 'VPN_name', 'VPN name');
		o.depends('antiblock.config.enabled', '1')

		o = s.option(form.Value, 'output', 'Output');
		o.depends('antiblock.config.enabled', '1')

		o = s.option(form.Flag, 'log', 'Log');
		o.depends({ output: '/', '!contains': true })

		o = s.option(form.Flag, 'stat', 'Stat');
		o.depends({ output: '/', '!contains': true })

		return m.render();
	},
});
