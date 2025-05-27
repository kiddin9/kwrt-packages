'use strict';
'require form';
'require fs';
'require view';
'require uci';

var cfgtypes = ['defaults','interface'];

return view.extend({
	load: function() {
		return Promise.all([
			L.resolveDefault(fs.stat('/usr/bin/httping'), {}),
			L.resolveDefault(fs.stat('/usr/bin/dig'), {}),
			L.resolveDefault(fs.stat('/usr/sbin/glorytun-udp'), {}),
//			L.resolveDefault(fs.stat('/usr/bin/nping'), {}),
//			L.resolveDefault(fs.stat('/usr/bin/arping'), {}),
			uci.load('network')
		]);
	},

	render: function (stats) {
		var m, s, o;

		m = new form.Map('omr-tracker', _('OMR-Tracker - Interfaces'),
			_('Names must match the interface name found in /etc/config/network.') + '<br />' +
			_('Names may contain characters A-Z, a-z, 0-9, _ and no spaces-'));

		//s = m.section(form.GridSection, 'defaults');
		s = m.section(form.GridSection);
		s.addremove = true;
		s.anonymous = false;
		s.nodescriptions = true;
		s.cfgsections = function() {
			return this.map.data.sections(this.map.config)
				.filter(function(s) { return cfgtypes.indexOf(s['.type']) !== -1; })
				.map(function(s) { return s['.name']; });
		};

		s.handleAdd = function(ev) {
			this.sectiontype = 'interface';
			var promise = form.GridSection.prototype.handleAdd.apply(this, arguments);
			this.sectiontype = undefined;
			return promise;
		};

		o = s.option(form.Flag, 'enabled', _('Enabled'));
		o.default = false;

		o = s.option(form.ListValue, 'initial_state', _('Initial state'),
			_('Expect interface state on up event'));
		o.default = 'online';
		o.value('online', _('Online'));
		o.value('offline', _('Offline'));
		o.modalonly = true;

		o = s.option(form.ListValue, 'family', _('Internet Protocol'));
		o.default = 'ipv4';
		o.value('ipv4', _('IPv4'));
		o.value('ipv6', _('IPv6'));
		o.value('ipv4ipv6', _('IPv4 & IPv6'));
		o.modalonly = true;

		o = s.option(form.DynamicList, 'hosts', _('Tracking hostname or IP address'),
			_('This hostname or IP address will be pinged to determine if the link is up or down. Leave blank to use defaults settings.'));
		//o.datatype = 'hosts';
		o.modalonly = true;
		o.rmempty = false;

		o = s.option(form.DynamicList, 'hosts6', _('Tracking hostname or IP address for IPv6'),
			_('This hostname or IP address will be pinged to determine if the link is up or down. Leave blank to use defaults settings.'));
		//o.datatype = 'hosts';
		o.modalonly = true;
		o.depends('family', 'ipv4ipv6');
		o.depends('family', 'ipv6');
		o.rmempty = false;

		o = s.option(form.ListValue, 'type', _('Tracking method'),_('Always ping gateway, then test connection by ping, httping or dns. None mode only ping gateway.'));
		o.default = 'ping';
		o.value('none');
		o.value('ping');
		if (stats[0].type === 'file') {
			o.value('httping');
		}
		if (stats[1].type === 'file') {
			o.value('dns');
		}
		if (stats[2].type === 'file') {
			o.value('glorytun-udp');
		}
		/*
		if (stats[3].type === 'file') {
			o.value('nping-tcp');
			o.value('nping-udp');
			o.value('nping-icmp');
			o.value('nping-arp');
		}
		if (stats[4].type === 'file') {
			o.value('arping');
		}
		*/
		o = s.option(form.Flag, 'server_http_test', _('Server http test'),
			_('Check if connection work with http by sending a request to server API'));
		o.rmempty = false;
		o.modalonly = true;

		o = s.option(form.Flag, 'server_test', _('Server test'),
			_('Check if connection work by sending a ping or http request to server over all interfaces, failed if only current interface is not able to.'));
		o.rmempty = false;
		o.modalonly = true;

		o = s.option(form.Flag, 'mail_alert', _('Mail alert'),
			_('Send a mail when connection status change. You need to configure e-mail settings here.'));
		o.rmempty = false;
		o.modalonly = true;

		/*
		o = s.option(form.Flag, 'httping_ssl', _('Enable ssl tracking'),
			_('Enables https tracking on ssl port 443'));
		o.depends('type', 'httping');
		o.rmempty = false;
		o.modalonly = true;
		*/
		/*
		o = s.option(form.Value, 'reliability', _('Tracking reliability'),
			_('Acceptable values: 1-100. This many Tracking IP addresses must respond for the link to be deemed up'));
		o.datatype = 'range(1, 100)';
		o.default = '1';
		*/
		/*
		o = s.option(form.ListValue, 'glorytun_down', _('Consider path down since'));
		o.depends('type', 'glorytun-udp');
		o.default = 'running';
		o.value('deleting', _('deleting');
		o.value('probing', _('probing');
		o.value('degregated', _('degregated');
		o.value('lossy', _('lossy');
		o.value('waiting', _('waiting');
		o.value('ready', _('ready');
		o.value('running', _('running');
		o.modalonly = true;
		*/

		o = s.option(form.ListValue, 'count', _('Ping count'));
		o.depends('type', 'ping');
		o.depends('type', 'httping');
		o.depends('type', 'dns');
		o.default = '1';
		o.value('1');
		o.value('2');
		o.value('3');
		o.value('4');
		o.value('5');
		o.modalonly = true;

		o = s.option(form.Value, 'size', _('Ping size'));
		o.depends('type', 'ping');
		o.default = '56';
		o.value('8');
		o.value('24');
		o.value('56');
		o.value('120');
		o.value('248');
		o.value('504');
		o.value('1016');
		o.value('1472');
		o.value('2040');
		o.datatype = 'range(1, 65507)';
		o.modalonly = true;

		o =s.option(form.Value, 'max_ttl', _('Max TTL'));
		o.default = '60';
		o.depends('type', 'ping');
		o.value('10');
		o.value('20');
		o.value('30');
		o.value('40');
		o.value('50');
		o.value('60');
		o.value('70');
		o.datatype = 'range(1, 255)';
		o.modalonly = true;

		o = s.option(form.Flag, 'check_quality', _('Check link quality'));
		o.depends('type', 'ping');
		o.default = false;
		o.modalonly = true;

		o = s.option(form.Value, 'failure_latency', _('Failure latency [ms]'));
		o.depends('check_quality', '1');
		o.default = '1000';
		o.value('25');
		o.value('50');
		o.value('75');
		o.value('100');
		o.value('150');
		o.value('200');
		o.value('250');
		o.value('300');
		o.modalonly = true;

		o = s.option(form.Value, 'failure_loss', _('Failure packet loss [%]'));
		o.depends('check_quality', '1');
		o.default = '40';
		o.value('2');
		o.value('5');
		o.value('10');
		o.value('20');
		o.value('25');
		o.modalonly = true;

		o = s.option(form.Value, 'recovery_latency', _('Recovery latency [ms]'));
		o.depends('check_quality', '1');
		o.default = '500';
		o.value('25');
		o.value('50');
		o.value('75');
		o.value('100');
		o.value('150');
		o.value('200');
		o.value('250');
		o.value('300');
		o.modalonly = true;

		o = s.option(form.Value, 'recovery_loss', _('Recovery packet loss [%]'));
		o.depends('check_quality', '1');
		o.default = '10';
		o.value('2');
		o.value('5');
		o.value('10');
		o.value('20');
		o.value('25');
		o.modalonly = true;

		o = s.option(form.Value, "timeout", _("Ping timeout"));
		o.default = '4';
		o.value('1', _('%d second').format('1'));
		for (var i = 2; i <= 10; i++)
			o.value(String(i), _('%d seconds').format(i));
		o.rmempty = false;
		o.modalonly = true;

		o = s.option(form.Value, 'interval', _('Ping interval'));
		o.default = '10';
		o.value('1', _('%d second').format('1'));
		o.value('3', _('%d seconds').format('3'));
		o.value('5', _('%d seconds').format('5'));
		o.value('10', _('%d seconds').format('10'));
		o.value('20', _('%d seconds').format('20'));
		o.value('30', _('%d seconds').format('30'));
		o.value('60', _('%d minute').format('1'));
		o.value('300', _('%d minutes').format('5'));
		o.value('600', _('%d minutes').format('10'));
		o.value('900', _('%d minutes').format('15'));
		o.value('1800', _('%d minutes').format('30'));
		o.value('3600', _('%d hour').format('1'));
		o.modalonly = true;
		o.rmempty = false;

		o = s.option(form.Value, 'failure_interval', _('Failure interval'),
			_('Ping interval during failure detection'));
		o.default = '5';
		o.value('1', _('%d second').format('1'));
		o.value('3', _('%d seconds').format('3'));
		o.value('5', _('%d seconds').format('5'));
		o.value('10', _('%d seconds').format('10'));
		o.value('20', _('%d seconds').format('20'));
		o.value('30', _('%d seconds').format('30'));
		o.value('60', _('%d minute').format('1'));
		o.value('300', _('%d minutes').format('5'));
		o.value('600', _('%d minutes').format('10'));
		o.value('900', _('%d minutes').format('15'));
		o.value('1800', _('%d minutes').format('30'));
		o.value('3600', _('%d hour').format('1'));
		o.modalonly = true;

		o = s.option(form.Flag, 'keep_failure_interval', _('Keep failure interval'),
			_('Keep ping failure interval during failure state'));
		o.default = false;
		o.modalonly = true;

		o = s.option(form.ListValue, 'tries', _('Interface down'),
			_('Interface will be deemed down after this many failed ping tests'));
		o.default = '5';
		o.value('1');
		o.value('2');
		o.value('3');
		o.value('4');
		o.value('5');
		o.value('6');
		o.value('7');
		o.value('8');
		o.value('9');
		o.value('10');

		o = s.option(form.ListValue, 'tries_up', _('Interface up'),
			_('Downed interface will be deemed up after this many successful ping tests'));
		o.default = "5";
		o.value('1');
		o.value('2');
		o.value('3');
		o.value('4');
		o.value('5');
		o.value('6');
		o.value('7');
		o.value('8');
		o.value('9');
		o.value('10');

		o = s.option(form.Flag, 'restart_down', _('Restart if down'),
			_('Restart interface if detected as down.'));
		o.rmempty = false;
		o.modalonly = true;


		/*
		o = s.option(form.DynamicList, 'flush_conntrack', _('Flush conntrack table'),
			_('Flush global firewall conntrack table on interface events'));
		o.value('ifup', _('ifup (netifd)'));
		o.value('ifdown', _('ifdown (netifd)'));
		o.modalonly = true;
		*/

		return m.render();
	}
})
