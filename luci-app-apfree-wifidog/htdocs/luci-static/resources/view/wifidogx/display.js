'use strict';
'require view';
'require network';
'require request';
'require fs';
'require ui';
'require uci';
'require rpc';
'require dom';
'require poll';

var chartRegistry = {},
	trafficPeriods = [],
	trafficData = { columns: [], data: [] },
	hostNames = {}, // mac => hostname
	hostInfo = {}, // ip => mac
	ouiData = [],
	hostNameMacSectionId = "";
var l7proto = {};

return view.extend({
	loadHostNames: async function() {
		try {
			await uci.sections('hostnames', "hostname", function (params) {
				hostNameMacSectionId = params['.name'];
				for (var key in params) {
					if (key.startsWith('.')) continue;
					var macAddr = key.split('_').join(':');
					hostNames[macAddr] = params[key];
				}
			});

			const dhcpLeases = await fs.exec_direct('/usr/bin/awk', ['-F', ' ', '{print $2, $3, $4}', '/tmp/dhcp.leases'], 'text');
			const dhcpLines = dhcpLeases.split('\n');
			for (let i = 0; i < dhcpLines.length; i++) {
				const line = dhcpLines[i];
				if (line === '') continue;
				const [mac, ip, hostname] = line.split(' ');
				if (!hostNames.hasOwnProperty(mac)) {
					hostNames[mac] = hostname;
				}
			};

			const arp = await  fs.exec_direct('/usr/bin/awk', ['-F', ' ', '{print $1, $4}', '/proc/net/arp'], 'text');
			const arpLines = arp.split('\n');
			for (let i = 1; i < arpLines.length; i++) {
				const line = arpLines[i];
				if (line === '') continue;
				const [ip, mac] = line.split(' ');
				hostInfo[ip] = mac;
			};

		} catch (e) {
			console.error('Error getting host names:', e);
		}
	},

	normalizeDat: function(data) {
		var total = data.reduce(function(n, d) { return n + d.value; }, 0);
		var normalized = data.slice();

		if (normalized.length >= 1) {
			var fakeValue = total * 0.001;
			normalized.push({
				value: fakeValue,
				name: '',
				itemStyle: { color: 'transparent' },
				label: { show: false },
				tooltip: { show: false }
			});
		}

		return normalized;
	},

	pie: function(id, data, valueFormatter) {
		var total = data.reduce(function(n, d) { return n + d.value; }, 0);

		data.sort(function(a, b) { return b.value - a.value; });

		if (total === 0) {
			data = [{ value: 1, color: '#cccccc', name: _('no traffic') }];
		}

		data.forEach(function(d, i) {
			if (!d.color) {
				var hue = (i * 137.508) % 360;
				d.color = 'hsl(' + hue + ', 75%, 55%)';
			}
		});

		var formatter = valueFormatter || function(params) {
			return params.name + ': ' + params.value + ' (' + params.percent + '%)';
		};

		var option = {
			tooltip: {
				trigger: 'item',
				formatter: formatter
			},
			series: [{
				type: 'pie',
				radius: ['25%', '80%'],
				avoidLabelOverlap: false,
				itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
				label: { show: false, position: 'center' },
				emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
				labelLine: { show: false },
				data: this.normalizeDat(data.map(function(d) {
					return { value: d.value, name: d.label || d.name, itemStyle: { color: d.color } };
				}))
			}]
		};

		var dom = typeof id === 'string' ? document.getElementById(id) : id;

		if (!chartRegistry[id]) {
			chartRegistry[id] = echarts.init(dom);
		}

		chartRegistry[id].setOption(option, true);

		return chartRegistry[id];
	},

	handleDeleteHost: function(host, type) {
		var pie = this.pie.bind(this);
		var renderHostSpeed = this.renderHostSpeed.bind(this);
		
		ui.showModal(_('Delete Host'), [
			E('p', _('Are you sure you want to delete this host?')),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, _('Cancel')),
				E('button', {
					'class': 'btn cbi-button-negative',
					'click': ui.createHandlerFn(this, async function() {
						try {
							await fs.exec_direct('/usr/bin/aw-bpfctl', [type, 'del', host], 'text');
							
							const updatedData = await fs.exec_direct('/usr/bin/aw-bpfctl', [type, 'json'], 'json');
							
							const defaultData = {status: "success", data: []};
							renderHostSpeed(updatedData || defaultData, pie, type);
							
							ui.hideModal();
						} catch (e) {
							ui.hideModal();
							ui.addNotification(null, E('p', _('Error: ') + e.message));
						}
					})
				}, _('Delete'))
			])
		]);
	},

	handleEditSpeed: function(host, mac, hostname, type) {
		var rate_limit_dl = 0;
		var rate_limit_ul = 0;
		
		fs.exec_direct('/usr/bin/aw-bpfctl', [type, 'json'], 'json').then(L.bind(function(result) {
			if (result && result.status === 'success' && Array.isArray(result.data)) {
				for (var i = 0; i < result.data.length; i++) {
					var item = result.data[i];
					if ((item.ip && item.ip === host) || (item.mac && item.mac === host)) {
						if (item.incoming && item.incoming.incoming_rate_limit) {
							rate_limit_dl = item.incoming.incoming_rate_limit / 1024 / 1024;
						}
						if (item.outgoing && item.outgoing.outgoing_rate_limit) {
							rate_limit_ul = item.outgoing.outgoing_rate_limit / 1024 / 1024;
						}
						break;
					}
				}
			}
			
			this.displaySpeedLimitDialog(host, mac, hostname, type, rate_limit_dl, rate_limit_ul);
		}, this)).catch(function(error) {
			console.error('Error getting speed limit:', error);
			this.displaySpeedLimitDialog(host, mac, hostname, type, 0, 0);
		}.bind(this));
	},
	
	displaySpeedLimitDialog: function(host, mac, hostname, type, dl, ul) {
		let inputDom = E('input', {
			'type': 'text',
			'id': 'host-name',
			'class': 'cbi-input-text',
			'value': hostname,
			'disabled': 'disabled'
		});

		if (mac) {
			inputDom.removeAttribute('disabled');
		}

		ui.showModal(_('Edit Speed Limit'), [
			E('div', { 'class': 'form-group' }, [ E('label', { 'class': 'form-label' }, _('Host')), E('span',{}, host) ]),
			E('div', { 'class': 'form-group' }, [ E('label', { 'class': 'form-label' }, _('Hostname')), inputDom ]),
			E('div', { 'class': 'form-group' }, [
				E('label', { 'class': 'form-label' }, _('Download Limit')),
				E('input', { type: 'number', id: 'dl-rate', class: 'cbi-input-number', min: '0', value: dl }),
				E('span',{}, " Mbps")
			]),
			E('div', { 'class': 'form-group' }, [
				E('label', { 'class': 'form-label' }, _('Upload Limit')),
				E('input', { type: 'number', id: 'ul-rate', class: 'cbi-input-number', min: '0', value: ul }),
				E('span',{}, " Mbps")
			]),
			E('div', { 'class': 'cbi-page-actions right' }, [
				E('button', { 'class': 'btn cbi-button cbi-button-neutral', 'click': ui.hideModal }, _('Cancel')),
				E('button', {
					'class': 'btn cbi-button cbi-button-positive',
					'click': ui.createHandlerFn(this, async function(ev) {
						var pie = this.pie.bind(this);
						var renderHostSpeed = this.renderHostSpeed.bind(this);

						var dl = document.getElementById('dl-rate').value,
							ul = document.getElementById('ul-rate').value,
							newName = document.getElementById('host-name').value;
						try {
							if (mac && newName != hostname) {
								hostNames[mac] = newName;
								uci.set('hostnames', hostNameMacSectionId, mac.split(':').join('_'), newName);
								uci.save('hostnames');
								uci.apply('hostnames');
							}

							const results = await Promise.all([
								fs.exec_direct('/usr/bin/aw-bpfctl', [type, 'update', host, "downrate", dl*1024*1024 || '0', "uprate", ul*1024*1024 || '0'], 'text'),
								fs.exec_direct('/usr/bin/aw-bpfctl', [type,  'json'], 'json')
							]);
							const defaultData = {status: "success", data: []};
							const refresh_data = results[1] || defaultData;
							renderHostSpeed(refresh_data, pie, type);

							ui.addNotification(null, E('p',_('Speed limit updated')));
							ui.hideModal();
						} catch (e) {
							ui.addNotification(null, E('p', _('Error: ') + e.message));
						}
					})
				}, _('Save'))
			])
		]);
	},

	renderHostSpeed: function(data, pie, type) {
		if (!data || !data.status || data.status !== "success" || !data.data) {
			return;
		}

		var rows = [];
		var txRateData = [], rxRateData = [];
		var txVolumeData = [], rxVolumeData = [];
		var tx_rate_total = 0, rx_rate_total = 0;
		var tx_bytes_total = 0, rx_bytes_total = 0;

		for (var i = 0; i < data.data.length; i++) {
			var rec = data.data[i];
			if (!rec || !rec.incoming || !rec.outgoing) continue;

			var host = rec.ip || rec.mac || '';
			var hostname = rec.hostname || '';

			rows.push([
				host,
				hostname,
				[rec.incoming.rate, '%1024.2mbps'.format(rec.incoming.rate)],
				[rec.incoming.total_bytes, '%1024.2mB'.format(rec.incoming.total_bytes)],
				[rec.incoming.total_packets, '%1000.2mP'.format(rec.incoming.total_packets)],
				[rec.outgoing.rate, '%1024.2mbps'.format(rec.outgoing.rate)],
				[rec.outgoing.total_bytes, '%1024.2mB'.format(rec.outgoing.total_bytes)],
				[rec.outgoing.total_packets, '%1000.2mP'.format(rec.outgoing.total_packets)],
				E('div', { 'class': 'button-container' }, [
					E('button', {
						'class': 'btn cbi-button cbi-button-edit',
						'style': 'margin-right: 5px;',
						'click': ui.createHandlerFn(this, function(h, m, hn, t) {
							return function() { this.handleEditSpeed(h, m, hn, t); };
						}(host, rec.mac, hostname, type))
					}, _('Edit')),
					E('button', {
						'class': 'btn cbi-button cbi-button-remove',
						'click': ui.createHandlerFn(this, function(h, t) {
							return function() { this.handleDeleteHost(h, t); };
						}(host, type))
					}, _('Delete'))
				])
			]);

			rx_rate_total += rec.outgoing.rate;
			tx_rate_total += rec.incoming.rate;
			rx_bytes_total += rec.outgoing.total_bytes;
			tx_bytes_total += rec.incoming.total_bytes;

			rxRateData.push({ value: rec.outgoing.rate, label: hostname || host });
			txRateData.push({ value: rec.incoming.rate, label: hostname || host });
			rxVolumeData.push({ value: rec.outgoing.total_bytes, label: hostname || host });
			txVolumeData.push({ value: rec.incoming.total_bytes, label: hostname || host });
		}

		var table = document.getElementById(type + '-speed-data');
		cbi_update_table(table, rows, E('em', _('No data recorded yet.')));

		pie(type + '-tx-rate-pie', txRateData, function(p) { return p.name + ': ' + '%1024.2mbps'.format(p.value) + ' (' + p.percent + '%)'; });
		pie(type + '-rx-rate-pie', rxRateData, function(p) { return p.name + ': ' + '%1024.2mbps'.format(p.value) + ' (' + p.percent + '%)'; });
		pie(type + '-tx-volume-pie', txVolumeData, function(p) { return p.name + ': ' + '%1024.2mB'.format(p.value) + ' (' + p.percent + '%)'; });
		pie(type + '-rx-volume-pie', rxVolumeData, function(p) { return p.name + ': ' + '%1024.2mB'.format(p.value) + ' (' + p.percent + '%)'; });

		var hostEl = document.getElementById(type + '-host-val');
		if(hostEl) hostEl.textContent = data.data.length;

		var txRateEl = document.getElementById(type + '-tx-rate-val');
		if(txRateEl) txRateEl.textContent = '%1024.2mbps'.format(tx_rate_total);

		var rxRateEl = document.getElementById(type + '-rx-rate-val');
		if(rxRateEl) rxRateEl.textContent = '%1024.2mbps'.format(rx_rate_total);

		var txVolEl = document.getElementById(type + '-tx-volume-val');
		if(txVolEl) txVolEl.textContent = '%1024.2mB'.format(tx_bytes_total);

		var rxVolEl = document.getElementById(type + '-rx-volume-val');
		if(rxVolEl) rxVolEl.textContent = '%1024.2mB'.format(rx_bytes_total);
	},

	pollChaQoSData: async function() {
		await uci.load('hostnames');

		poll.add(L.bind(async function() {
			await this.loadHostNames();
			await this.loadHostSpeedData();
		}, this), 5);
	},

	loadHostSpeedData: async function() {
		var pie = this.pie.bind(this);
		var renderHostSpeed = this.renderHostSpeed.bind(this);
		try {
			const results = await Promise.all([
				fs.exec_direct('/usr/bin/aw-bpfctl', ['ipv4', 'json'], 'json'),
				fs.exec_direct('/usr/bin/aw-bpfctl', ['ipv6', 'json'], 'json'),
				fs.exec_direct('/usr/bin/aw-bpfctl', ['mac',  'json'], 'json')
			]);

			const defaultData = {status: "success", data: []};

			const ipv4Data = results[0] || defaultData;
			const ipv6Data = results[1] || defaultData;
			const macData  = results[2] || defaultData;
			
			this.updateAllAddButtons();

			ipv4Data.data.forEach(function(item) {
				const mac = hostInfo[item.ip];
				if (mac) {
					item.mac = mac;
					item.hostname = hostNames[mac];
				}
			});
			macData.data.forEach(function(item) {
				const mac = item.mac;
				if (mac) {
					item.hostname = hostNames[mac];
				}
			});

			renderHostSpeed(ipv4Data, pie, "ipv4");
			renderHostSpeed(ipv6Data, pie, "ipv6");
			renderHostSpeed(macData, pie, "mac");
		} catch (e) {
			console.error('Error polling data:', e);
		}
	},

	handleAddSubmit: async function(val, type) {
		var pie = this.pie.bind(this);
		var renderHostSpeed = this.renderHostSpeed.bind(this);

		try {
			const results = await Promise.all([
				fs.exec_direct('/usr/bin/aw-bpfctl', [type, 'add', val], 'text'),
				fs.exec_direct('/usr/bin/aw-bpfctl', [type,  'json'], 'json')
			]);
			const defaultData = {status: "success", data: []};
			const refresh_data = results[1] || defaultData;
			renderHostSpeed(refresh_data, pie, type);

			ui.addNotification(null, E('p',_('Updated successfully!')));
		} catch (e) {
			ui.addNotification(null, E('p', _('Error: ') + e.message));
		}
	},

	validateData: function(value, type) {
		if (typeof value !== 'string') return false;

		const ipv4Regex = /^((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;
		const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^(([0-9a-fA-F]{1,4}:){0,6}::([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4})$/i;
		const macRegex = /^([0-9A-Fa-f]{2}([-:]))([0-9A-Fa-f]{2}\2){4}[0-9A-Fa-f]{2}$|^([0-9A-Fa-f]{12})$/i;

		switch (type) {
		  case 'ipv4': return ipv4Regex.test(value);
		  case 'ipv6': return ipv6Regex.test(value);
		  case 'mac':  return macRegex.test(value);
		  default:     return false;
		}
	},

	createAddButtonValue: function(type, placeholder) {
		let addInputWidth = (type === 'ipv6') ? 'width:320px' : 'width:180px';

		let input = E('input', { type: 'text', id: type + '-add-input', class: 'cbi-input-text', style: addInputWidth, placeholder: _(placeholder) });
		let addBtn = E('button', { class: 'btn cbi-button cbi-button-add', id: type + '-add-btn', disabled: 'disabled', click: ui.createHandlerFn(this, function() {
			var inputValue = input.value.trim();
			if (!this.validateData(inputValue, type)) {
				ui.addNotification(null, E('p', _('Data format error')));
				return;
			}
			this.handleAddSubmit(inputValue, type).then(this.loadHostSpeedData.bind(this));
			input.value = '';
		}) }, _('Add'));

		let freshBtn = E('button', { class: 'btn cbi-button', click: this.loadHostSpeedData.bind(this) }, [ E('img', { 'src': L.resource('icons/refresh.png'), 'style': 'width: 16px; height: 16px;' }), _('Refreshing') ]);

		input.addEventListener('input', function() { addBtn.disabled = (this.value.trim() === ''); });
		
		return [input, addBtn, freshBtn];
	},

	updateAllAddButtons: function() {
		['ipv4', 'ipv6', 'mac'].forEach(function(type) {
			const input = document.getElementById(type + '-add-input');
			const addBtn = document.getElementById(type + '-add-btn');
			
			if (input && addBtn) {
				addBtn.disabled = (input.value.trim() === '');
			}
		});
	},

	render: function() {
		var node = E([], [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('view/wifidogx.css') }),
			E('style', { type: 'text/css' },
			'.th-sort-asc::after { content: " \u25b2"; display: inline-block; margin-left: 5px; font-size: 14px; } '+
			'.th-sort-desc::after { content: " \u25bc"; display: inline-block; margin-left: 5px; font-size: 14px; } '+
			'.table .th { cursor: pointer; position: relative; } '+
			'.table .th:hover { background-color: #f0f0f0; } '+
			'.dashboard-container { display: flex; flex-direction: column; gap: 20px; margin-bottom: 20px; } '+
			'.kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; } '+
			'.kpi-card { background-color: #f9f9f9; border-radius: 8px; padding: 15px; text-align: center; border: 1px solid #e0e0e0; } '+
			'.kpi-card big { display: block; font-size: 1.8em; font-weight: bold; color: #3771c8; } '+
			'.kpi-card-label { font-size: 0.9em; color: #666; } '+
			'.chart-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; } '+
			'.chart-card { background-color: #ffffff; border-radius: 8px; padding: 20px; border: 1px solid #e0e0e0; } '+
			'.chart-card h4 { margin-top: 0; margin-bottom: 15px; text-align: center; font-size: 1.1em; } '+
			'.chart-card canvas { max-width: 100%; height: auto !important; } '
			),
			E('script', { 'type': 'text/javascript', 'src': L.resource('echarts.simple.min.js') }),

			E('h2', [ _('Auth User Speed Monitor') ]),

			E('div', {}, [
				E('div', { 'class': 'cbi-section', 'data-tab': 'ipv4', 'data-tab-title': _('IPv4') }, [
					E('div', { 'class': 'dashboard-container' }, [
						E('div', { 'class': 'kpi-row' }, [
							E('div', { 'class': 'kpi-card' }, [ E('big', { id: 'ipv4-host-val' }, '0'), E('span', { 'class': 'kpi-card-label' }, _('Hosts')) ]),
							E('div', { 'class': 'kpi-card' }, [ E('big', { id: 'ipv4-tx-rate-val' }, '0'), E('span', { 'class': 'kpi-card-label' }, _('Download Speed')) ]),
							E('div', { 'class': 'kpi-card' }, [ E('big', { id: 'ipv4-rx-rate-val' }, '0'), E('span', { 'class': 'kpi-card-label' }, _('Upload Speed')) ]),
							E('div', { 'class': 'kpi-card' }, [ E('big', { id: 'ipv4-tx-volume-val' }, '0'), E('span', { 'class': 'kpi-card-label' }, _('Download Total')) ]),
							E('div', { 'class': 'kpi-card' }, [ E('big', { id: 'ipv4-rx-volume-val' }, '0'), E('span', { 'class': 'kpi-card-label' }, _('Upload Total')) ])
						]),
						E('div', { 'class': 'chart-grid' }, [
							E('div', { 'class': 'chart-card' }, [ E('h4', [_('Download Speed / Host')]), E('canvas', { id: 'ipv4-tx-rate-pie', height: '250' }) ]),
							E('div', { 'class': 'chart-card' }, [ E('h4', [_('Upload Speed / Host')]), E('canvas', { id: 'ipv4-rx-rate-pie', height: '250' }) ]),
							E('div', { 'class': 'chart-card' }, [ E('h4', [_('Download Total')]), E('canvas', { id: 'ipv4-tx-volume-pie', height: '250' }) ]),
							E('div', { 'class': 'chart-card' }, [ E('h4', [_('Upload Total')]), E('canvas', { id: 'ipv4-rx-volume-pie', height: '250' }) ])
						])
					]),
					E('table', { 'class': 'table', 'id': 'ipv4-speed-data' }, [
						E('tr', { 'class': 'tr table-titles' }, [
							E('th', { 'class': 'th left' }, [ _('Host') ]),
							E('th', { 'class': 'th left' }, [ _('Hostname') ]),
							E('th', { 'class': 'th right' }, [ _('Download Speed (Bit/s)') ]),
							E('th', { 'class': 'th right' }, [ _('Download (Bytes)') ]),
							E('th', { 'class': 'th right' }, [ _('Download (Packets)') ]),
							E('th', { 'class': 'th right' }, [ _('Upload Speed (Bit/s)') ]),
							E('th', { 'class': 'th right' }, [ _('Upload (Bytes)') ]),
							E('th', { 'class': 'th right' }, [ _('Upload (Packets)') ]),
							E('th', { 'class': 'th center' }, [ _('Actions') ])
						]),
						E('tr', { 'class': 'tr placeholder' }, [ E('td', { 'class': 'td', 'colspan': '9' }, [ E('em', { 'class': 'spinning' }, [ _('Collecting data...') ]) ]) ])
					]),
					E('div', { 'style': 'display:flex; justify-content:flex-end; align-items: center; padding: 0.5rem 1rem;' }, this.createAddButtonValue("ipv4", "Please enter a valid IPv4 address")),
				]),

				E('div', { 'class': 'cbi-section', 'data-tab': 'ipv6', 'data-tab-title': _('IPv6') }, [
					E('div', { 'class': 'dashboard-container' }, [
						E('div', { 'class': 'kpi-row' }, [
							E('div', { 'class': 'kpi-card' }, [ E('big', { id: 'ipv6-host-val' }, '0'), E('span', { 'class': 'kpi-card-label' }, _('Hosts')) ]),
							E('div', { 'class': 'kpi-card' }, [ E('big', { id: 'ipv6-tx-rate-val' }, '0'), E('span', { 'class': 'kpi-card-label' }, _('Download Speed')) ]),
							E('div', { 'class': 'kpi-card' }, [ E('big', { id: 'ipv6-rx-rate-val' }, '0'), E('span', { 'class': 'kpi-card-label' }, _('Upload Speed')) ]),
							E('div', { 'class': 'kpi-card' }, [ E('big', { id: 'ipv6-tx-volume-val' }, '0'), E('span', { 'class': 'kpi-card-label' }, _('Download Total')) ]),
							E('div', { 'class': 'kpi-card' }, [ E('big', { id: 'ipv6-rx-volume-val' }, '0'), E('span', { 'class': 'kpi-card-label' }, _('Upload Total')) ])
						]),
						E('div', { 'class': 'chart-grid' }, [
							E('div', { 'class': 'chart-card' }, [ E('h4', [_('Download Speed / Host')]), E('canvas', { id: 'ipv6-tx-rate-pie', height: '250' }) ]),
							E('div', { 'class': 'chart-card' }, [ E('h4', [_('Upload Speed / Host')]), E('canvas', { id: 'ipv6-rx-rate-pie', height: '250' }) ]),
							E('div', { 'class': 'chart-card' }, [ E('h4', [_('Download Total')]), E('canvas', { id: 'ipv6-tx-volume-pie', height: '250' }) ]),
							E('div', { 'class': 'chart-card' }, [ E('h4', [_('Upload Total')]), E('canvas', { id: 'ipv6-rx-volume-pie', height: '250' }) ])
						])
					]),
					E('table', { 'class': 'table', 'id': 'ipv6-speed-data' }, [
						E('tr', { 'class': 'tr table-titles' }, [
							E('th', { 'class': 'th left' }, [ _('Host') ]),
							E('th', { 'class': 'th left' }, [ _('Hostname') ]),
							E('th', { 'class': 'th right' }, [ _('Download Speed (Bit/s)') ]),
							E('th', { 'class': 'th right' }, [ _('Download (Bytes)') ]),
							E('th', { 'class': 'th right' }, [ _('Download (Packets)') ]),
							E('th', { 'class': 'th right' }, [ _('Upload Speed (Bit/s)') ]),
							E('th', { 'class': 'th right' }, [ _('Upload (Bytes)') ]),
							E('th', { 'class': 'th right' }, [ _('Upload (Packets)') ]),
							E('th', { 'class': 'th center' }, [ _('Actions') ])
						]),
						E('tr', { 'class': 'tr placeholder' }, [ E('td', { 'class': 'td', 'colspan': '9' }, [ E('em', { 'class': 'spinning' }, [ _('Collecting data...') ]) ]) ])
					]),
					E('div', { 'style': 'display:flex; justify-content:flex-end; align-items: center; padding: 0.5rem 1rem;' }, this.createAddButtonValue("ipv6", "Please enter a valid IPv6 address")),
				]),

				E('div', { 'class': 'cbi-section', 'data-tab': 'mac', 'data-tab-title': _('MAC') }, [
					E('div', { 'class': 'dashboard-container' }, [
						E('div', { 'class': 'kpi-row' }, [
							E('div', { 'class': 'kpi-card' }, [ E('big', { id: 'mac-host-val' }, '0'), E('span', { 'class': 'kpi-card-label' }, _('Hosts')) ]),
							E('div', { 'class': 'kpi-card' }, [ E('big', { id: 'mac-tx-rate-val' }, '0'), E('span', { 'class': 'kpi-card-label' }, _('Download Speed')) ]),
							E('div', { 'class': 'kpi-card' }, [ E('big', { id: 'mac-rx-rate-val' }, '0'), E('span', { 'class': 'kpi-card-label' }, _('Upload Speed')) ]),
							E('div', { 'class': 'kpi-card' }, [ E('big', { id: 'mac-tx-volume-val' }, '0'), E('span', { 'class': 'kpi-card-label' }, _('Download Total')) ]),
							E('div', { 'class': 'kpi-card' }, [ E('big', { id: 'mac-rx-volume-val' }, '0'), E('span', { 'class': 'kpi-card-label' }, _('Upload Total')) ])
						]),
						E('div', { 'class': 'chart-grid' }, [
							E('div', { 'class': 'chart-card' }, [ E('h4', [_('Download Speed / Host')]), E('canvas', { id: 'mac-tx-rate-pie', height: '250' }) ]),
							E('div', { 'class': 'chart-card' }, [ E('h4', [_('Upload Speed / Host')]), E('canvas', { id: 'mac-rx-rate-pie', height: '250' }) ]),
							E('div', { 'class': 'chart-card' }, [ E('h4', [_('Download Total')]), E('canvas', { id: 'mac-tx-volume-pie', height: '250' }) ]),
							E('div', { 'class': 'chart-card' }, [ E('h4', [_('Upload Total')]), E('canvas', { id: 'mac-rx-volume-pie', height: '250' }) ])
						])
					]),
					E('table', { 'class': 'table', 'id': 'mac-speed-data' }, [
						E('tr', { 'class': 'tr table-titles' }, [
							E('th', { 'class': 'th left' }, [ _('Host') ]),
							E('th', { 'class': 'th left' }, [ _('Hostname') ]),
							E('th', { 'class': 'th right' }, [ _('Download Speed (Bit/s)') ]),
							E('th', { 'class': 'th right' }, [ _('Download (Bytes)') ]),
							E('th', { 'class': 'th right' }, [ _('Download (Packets)') ]),
							E('th', { 'class': 'th right' }, [ _('Upload Speed (Bit/s)') ]),
							E('th', { 'class': 'th right' }, [ _('Upload (Bytes)') ]),
							E('th', { 'class': 'th right' }, [ _('Upload (Packets)') ]),
							E('th', { 'class': 'th center' }, [ _('Actions') ])
						]),
						E('tr', { 'class': 'tr placeholder' }, [ E('td', { 'class': 'td', 'colspan': '9' }, [ E('em', { 'class': 'spinning' }, [ _('Collecting data...') ]) ]) ])
					]),
					E('div', { 'style': 'display:flex; justify-content:flex-end; align-items: center; padding: 0.5rem 1rem;' }, this.createAddButtonValue("mac", "Please enter a valid MAC address")),
				])
			])
		]);

		ui.tabs.initTabGroup(node.lastElementChild.childNodes);

		setTimeout(this.pollChaQoSData.bind(this), 0);

		return node;
	},

	handleSave: null,
	handleSaveApply: null,
	handleReset: null
});