'use strict';
'require view';
'require uci';

return view.extend({
	handleSaveApply: null,
	handleSave: null,
	handleReset: null,

	load() {
		return uci.load('netdata');
	},

	render() {
		var port = uci.get_first('netdata', 'netdata', 'port') || '19999',
			ssl = uci.get_first('netdata', 'netdata', 'enable_ssl') || '0',
			nginx = uci.get_first('netdata', 'netdata', 'nginx_support') || '0';
		if (port === '0')
			return E('div', { class: 'alert-message warning' },
					_('Port 0 is not supported.<br />Change to a other port and try again.'));
		return E('iframe', {
			src: (nginx === '1' ? window.location.protocol : ssl === '1' ? 'https:' : 'http:') + '//' + window.location.hostname + (nginx === '1' ? '/netdata/' : ':' + port),
			style: 'width: 100%; min-height: 100vh; border: none; border-radius: 3px;'
		});
	}
});
