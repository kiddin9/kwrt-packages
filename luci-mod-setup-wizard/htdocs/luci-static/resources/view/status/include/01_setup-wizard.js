'use strict';
'require baseclass';
'require uci';

function redirectToWizard() {
	location.href = L.url('admin/setup-wizard');
}

return baseclass.extend({
	title: _('Setup Wizard'),

	render: function () {
		let isDone = uci.get('luci', 'main', 'setup_wizard_done') == 1;
		if (!isDone) {
			redirectToWizard();
			return null;
		}
		let btn = E('button', {
			'class': 'cbi-button cbi-button-action important',
			'click': redirectToWizard
		}, '🧙 ' + _('Start to setup wizard'));
		return btn;
	}
});