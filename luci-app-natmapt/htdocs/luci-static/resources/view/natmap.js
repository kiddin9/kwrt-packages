'use strict';
'require form';
'require fs';
'require ui';
'require uci';
'require rpc';
'require view';
'require network';
'require tools.widgets as widgets';

const conf = 'natmap';
const natmap_instance = 'natmap';
const nattest_fw_rulename = 'natmap-natest';
const nattest_result_path = '/tmp/natmap-natBehavior';
const etc_path = '/etc/natmap';

const callServiceList = rpc.declare({
	object: 'service',
	method: 'list',
	params: ['name'],
	expect: { '': {} }
});

const callHostHints = rpc.declare({
	object: 'luci-rpc',
	method: 'getHostHints',
	expect: { '': {} }
});

const callGetCongestions = rpc.declare({
	object: 'luci.natmap',
	method: 'get_congestions',
	expect: { '': {} }
});

function getInstances() {
	return L.resolveDefault(callServiceList(conf), {}).then((res) => {
		try {
			return res[conf].instances || {};
		} catch (e) {}
		return {};
	});
}

function getStatus() {
	return getInstances().then((instances) => {
		let promises = [];
		let status = {};
		for (let key in instances) {
			let i = instances[key];
			if (i.running && i.pid) {
				let f = '/var/run/natmap/' + i.pid + '.json';
				((k) => {
					promises.push(fs.read(f).then((res) => {
						status[k] = JSON.parse(res);
					}).catch((e) =>{}));
				})(key);
			}
		}
		return Promise.all(promises).then(() => { return status; });
	});
}

function transformHostHints(family, hosts, html) {
	let choice_values = [];
	let choice_labels = {};
	let ip6addrs = {};
	let ipaddrs = {};

	for (let mac in hosts) {
		L.toArray(hosts[mac].ipaddrs || hosts[mac].ipv4).forEach((ip) => {
			ipaddrs[ip] = hosts[mac].name || mac;
		});

		L.toArray(hosts[mac].ip6addrs || hosts[mac].ipv6).forEach((ip) => {
			ip6addrs[ip] = hosts[mac].name || mac;
		});
	}

	if (!family || family == 'ipv4') {
		L.sortedKeys(ipaddrs, null, 'addr').forEach((ip) => {
			let val = ip;
			let txt = ipaddrs[ip];

			choice_values.push(val);
			choice_labels[val] = html ? E([], [ val, ' (', E('strong', {}, [txt]), ')' ]) : '%s (%s)'.format(val, txt);
		});
	}

	if (!family || family == 'ipv6') {
		L.sortedKeys(ip6addrs, null, 'addr').forEach((ip) => {
			let val = ip;
			let txt = ip6addrs[ip];

			choice_values.push(val);
			choice_labels[val] = html ? E([], [ val, ' (', E('strong', {}, [txt]), ')' ]) : '%s (%s)'.format(val, txt);
		});
	}

	return [choice_values, choice_labels];
}

