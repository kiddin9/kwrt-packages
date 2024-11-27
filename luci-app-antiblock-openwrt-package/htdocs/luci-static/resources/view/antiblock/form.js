'use strict';
'require view';
'require form';
'require tools.widgets as widgets';

return view.extend({
	render: function () {
		var m, s, o;

		m = new form.Map('antiblock', 'AntiBlock');

		s = m.section(form.TypedSection, 'antiblock', 'AntiBlock');
		s.anonymous = true;
		s.addremove = true;

		s.tab('general', 'General Settings');

		o = s.taboption('general', form.Value, 'url', 'URL');
		o.default = 'https://antifilter.download/list/domains.lst';

		o = s.taboption('general', form.Value, 'file', 'File');
		o.default = '';

		o = s.taboption('general', form.Value, 'DNS', 'DNS');
		o.default = '1.1.1.1:53';

		o = s.taboption('general', form.Value, 'listen', 'Listen');
		o.default = '192.168.1.1:5053';

		o = s.taboption('general', widgets.DeviceSelect, 'VPN_name', 'VPN name');

		o = s.taboption('general', form.Value, 'output', 'Output');
		o.default = '';

		o = s.taboption('general', form.Flag, 'log', 'Log');
		o.depends({ output: "/", "!contains": true })

		o = s.taboption('general', form.Flag, 'stat', 'Stat');
		o.depends({ output: "/", "!contains": true })

		return m.render();
	},
});
