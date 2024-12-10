'use strict';
'require view';
'require fs';
'require ui';

var isReadonlyView = !L.hasViewPermission() || null;

return view.extend({
handleSaveApply: null,
handleReset: null,

	load: function() {
		return L.resolveDefault(fs.read('/etc/netdata/netdata.conf'), '');
	},

	handleSave: function(ev) {
		var value = (document.querySelector('textarea').value || '').trim().replace(/\r\n/g, '\n') + '\n';

		return fs.write('/etc/netdata/netdata.conf', value).then(function(rc) {
			document.querySelector('textarea').value = value;
			ui.addNotification(null, E('p', _('Contents have been saved.')), 'info');

			return fs.exec('/etc/init.d/netdata', [ 'reload' ]);
		}).catch(function(e) {
			ui.addNotification(null, E('p', _('Unable to save contents: %s').format(e.message)));
		});
	},

	render: function(conf) {
		return E([
			E('h4', _('Edit Netdata main config: <code>/etc/netdata/netdata.conf</code>')),
			E('p', {}, E('textarea', { 'style': 'width:100%', 'rows': 25, 'disabled': isReadonlyView }, [ conf != null ? conf : '' ]))
		]);
	}
});