return view.extend({
	load() {
	return Promise.all([
		getStatus(),
		network.getWANNetworks(),
		L.resolveDefault(fs.stat('/usr/bin/stunclient'), null),
		L.resolveDefault(fs.read(nattest_result_path), null),
		callHostHints(),
		L.resolveDefault(fs.list(etc_path + '/client'), []),
		L.resolveDefault(fs.list(etc_path + '/notify'), []),
		L.resolveDefault(fs.list(etc_path + '/ddns'), []),
		callGetCongestions().then((res) => { return res.algorithm }),
		uci.load('firewall'),
		uci.load('natmap')
	]);
	},

	render(res) {
		const status = res[0];
		const wans = res[1];
		const has_stunclient = res[2] ? res[2].path : null;
		const nattest_result = res[3] ? res[3].trim() : '';
		const hosts = res[4];
		const scripts_client = res[5] ? res[5] : [];
		const scripts_notify = res[6] ? res[6] : [];
		const scripts_ddns = res[7] ? res[7] : [];
		const congestions = res[8];

		let m, s, o;

		m = new form.Map('natmap', _('NATMap'));

		s = m.section(form.TypedSection, 'global');
		s.anonymous = true;

		o = s.option(form.Button, '_reload', _('Reload'));
		o.inputtitle = _('Reload');
		o.inputstyle = 'apply';
		o.onclick = function() {
			return fs.exec('/etc/init.d/natmap', ['reload', ''])
				.then((res) => { return window.location = window.location.href.split('#')[0] })
				.catch((e) => { ui.addNotification(null, E('p', e.message), 'error') });
		};

		o = s.option(form.Flag, 'enable', _('Enable'));
		o.default = o.disabled;
		o.rmempty = false;

		o = s.option(form.Value, 'def_tcp_stun', _('Default ') + _('TCP STUN ') + _('Server'),
			_('Available server <a href="%s" target="_blank">references</a>')
				.format(_('https://github.com/muink/rfc5780-stun-server/blob/master/valid_hosts_rfc5780_tcp.txt')));
		o.datatype = 'or(hostname, hostport)';
		o.rmempty = false;

		o = s.option(form.Value, 'def_udp_stun', _('Default ') + _('UDP STUN ') + _('Server'),
			_('Available server <a href="%s" target="_blank">references</a>')
				.format(_('https://github.com/muink/rfc5780-stun-server/blob/master/valid_hosts_rfc5780.txt')));
		o.datatype = 'or(hostname, hostport)';
		o.rmempty = false;

		o = s.option(form.Value, 'def_http_server', _('Default ') + _('HTTP keep-alive ') + _('Server'));
		o.datatype = 'or(hostname, hostport)';
		o.rmempty = false;

		o = s.option(form.Value, 'def_fwmark_value', _('Default ') + _('Fwmark value'));
		o.rmempty = true;

		o = s.option(form.Value, 'def_tcp_interval', _('Default ') + _('TCP ') + _('keep-alive interval (seconds)'));
		o.datatype = "and(uinteger, min(1))";
		o.default = 30;
		o.rmempty = false;

		o = s.option(form.Value, 'def_udp_interval', _('Default ') + _('UDP ') + _('keep-alive interval (seconds)'));
		o.datatype = "and(uinteger, min(1))";
		o.default = 15;
		o.rmempty = false;

		o = s.option(form.Value, 'def_udp_stun_cycle', _('Default ') + _('UDP ') + _('STUN check cycle (once every n intervals)'));
		o.datatype = 'uinteger';
		o.default = 5;
		o.rmempty = false;

		o = s.option(form.Value, 'test_port', _('NATBehavior-Test port open on'), _('Please check <a href="%s"><b>Firewall Rules</b></a> to avoid port conflicts.</br>')
			.format(L.url('admin', 'network', 'firewall'))
			+ _('luci check may not detect all conflicts.'));
		o.datatype = "and(port, min(1))";
		o.placeholder = 3445;
		o.rmempty = false;
		o.validate = function(section_id, value) {
			let conf = 'firewall';
			let fw_forwards = uci.sections(conf, 'redirect');
			let fw_rules = uci.sections(conf, 'rule');

			for (let i = 0; i < fw_forwards.length; i++) {
				let sid = fw_forwards[i]['.name'];
				if (value == uci.get(conf, sid, 'src_dport'))
					return _('This port is already used');
			};

			for (let i = 0; i < fw_rules.length; i++) {
				let sid = fw_rules[i]['.name'];
				if (uci.get(conf, sid, 'name') == nattest_fw_rulename)
					continue;
				if ( (uci.get(conf, sid, 'dest') || '') == '' ) {
					if (value == uci.get(conf, sid, 'dest_port'))
						return _('This port is already used');
				} else {
					// dest not this device
					continue;
				}
			};

			return true;
		};
		o.write = function(section_id, value) {
			uci.set(conf, section_id, 'test_port', value);

			let found = false;
			let fwcfg = 'firewall';
			let rules = uci.sections(fwcfg, 'rule');
			for (let i = 0; i < rules.length; i++) {
				let sid = rules[i]['.name'];
				if (uci.get(fwcfg, sid, 'name') == nattest_fw_rulename) {
					found = sid;
					break;
				}
			};

			let wan_zone = 'wan';
			if(wans) {
				let def_wan = wans[0].getName();
				let zones = uci.sections(fwcfg, 'zone');
				for (let i = 0; i < zones.length; i++) {
					let sid = zones[i]['.name'];
					if (uci.get(fwcfg, sid, 'masq') == 1) {
						wan_zone = uci.get(fwcfg, sid, 'name');
						break;
					}
				}
			} else {
				for (let i = 0; i < rules.length; i++) {
					let sid = rules[i]['.name'];
					if (uci.get(fwcfg, sid, 'src')) {
						wan_zone = uci.get(fwcfg, sid, 'src');
						break;
					}
				}
			};

			if(found) {
				if (value != uci.get(fwcfg, found, 'dest_port'))
					uci.set(fwcfg, found, 'dest_port', value);
					//fs.exec('/etc/init.d/firewall', ['reload']); // reload on init.d/natmap:service_triggers
			} else {
				let sid = uci.add(fwcfg, 'rule');
				uci.set(fwcfg, sid, 'name', nattest_fw_rulename);
				uci.set(fwcfg, sid, 'src', wan_zone);
				uci.set(fwcfg, sid, 'dest_port', value);
				uci.set(fwcfg, sid, 'target', 'ACCEPT');
				//fs.exec('/etc/init.d/firewall', ['reload']); // reload on init.d/natmap:service_triggers
			}
		};

		o = s.option(form.Button, '_nattest', _('Check NAT Behavior'));
		o.inputtitle = _('Check');
		o.inputstyle = 'apply';
		if (! has_stunclient) {
			o.description = _('To check NAT Behavior you need to install <a href="%s"><b>stuntman-client</b></a> first')
				.format('https://github.com/muink/openwrt-stuntman');
			o.readonly = true;
		}
		o.onclick = function() {
			let test_port = uci.get_first(conf, 'global', 'test_port');
			let udp_stun_host = uci.get_first(conf, 'global', 'def_udp_stun');
			let tcp_stun_host = uci.get_first(conf, 'global', 'def_tcp_stun');

			return fs.exec('/usr/libexec/natmap/natcheck.sh', [udp_stun_host + ':3478', tcp_stun_host + ':3478', test_port, nattest_result_path])
				.then((res) => { return window.location = window.location.href.split('#')[0] })
				.catch((e) => { ui.addNotification(null, E('p', e.message), 'error') });
		};

		if (nattest_result.length) {
			o = s.option(form.DummyValue, '_nattest_result', '　');
			o.rawhtml = true;
			o.cfgvalue = function(s) {
				return '<details><summary>' + _('Expand/Collapse result') + '</summary>' + nattest_result + '</details>';
			}
		};

		s = m.section(form.GridSection, 'natmap');
		s.sortable  = true;
		s.addremove = true;
		s.anonymous = true;
		s.nodescriptions = true;

		s.tab('general', _('General Settings'));
		s.tab('forward', _('Forward Settings'));
		s.tab('notify', _('Notify Scripts'));
		s.tab('ddns', _('DDNS Scripts'));
		s.tab('custom', _('Custom Script'));

		o = s.option(form.Flag, 'enable', _('Enable'));
		o.default = o.disabled;
		o.editable = true;
		o.rmempty = true;
		o.modalonly = false;

		o = s.taboption('general', form.Value, 'interval', _('Keep-alive interval'));
		o.datatype = "and(uinteger, min(1))";
		o.rmempty = true;
		o.modalonly = true;

		o = s.taboption('general', form.Value, 'stun_cycle', _('STUN check cycle (once every n intervals)'), _('For UDP mode'));
		o.datatype = 'uinteger';
		o.rmempty = true;
		o.modalonly = true;

		o = s.taboption('general', form.Value, 'stun_server', _('STUN server'));
		o.datatype = 'or(hostname, hostport)';
		o.rmempty = true;
		o.modalonly = true;

		o = s.taboption('general', form.Value, 'http_server', _('HTTP server'), _('For TCP mode'));
		o.datatype = 'or(hostname, hostport)';
		o.rmempty = true;
		o.modalonly = true;

		o = s.taboption('general', form.Value, 'fwmark_value', _('Fwmark value'), _('Mark fwmark for STUN/HTTP outbound traffic'));
		o.rmempty = true;
		o.modalonly = true;

		o = s.taboption('general', form.Value, 'comment', _('Comment'));
		o.rmempty = true;

		o = s.taboption('general', form.ListValue, 'udp_mode', _('Protocol'));
		o.default = '0';
		o.value('0', 'TCP');
		o.value('1', 'UDP');
		o.textvalue = function(section_id) {
			let cval = this.cfgvalue(section_id);
			let i = this.keylist.indexOf(cval);
			return this.vallist[i];
		};

		o = s.taboption('general', form.ListValue, 'family', _('Restrict to address family'));
		o.default = 'ipv4';
		o.value('ipv4', _('IPv4'));
		o.value('ipv6', _('IPv6'));
		o.textvalue = function(section_id) {
			let cval = this.cfgvalue(section_id);
			let i = this.keylist.indexOf(cval);
			return this.vallist[i];
		};
		o.validate = function(section_id, value) {
			let opt = this.section.getOption('forward_target').getUIElement(section_id),
			choices = transformHostHints(value, hosts, true);

			opt.clearChoices();
			opt.addChoices([
				'127.0.0.1',
				'0.0.0.0'
			],
			{
				'127.0.0.1': '127.0.0.1/::1 (<strong>%s</strong>)'.format(_('This device default Lan')),
				'0.0.0.0': '0.0.0.0/:: (<strong>%s</strong>)'.format(_('This device default Wan'))
			});
			opt.addChoices(choices[0], choices[1]);

			return true;
		};

		o = s.taboption('general', widgets.DeviceSelect, 'bind_ifname', _('Interface'));
		o.multiple = false;
		o.noaliases = true;
		o.nobridges = true;
		o.nocreate = false;
		o.rmempty = true;

		o = s.taboption('general', form.Value, 'port', _('Bind port'),
			_('Note: After using <code>portrange</code>, the public ports will be opened in rotation</br>') +
			_('If you enable <b>Notify Scripts</b>, you will be bombarded with messages'));
		o.datatype = "or(port, portrange)";
		o.rmempty = false;
		o.validate = function(section_id, value) {
			let regexp = new RegExp(/^([1-9]\d*)(-([1-9]\d*))?$/)

			if (!regexp.test(value))
				return _('Expecting: %s').format(_('Non-0 port'));

			return true;
		};

		o = s.taboption('general', form.Flag, 'port_pointer', _('Randomly allocation ports'),
			_('Allocation ports randomly instead of sequentially.'));
		o.default = o.disabled;
		o.depends({port: /^[1-9]\d*-[1-9]\d*$/});
		o.modalonly = true;

		o = s.taboption('forward', form.Flag, 'forward', _('Forward mode'));
		o.default = o.disabled;
		o.rmempty = false;
		o.textvalue = function(section_id) {
			let cval = this.cfgvalue(section_id) || this.default;
			let mode = function() {
				let cval = this.cfgvalue(section_id) || this.default;
				let i = this.keylist.indexOf(cval);
				return [this.vallist[i], cval];
			}.call(s.getOption('forward_mode'));
			let loopback = function() {
				let cval = this.cfgvalue(section_id) || this.default;
				return (cval == this.enabled) ? ' L' : '';
			}.call(s.getOption('natloopback'));
			return (cval == this.enabled) ? mode[0] + (mode[1] === 'dnat' ? loopback : '') : _('No');
		};

		o = s.taboption('forward', form.ListValue, 'forward_mode', _('Forward method'), _('The DNAT method not support under IPv6'));
		o.value('dnat', _('Firewall DNAT'));
		o.value('via', _('Via natmap'));
		o.default = 'via';
		o.rmempty = false;
		o.retain = true;
		o.depends('forward', '1');
		o.modalonly = true;
		o.validate = function(section_id, value) {
			let family = function() {
				let E = document.getElementById('widget.' + this.cbid(section_id).match(/.+\./) + 'family');
				let i = E ? E.selectedIndex : null;
				return E ? E.options[i].value : null;
			}.call(s.getOption('family'));

			if (value == 'dnat' && family == 'ipv6')
				return _('The DNAT method not support under IPv6');

			return true;
		};

		o = s.taboption('forward', form.Flag, 'natloopback', _('NAT loopback'));
		o.default = o.enabled;
		o.rmempty = true;
		o.retain = true;
		o.depends('forward_mode', 'dnat');
		o.modalonly = true;

		o = s.taboption('forward', form.ListValue, 'forward_congestion', _('TCP Congestion control'), _('For TCP mode'));
		o.value('', _('Default'));
		congestions.forEach((res) => {
			o.value.apply(o, [res]);
		})
		o.rmempty = true;
		o.depends('forward_mode', 'via');
		o.modalonly = true;

		o = s.taboption('forward', form.Value, 'forward_timeout', _('Forward timeout'), _('Port forwarding session idle timeout in seconds'));
		o.datatype = "and(uinteger, min(1))";
		o.placeholder = '300000';
		o.rmempty = true;
		o.depends('forward_mode', 'via');
		o.modalonly = true;

		o = s.taboption('forward', form.Value, 'forward_target', _('Forward target'));
		o.datatype = 'or(hostname,ipaddr(1))';
		o.value('127.0.0.1', '127.0.0.1/::1 (%s)'.format(_('This device default Lan')));
		o.value('0.0.0.0', '0.0.0.0/:: (%s)'.format(_('This device default Wan')));
		o.default = '127.0.0.1';
		o.validate = function(section_id, value) {
			const forward_mode = this.section.getUIElement(section_id, 'forward_mode').getValue();

			if (new RegExp(/[a-zA-Z]/).test(value) && forward_mode === 'dnat')
				return _('Expecting: %s').format(_('The hostname not support under DNAT mode'));

			return true;
		}
		o.rmempty = false;
		o.retain = true;
		o.depends('forward', '1');

		((labels) => {
			for (let val in labels)
				o.value(val, labels[val]);
		})(transformHostHints(null, hosts, false)[1]);

		o.textvalue = function(section_id) {
			let cval = this.cfgvalue(section_id);
			let i = this.keylist.indexOf(cval);
			let enforward = function() {
				let cval = this.cfgvalue(section_id) || this.default;
				return (cval == this.enabled) ? true : false;
			}.call(s.getOption('forward'));
			return enforward ? this.vallist[i] ?? cval : _('No');
		};

		o = s.taboption('forward', form.Value, 'forward_port', _('Forward target port'), _('Set 0 will follow Public port'));
		o.datatype = 'port';
		o.rmempty = false;
		o.retain = true;
		o.depends('forward', '1');
		o.textvalue = function(section_id) {
			let cval = this.cfgvalue(section_id) || this.default;
			let enforward = function() {
				let cval = this.cfgvalue(section_id) || this.default;
				return (cval == this.enabled) ? true : false;
			}.call(s.getOption('forward'));
			let refresh = function() {
				let cval = this.cfgvalue(section_id) || this.default;
				return (cval == this.enabled) ? true : false;
			}.call(s.getOption('refresh'));
			let cltname = function() {
				let cval = this.cfgvalue(section_id) || this.default;
				let i = this.keylist.indexOf(cval);
				return this.vallist[i];
			}.call(s.getOption('clt_script'));
			return enforward ? ((cval == '0' && refresh) ? cltname : cval) : _('No');
		};

		o = s.taboption('forward', form.Flag, 'refresh', _('Refresh client listen port'));
		o.default = o.enabled;
		o.rmempty = false;
		o.retain = true;
		o.depends('forward_port', '0');
		o.modalonly = true;

		o = s.taboption('forward', form.ListValue, 'clt_script', _('Refresh Scripts'));
		o.datatype = 'file';
		o.rmempty = false;
		o.retain = true;
		o.depends('refresh', '1');
		o.modalonly = true;

		if (scripts_client.length)
			scripts_client.forEach((script) => {
				o.value(etc_path + '/client/' + script.name, script.name);
			});

		o = s.taboption('forward', form.ListValue, 'clt_scheme', _('URI Scheme'));
		o.value('http', 'HTTP');
		o.value('https', 'HTTPS');
		o.default = 'http';
		o.rmempty = false;
		o.retain = true;
		o.depends('refresh', '1');
		o.modalonly = true;

		o = s.taboption('forward', form.Value, 'clt_web_port', _('Web UI Port'));
		o.datatype = "and(port, min(1))";
		o.default = '8080';
		o.rmempty = false;
		o.retain = true;
		o.depends('refresh', '1');
		o.modalonly = true;

		o = s.taboption('forward', form.Value, 'clt_username', _('Username'));
		o.rmempty = true;
		o.retain = true;
		o.depends('refresh', '1');
		o.modalonly = true;

		o = s.taboption('forward', form.Value, 'clt_password', _('Password'));
		o.password = true;
		o.rmempty = true;
		o.depends('refresh', '1');
		o.modalonly = true;

		o = s.option(form.DummyValue, '_external_ip', _('External IP'));
		o.modalonly = false;
		o.textvalue = function(section_id) {
			let s = status[section_id];
			if (s) return s.ip;
		};

		o = s.option(form.DummyValue, '_external_port', _('External Port'));
		o.modalonly = false;
		o.textvalue = function(section_id) {
			let s = status[section_id];
			if (s) return s.port;
		};

		o = s.taboption('notify', form.Flag, 'notify_enable', _('EnNotify'));
		o.default = o.disabled;
		o.editable = true;
		o.rmempty = true;

		o = s.taboption('notify', form.ListValue, 'notify_script', _('Notify Scripts'));
		o.datatype = 'file';
		o.rmempty = false;
		o.modalonly = true;

		if (scripts_notify.length)
			scripts_notify.forEach((script) => {
				o.value(etc_path + '/notify/' + script.name, script.name);
			});

		o = s.taboption('notify', form.DynamicList, 'notify_tokens', _('Tokens'),
			_('The KEY required by the script above. ' +
				'See <a href="%s" target="_blank">%s</a> for the format of KEY required by each script. ' +
				'Add multiple entries here in KEY=VAL shell variable format to supply multiple KEY variables.')
			.format('https://github.com/muink/openwrt-natmapt/tree/master/files/notify/', _('<code># All external tokens required</code> Field')));
		o.datatype = 'list(string)';
		o.placeholder = 'KEY=VAL';
		o.rmempty = true;
		o.modalonly = true;

		o = s.taboption('notify', form.Value, 'notify_custom_domain', _('Private API Domain'));
		o.datatype = 'hostname';
		o.placeholder = 'api.example.com';
		o.rmempty = true;
		o.modalonly = true;

		o = s.taboption('notify', form.Value, 'notify_text', _('Text content'));
		o.placeholder = 'NATMap: <comment>: [<protocol>] <inner_ip>:<inner_port> -> <ip>:<port>';
		o.rmempty = true;
		o.modalonly = true;

		o = s.taboption('ddns', form.Flag, 'ddns_enable', _('EnDDNS'));
		o.default = o.disabled;
		o.editable = true;
		o.rmempty = true;

		o = s.taboption('ddns', form.ListValue, 'ddns_script', _('DDNS Scripts'));
		o.datatype = 'file';
		o.rmempty = false;
		o.modalonly = true;

		if (scripts_ddns.length)
			scripts_ddns.forEach((script) => {
				o.value(etc_path + '/ddns/' + script.name, script.name);
			});

		o = s.taboption('ddns', form.DynamicList, 'ddns_tokens', _('Tokens'),
			_('The KEY required by the script above. ' +
				'See <a href="%s" target="_blank">%s</a> for the format of KEY required by each script. ' +
				'Add multiple entries here in KEY=VAL shell variable format to supply multiple KEY variables.')
			.format('https://github.com/muink/openwrt-natmapt/tree/master/files/ddns/', _('<code># All external tokens required</code> Field')));
		o.datatype = 'list(string)';
		o.placeholder = 'KEY=VAL';
		o.rmempty = true;
		o.modalonly = true;

		o = s.taboption('ddns', form.Value, 'ddns_a', _('A Record ') + _('FQDN'));
		o.datatype = 'hostname';
		o.placeholder = 'www.example.com';
		o.rmempty = true;
		o.depends('family', 'ipv4');
		o.modalonly = true;

		o = s.taboption('ddns', form.Value, 'ddns_aaaa', _('AAAA Record ') + _('FQDN'));
		o.datatype = 'hostname';
		o.placeholder = 'ipv6.example.com';
		o.rmempty = true;
		o.depends('family', 'ipv6');
		o.modalonly = true;

		o = s.taboption('ddns', form.DummyValue, '_ddns_srv_dump', _('SRV Record'));
		o.rawhtml = false;
		o.cfgvalue = function(section_id) {
			let fqdn = uci.get(conf, section_id, 'ddns_srv');
			let serv = uci.get(conf, section_id, 'ddns_srv_serv');
			let prot = uci.get(conf, section_id, 'ddns_srv_proto');
			let targ = uci.get(conf, section_id, 'ddns_srv_target') || fqdn;
			let prio = uci.get(conf, section_id, 'ddns_srv_priority');
			let weig = uci.get(conf, section_id, 'ddns_srv_weight');

			if ( fqdn && serv && prot && targ && prio && weig )
				return '_' + serv + '._' + prot + '.' + fqdn + '. <TTL> IN SRV　' + prio + ' ' + weig + ' <port> ' + targ + '.';
		};
		o.modalonly = true;

		o = s.taboption('ddns', form.Value, 'ddns_srv', _('FQDN'));
		o.datatype = 'hostname';
		o.placeholder = 'mc.example.com';
		o.rmempty = true;
		o.modalonly = true;

		o = s.taboption('ddns', form.Value, 'ddns_srv_serv', _('Service'), _('Can refer to RFC8552'));
		o.value('http');
		o.value('minecraft');
		o.value('factorio');
		o.default = 'minecraft';
		o.rmempty = false;
		o.depends({ ddns_srv: "", "!reverse": true })
		o.modalonly = true;

		o = s.taboption('ddns', form.Value, 'ddns_srv_proto', _('Protocol'), _('Can refer to RFC8552'));
		o.value('tcp', _('TCP'));
		o.value('udp', _('UDP'));
		o.value('tls', _('TLS'));
		o.default = 'tcp';
		o.rmempty = false;
		o.depends({ ddns_srv: "", "!reverse": true })
		o.modalonly = true;

		o = s.taboption('ddns', form.Value, 'ddns_srv_target', _('Target'));
		o.datatype = 'hostname';
		o.placeholder = 'cdn.example.com';
		o.rmempty = true;
		o.depends({ ddns_srv: "", "!reverse": true })
		o.modalonly = true;

		o = s.taboption('ddns', form.Value, 'ddns_srv_priority', _('Priority'));
		o.datatype = 'range(0, 65535)';
		o.default = 0;
		o.rmempty = true;
		o.depends({ ddns_srv: "", "!reverse": true })
		o.modalonly = true;

		o = s.taboption('ddns', form.Value, 'ddns_srv_weight', _('Weight'));
		o.datatype = 'range(0, 65535)';
		o.default = 65535;
		o.rmempty = true;
		o.depends({ ddns_srv: "", "!reverse": true })
		o.modalonly = true;

		o = s.taboption('ddns', form.DummyValue, '_ddns_https_dump', _('HTTPS Record'));
		o.rawhtml = false;
		o.cfgvalue = function(section_id) {
			let fqdn = uci.get(conf, section_id, 'ddns_https');
			let targ = uci.get(conf, section_id, 'ddns_https_target');
			let svcp = uci.get(conf, section_id, 'ddns_https_svcparams');
			let prio = uci.get(conf, section_id, 'ddns_https_priority');

			if ( fqdn && targ && svcp && prio )
				return fqdn + '. <TTL> IN HTTPS　' + prio + ' ' + targ + ' ' + svcp;
		};
		o.modalonly = true;

		o = s.taboption('ddns', form.Value, 'ddns_https', _('FQDN'));
		o.datatype = 'hostname';
		o.placeholder = 'www.example.com';
		o.rmempty = true;
		o.modalonly = true;

		o = s.taboption('ddns', form.Value, 'ddns_https_target', _('Target'));
		o.datatype = "or('.', hostname)";
		o.placeholder = '. or web.example.com';
		o.default = '.';
		o.rmempty = true;
		o.depends({ ddns_https: "", "!reverse": true })
		o.modalonly = true;

		o = s.taboption('ddns', form.Value, 'ddns_https_svcparams', _('SvcParams'));
		o.placeholder = 'alpn="h3,h3-29,h2,http/1.1" ipv4hint= ipv6hint= port=';
		o.default = 'alpn="h2,http/1.1"';
		o.rmempty = true;
		o.depends({ ddns_https: "", "!reverse": true })
		o.modalonly = true;

		o = s.taboption('ddns', form.Value, 'ddns_https_priority', _('Priority'));
		o.datatype = 'range(1, 65535)';
		o.default = 1;
		o.rmempty = true;
		o.depends({ ddns_https: "", "!reverse": true })
		o.modalonly = true;

		o = s.taboption('custom', form.Value, 'custom_script', _('Custom Script'));
		o.datatype = 'file';
		o.modalonly = true;

		o = s.option(form.Button, '_reload');
		o.inputtitle = _('⭮');
		o.inputstyle = 'apply';
		o.onclick = function(ev, section_id) {
			return fs.exec('/etc/init.d/natmap', ['reload', section_id])
				.catch((e) => { ui.addNotification(null, E('p', e.message), 'error') });
		};
		o.editable = true;
		o.modalonly = false;

		return m.render();
	}
});
