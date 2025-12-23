'use strict';
'require form';
'require poll';
'require rpc';
'require tools.widgets as widgets';
'require uci';
'require view';

var callServiceList = rpc.declare({
	object: 'service',
	method: 'list',
	params: ['name'],
	expect: { '': {} }
});

function getServiceStatus() {
	return L.resolveDefault(callServiceList('mentohust'), {}).then(function (res) {
		var isRunning = false;
		try {
			isRunning = res['mentohust']['instances']['mentohust']['running'];
		} catch (e) { }
		return isRunning;
	});
}

function renderStatus(isRunning) {
	var spanTemp = '<em><span style="color:%s"><strong>%s %s</strong></span></em>';
	var renderHTML;
	if (isRunning) {
		renderHTML = spanTemp.format('green', 'MentoHUST', _('RUNNING'));
	} else {
		renderHTML = spanTemp.format('red', 'MentoHUST', _('NOT RUNNING'));
	}

	return renderHTML;
}

return view.extend({
	render: function() {
		var m, s, o;

		m = new form.Map('mentohust', _('MentoHUST'),
			_('MentoHUST is a program that supports Ruijie authentication on Windows, Linux and Mac OS (with support for Searle authentication).'));

		s = m.section(form.TypedSection);
		s.anonymous = true;
		s.render = function () {
			poll.add(function () {
				return L.resolveDefault(getServiceStatus()).then(function (res) {
					var view = document.getElementById('service_status');
					view.innerHTML = renderStatus(res);
				});
			});

			return E('div', { class: 'cbi-section', id: 'status_bar' }, [
					E('p', { id: 'service_status' }, _('Collecting data...'))
			]);
		}

		s = m.section(form.NamedSection, 'config', 'mentohust');

		o = s.option(form.Flag, 'enable', _('Enable'));
		o.rmempty = false;

		o = s.option(form.Value, 'username', _('Username'));
		o.rmempty = true;

		o = s.option(form.Value, 'password', _('Password'));
		o.rmempty = true;
		
		o = s.option(widgets.DeviceSelect, 'interface',
			_('Network interface'));
		o.filter = function(section_id, value) {
			var dev = this.devices.filter(function(dev) { return dev.getName() == value })[0];
			var excludeDevice = ['docker', 'dummy', 'radio', 'sit', 'teql', 'veth', 'ztly'];
			return (dev && dev.getName() != null && !excludeDevice.some(prefix => dev.getName().startsWith(prefix)));
		}
		o.rmempty = false;

		o = s.option(form.Value, 'ipaddr', _('IP address'),
			_('Leave blank or set 0.0.0.0 to use local IP (DHCP)'));
		o.default = '0.0.0.0';
		o.rmempty = true;

		o = s.option(form.Value, 'gateway', _('Gateway'));
		o.default = '0.0.0.0';
		o.rmempty = false;

		o = s.option(form.Value, 'mask', _('Subnet Mask'));
		o.default = '255.255.255.0';
		o.rmempty = false;

		o = s.option(form.Value, 'dns', _('DNS'));
		o.default = '0.0.0.0';
		o.rmempty = true;

		o = s.option(form.Value, 'ping', _('Ping Host'),
			_('Ping host for drop detection, 0.0.0.0 to turn off this feature.'));
		o.default = '0.0.0.0';
		o.rmempty = false;

		o = s.option(form.Value, 'timeout', _('Authentication Timeout (Seconds)'));
		o.default = '8';
		o.rmempty = false;

		o = s.option(form.Value, 'interval', _('Response Interval (Seconds)'));
		o.default = '30';
		o.rmempty = false;

		o = s.option(form.Value, 'wait', _('Await Failure(Seconds)'));
		o.default = '15';
		o.rmempty = false;

		o = s.option(form.Value, 'fail_number', _('Allow Failure Count'),
			_('Default 0, indicating no limit.'));
		o.default = '0';
		o.rmempty = false;

		o = s.option(form.ListValue, 'multicast_address', _('Multicast Address'));
		o.default = '1';
		o.value('0', _('Standard'));
		o.value('1', _('Ruijie'));
		o.value('2', _('Searle'));

		o = s.option(form.ListValue, 'dhcp_mode', _('DHCP Mode'));
		o.default = '1';
		o.value('0', _('None'));
		o.value('1', _('Two-factor authentication'));
		o.value('2', _('After authentication'));
		o.value('3', _('Before authentication'));

		o = s.option(form.Value, 'dhcp_script', _('DHCP Script'),
			_('Default udhcpc -i'));
		o.default = 'udhcpc -i';
		o.rmempty = true;

		o = s.option(form.Value, 'version', _('Client Version Number'),
			_('Default 0.00，indicating compatibility with xrgsu'));
		o.default = '0.00';
		o.rmempty = false;

		return m.render();
	}
});
