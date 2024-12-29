'use strict';
'require view';
'require dom';
'require ui';
'require form';
'require rpc';
'require uci';
'require network';

let formData = {
	password: {
		pw1: null,
		pw2: null
	},
	wan: {
		section_id: null,
		proto: null,
		ipv4_addr: null,
		netmask: null,
		ipv4_gateway: null,
		ipv6_addr: null,
		ipv6_gateway: null,
		username: null,
		pw3: null
	},
	wifi: {
		section_id_2: null,
		section_id_5: null,
		enabled: null,
		ssid: null,
		pw4: null,
		Ghz_2: null,
		Ghz_5: null
	}
};

let callSetPassword = rpc.declare({
	object: 'luci',
	method: 'setPassword',
	params: ['username', 'password'],
	expect: {
		result: false
	}
});

return view.extend({
	_networks: null,
	_wifiNetworks: null,
	_wifiDevices: null,

	checkPassword: function(section_id, value) {
		let strength = document.querySelector('.cbi-value-description'),
		    strongRegex = new RegExp("^(?=.{8,})(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*\\W).*$", "g"),
		    mediumRegex = new RegExp("^(?=.{7,})(((?=.*[A-Z])(?=.*[a-z]))|((?=.*[A-Z])(?=.*[0-9]))|((?=.*[a-z])(?=.*[0-9]))).*$", "g"),
		    enoughRegex = new RegExp("(?=.{6,}).*", "g");

		if (strength && value.length) {
			if (false == enoughRegex.test(value))
				strength.innerHTML = '%s: <span style="color:red">%s</span>'.format(_('Password strength'), _('More Characters'));
			else if (strongRegex.test(value))
				strength.innerHTML = '%s: <span style="color:green">%s</span>'.format(_('Password strength'), _('Strong'));
			else if (mediumRegex.test(value))
				strength.innerHTML = '%s: <span style="color:orange">%s</span>'.format(_('Password strength'), _('Medium'));
			else
				strength.innerHTML = '%s: <span style="color:red">%s</span>'.format(_('Password strength'), _('Weak'));
		}

		return true;
	},

	load: function () {
		return Promise.all([
			network.getNetworks(),
			network.getWifiNetworks(),
			network.getWifiDevices(),
		]);
	},

	render: function (data) {
		this._networks = data[0];
		this._wifiNetworks = data[1];
		this._wifiDevices = data[2];

		let m, s, o;

		m = new form.JSONMap(formData, _('Setup Wizard'));

		s = m.section(form.NamedSection, 'password', 'password', _('Changes the administrator password for accessing the device'));

		o = s.option(form.Value, 'pw1', _('Password'));
		o.password = true;
		o.validate = this.checkPassword;

		o = s.option(form.Value, 'pw2', _('Confirmation'), ' ');
		o.password = true;
		o.renderWidget = function(/* ... */) {
			let node = form.Value.prototype.renderWidget.apply(this, arguments);

			node.querySelector('input').addEventListener('keydown', function(ev) {
				if (ev.keyCode == 13 && !ev.currentTarget.classList.contains('cbi-input-invalid'))
					document.querySelector('.cbi-button-save').click();
			});

			return node;
		};

		//***************************************
		s = m.section(form.NamedSection, 'wan', 'wan', _('WAN'), _('Changes the connection type of internet'));
		s.anonymous = true;
		s.addremove = false;

		let protocols = network.getProtocols();
		let netWan = null;

		for (let i = 0; i < this._networks.length; i++) {
			if (this._networks[i].getName() == 'wan') {
				netWan = this._networks[i];
				formData.wan.section_id = netWan.getName();
				break;
			}
		}

		o = s.option(form.ListValue, 'proto', _('Protocol'));
		for (let i = 0; i < protocols.length; i++) {
			o.value(protocols[i].getProtocol(), protocols[i].getI18n());
		}
		if (netWan) {
			o.default = netWan.getProtocol(netWan.getName());
		}

		o = s.option(form.Value, 'ipv4_addr', _('IPv4 address'));
		o.datatype = 'ip4addr';
		o.placeholder = '203.0.113.42';
		o.depends('proto', 'static');

		o = s.option(form.ListValue, 'netmask', _('IPv4 netmask'));
		o.datatype = 'ip4addr("nomask")';
		o.depends('proto', 'static');
		o.value('255.255.255.0');
		o.value('255.255.0.0');
		o.value('255.0.0.0');

		o = s.option(form.Value, 'ipv4_gateway', _('IPv4 gateway'));
		o.datatype = 'ip4addr("nomask")';
		o.depends('proto', 'static');
		o.placeholder = '203.0.113.1';

		o = s.option(form.Value, 'ipv6_addr', _('IPv6 address'));
		o.datatype = 'ip6addr';
		o.placeholder = '2001:db8:0:1234:0:567:8:1';
		o.depends('proto', 'static');
		o.rmempty = true;

		o = s.option(form.Value, 'ipv6_gateway', _('IPv6 gateway'));
		o.datatype = 'ip6addr("nomask")';
		o.depends('proto', 'static');
		o.rmempty = true;

		o = s.option(form.Value, 'username', _('PAP/CHAP username'));
		o.depends('proto', 'pppoe');

		o = s.option(form.Value, 'pw3', _('PAP/CHAP password'));
		o.depends('proto', 'pppoe');
		o.password = true;

		//**************************************
		s = m.section(form.NamedSection, 'wifi', 'wifi', _('Wi-Fi'));
		s.anonymous = true;
		s.addremove = false;

		let wifiNet2 = null;
		let wifiNet5 = null;
		let wifiDev2 = null;
		let wifiDev5 = null;

		for (let i = 0; i < this._wifiDevices.length; i++) {
			if (uci.get('wireless', this._wifiDevices[i].getName(), 'band') == '2g') {
				wifiDev2 = this._wifiDevices[i];
				break;
			}
		}
		for (let i = 0; i < this._wifiDevices.length; i++) {
			if (uci.get('wireless', this._wifiDevices[i].getName(), 'band') == '5g') {
				wifiDev5 = this._wifiDevices[i];
				break;
			}
		}

		for (let i = 0; i < this._wifiNetworks.length; i++) {
			let wifiNetwork = this._wifiNetworks[i];
			let device = uci.get('wireless', wifiNetwork.getName(), 'device');
			let wifiBand = uci.get('wireless', device, 'band');
			let wirelessNetwork = uci.get('wireless', wifiNetwork.getName(), 'network');
			if (wirelessNetwork == 'lan') {
				if (wifiBand == '2g') {
					formData.wifi.Ghz_2 = true;
					formData.wifi.section_id_2 = wifiNetwork.getName();
					wifiNet2 = wifiNetwork;
					if (!formData.wifi.ssid) {
						formData.wifi.ssid = uci.get('wireless', wifiNetwork.getName(), 'ssid');
					}
					if (!formData.wifi.pw4) {
						formData.wifi.pw4 = uci.get('wireless', formData.wifi.section_id_2, 'key');
					}
				}
				if (wifiBand == '5g') {
					formData.wifi.Ghz_5 = true;
					formData.wifi.section_id_5 = wifiNetwork.getName();
					wifiNet5 = wifiNetwork;
					if (!formData.wifi.ssid) {
						formData.wifi.ssid = uci.get('wireless', wifiNetwork.getName(), 'ssid');
					}
					if (!formData.wifi.pw4) {
						formData.wifi.pw4 = uci.get('wireless', formData.wifi.section_id_5, 'key');
					}
				}
			}
		}
		if (formData.wifi.Ghz_2 == null && wifiDev2) {
			let device = wifiDev2.getName();
			let wifiNetwork = wifiNet2;
			let wifiNetworkName = wifiNetwork.getName();

			formData.wifi.Ghz_2 = true;
			formData.wifi.wifiNetworkDevice2 = device;
			formData.wifi.wifiNetworkName2 = wifiNetworkName;
		}

		if (formData.wifi.Ghz_5 == null && wifiDev5) {
			let device = wifiDev5.getName();
			let wifiNetwork = wifiNet5;
			let wifiNetworkName = wifiNetwork.getName();

			formData.wifi.Ghz_5 = true;
			formData.wifi.wifiNetworkDevice5 = device;
			formData.wifi.wifiNetworkName5 = wifiNetworkName;
		}

		o = s.option(form.Flag, 'enabled', _('Enabled'));
		o.default = true;

		o = s.option(form.Value, 'SSID', _('Name of Wi-Fi network'));
		o.default = formData.wifi.ssid;

		o = s.option(form.Value, 'pw4', _('Wi-Fi password'));
		o.default = formData.wifi.pw4;
		o.password = true;
		o.validate = this.checkPassword;

		return m.render();
	},

	handleSave: function () {
		let map = document.querySelector('.cbi-map');
		return dom.callClassMethod(map, 'save').then(function () {
			this._saveUciNetwork();
			this._saveUciWifi();
			this._saveUciPassword();

			uci.set('luci', 'main', 'setup_wizard_done', true);
			uci.save();
			// uci.apply();
			dom.callClassMethod(map, 'render');
		});
	},

	_saveUciNetwork: function () {
		uci.set('network', formData.wan.section_id, 'proto', formData.wan.proto);
		switch (formData.wan.proto) {
			case 'dhcp':
				uci.unset('network', formData.wan.section_id, 'ipaddr');
				uci.unset('network', formData.wan.section_id, 'netmask');
				uci.unset('network', formData.wan.section_id, 'gateway');
				return;
			case 'static':
				if (formData.wan.ipv6_addr == null) {
					uci.set('network', formData.wan.section_id, 'ipaddr', formData.wan.ipv4_addr);
					uci.set('network', formData.wan.section_id, 'netmask', formData.wan.netmask);
					uci.set('network', formData.wan.section_id, 'gateway', formData.wan.ipv4_gateway);
					return;
				} else {
					uci.set('network', formData.wan.section_id, 'ip6addr', formData.wan.ipv6_addr);
					uci.set('network', formData.wan.section_id, 'ip6gw', formData.wan.ipv6_gateway);
					return;
				}
			case 'pppoe':
				uci.set('network', formData.wan.section_id, 'username', formData.wan.username);
				uci.set('network', formData.wan.section_id, 'password', formData.wan.pw3);
				return;
		}
	},

	configWifi: function (wifiNetworkName, device, wifiDisabled) {
		let mode = uci.get('wireless', wifiNetworkName, 'mode');
		let encryption = uci.get('wireless', wifiNetworkName, 'encryption');
		let key = uci.get('wireless', wifiNetworkName, 'key');
		let ssid = uci.get('wireless', wifiNetworkName, 'ssid');

		let wifi_id = uci.add('wireless', 'wifi-iface', 'default_radio' + this._wifiNetworks.length);
		uci.set('wireless', wifi_id, 'device', device);
		uci.set('wireless', wifi_id, 'network', 'lan');
		uci.set('wireless', wifi_id, 'mode', mode);
		uci.set('wireless', wifi_id, 'encryption', encryption);
		uci.set('wireless', wifi_id, 'key', key);
		uci.set('wireless', wifi_id, 'ssid', ssid);
		uci.set('wireless', wifi_id, 'ssid', formData.wifi.ssid);
		uci.set('wireless', wifi_id, 'disabled', wifiDisabled);
	},

	_saveUciWifi: function () {
		let wifiDisabled = !formData.wifi.enabled;
		if (wifiDisabled) {
			return null;
		}

		if (formData.wifi.pw4 != null) {
			uci.set('wireless', formData.wifi.section_id_2, 'key', formData.wifi.pw4);
			uci.set('wireless', formData.wifi.section_id_5, 'key', formData.wifi.pw4);
		} else {
			ui.addNotification(null, E('p', _('The password of wifi is empty!')), 'danger');
			return null;
		}

		if (!formData.wifi.ssid) {
			return null
		}
		if (formData.wifi.ssid.includes('OpenWrt')) {
			ui.addNotification(null, E('p', _('Given SSID is not valid!')), 'danger');
			return null;
		}
		this.configWifi(formData.wifi.wifiNetworkName2, formData.wifi.wifiNetworkDevice2, wifiDisabled);
		this.configWifi(formData.wifi.wifiNetworkName5, formData.wifi.wifiNetworkDevice5, wifiDisabled);
		return null;
	},

	_saveUciPassword: function () {
		if (formData.password.pw1 == null || formData.password.pw1.length == 0) {
			return null;
		}

		if (formData.password.pw1 != formData.password.pw2) {
			ui.addNotification(null, E('p', _('Given password confirmation did not match, password not changed!')), 'danger');
			return null;
		}
		if (formData.password.pw1 != null) {
			let success = callSetPassword('root', formData.password.pw1);
			if (success) {
				ui.addNotification(null, E('p', _('The system password has been successfully changed.')), 'info');
			} else {
				ui.addNotification(null, E('p', _('Failed to change the system password.')), 'danger');
			}
			formData.password.pw1 = null;
			formData.password.pw2 = null;
		}
		return null
	},

	handleReset: null

});
