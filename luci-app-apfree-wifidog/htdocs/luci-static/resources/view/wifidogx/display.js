'use strict';
'require view';
'require network';
'require request';
'require fs';
'require ui';
'require rpc';
'require dom';
'require poll';

var callNetworkRrdnsLookup = rpc.declare({
	object: 'network.rrdns',
	method: 'lookup',
	params: [ 'addrs', 'timeout', 'limit' ],
	expect: { '': {} }
});

var chartRegistry = {},
	trafficPeriods = [],
	trafficData = { columns: [], data: [] },
	hostNames = {},
	hostInfo = {},
	ouiData = [];

var l7proto = {};

return view.extend({
	off: function(elem) {
		var val = [0, 0];
		do {
			if (!isNaN(elem.offsetLeft) && !isNaN(elem.offsetTop)) {
				val[0] += elem.offsetLeft;
				val[1] += elem.offsetTop;
			}
		}
		while ((elem = elem.offsetParent) != null);
		return val;
	},

	kpi: function(id, val1, val2, val3) {
		var e = L.dom.elem(id) ? id : document.getElementById(id);

		if (val1 && val2 && val3)
			e.innerHTML = _('%s, %s and %s').format(val1, val2, val3);
		else if (val1 && val2)
			e.innerHTML = _('%s and %s').format(val1, val2);
		else if (val1)
			e.innerHTML = val1;

		e.parentNode.style.display = val1 ? 'list-item' : '';
	},

	pie: function(id, data) {
		var total = data.reduce(function(n, d) { return n + d.value }, 0);

		data.sort(function(a, b) { return b.value - a.value });

		if (total === 0)
			data = [{
				value: 1,
				color: '#cccccc',
				label: [ _('no traffic') ]
			}];

		for (var i = 0; i < data.length; i++) {
			if (!data[i].color) {
				var hue = 120 / (data.length-1) * i;
				data[i].color = 'hsl(%u, 80%%, 50%%)'.format(hue);
				data[i].label.push(hue);
			}
		}

		var node = L.dom.elem(id) ? id : document.getElementById(id),
		    key = L.dom.elem(id) ? id.id : id,
		    ctx = node.getContext('2d');

		if (chartRegistry.hasOwnProperty(key))
			chartRegistry[key].destroy();

		chartRegistry[key] = new Chart(ctx).Doughnut(data, {
			segmentStrokeWidth: 1,
			percentageInnerCutout: 30
		});

		return chartRegistry[key];
	},

	oui: function(mac) {
		var m, l = 0, r = ouiData.length / 3 - 1;
		var mac1 = parseInt(mac.replace(/[^a-fA-F0-9]/g, ''), 16);

		while (l <= r) {
			m = l + Math.floor((r - l) / 2);

			var mask = (0xffffffffffff -
						(Math.pow(2, 48 - ouiData[m * 3 + 1]) - 1));

			var mac1_hi = ((mac1 / 0x10000) & (mask / 0x10000)) >>> 0;
			var mac1_lo = ((mac1 &  0xffff) & (mask &  0xffff)) >>> 0;

			var mac2 = parseInt(ouiData[m * 3], 16);
			var mac2_hi = (mac2 / 0x10000) >>> 0;
			var mac2_lo = (mac2 &  0xffff) >>> 0;

			if (mac1_hi === mac2_hi && mac1_lo === mac2_lo)
				return ouiData[m * 3 + 2];

			if (mac2_hi > mac1_hi ||
				(mac2_hi === mac1_hi && mac2_lo > mac1_lo))
				r = m - 1;
			else
				l = m + 1;
		}

		return null;
	},

	query: function(filter, group, order) {
		var keys = [], columns = {}, records = {}, result = [];

		if (typeof(group) !== 'function' && typeof(group) !== 'object')
			group = ['mac'];

		for (var i = 0; i < trafficData.columns.length; i++)
			columns[trafficData.columns[i]] = i;

		for (var i = 0; i < trafficData.data.length; i++) {
			var record = trafficData.data[i];

			if (typeof(filter) === 'function' && filter(columns, record) !== true)
				continue;

			var key;

			if (typeof(group) === 'function') {
				key = group(columns, record);
			}
			else {
				key = [];

				for (var j = 0; j < group.length; j++)
					if (columns.hasOwnProperty(group[j]))
						key.push(record[columns[group[j]]]);

				key = key.join(',');
			}

			if (!records.hasOwnProperty(key)) {
				var rec = {};

				for (var col in columns)
					rec[col] = record[columns[col]];

				records[key] = rec;
				result.push(rec);
			}
			else {
				records[key].conns    += record[columns.conns];
				records[key].rx_bytes += record[columns.rx_bytes];
				records[key].rx_pkts  += record[columns.rx_pkts];
				records[key].tx_bytes += record[columns.tx_bytes];
				records[key].tx_pkts  += record[columns.tx_pkts];
			}
		}

		if (typeof(order) === 'function')
			result.sort(order);

		return result;
	},

	formatHostname: function(dns) {
		if (dns === undefined || dns === null || dns === '')
			return '-';

		dns = dns.split('.')[0];

		if (dns.length > 12)
			return '<span title="%q">%h…</span>'.format(dns, dns.substr(0, 12));

		return '%h'.format(dns);
	},

	renderHostDetail: function(node, tooltip) {
		var key = node.getAttribute('href').substr(1),
		    col = node.getAttribute('data-col'),
		    label = node.getAttribute('data-tooltip');

		var detailData = this.query(
			function(c, r) {
				return ((r[c.mac] === key || r[c.ip] === key) &&
				        (r[c.rx_bytes] > 0 || r[c.tx_bytes] > 0));
			},
			[col],
			function(r1, r2) {
				return ((r2.rx_bytes + r2.tx_bytes) - (r1.rx_bytes + r1.tx_bytes));
			}
		);

		var rxData = [], txData = [];

		dom.content(tooltip, [
			E('div', { 'class': 'head' }, [
				E('div', { 'class': 'pie' }, [
					E('label', _('Download', 'Traffic counter')),
					E('canvas', { 'id': 'bubble-pie1', 'width': 100, 'height': 100 })
				]),
				E('div', { 'class': 'pie' }, [
					E('label', _('Upload', 'Traffic counter')),
					E('canvas', { 'id': 'bubble-pie2', 'width': 100, 'height': 100 })
				]),
				E('div', { 'class': 'kpi' }, [
					E('ul', [
						E('li', _('Hostname: <big id="bubble-hostname">example.org</big>')),
						E('li', _('Vendor: <big id="bubble-vendor">Example Corp.</big>'))
					])
				])
			]),
			E('table', { 'class': 'table' }, [
				E('tr', { 'class': 'tr table-titles' }, [
					E('th', { 'class': 'th' }, label || col),
					E('th', { 'class': 'th' }, _('Conn.')),
					E('th', { 'class': 'th' }, _('Down. (Bytes)')),
					E('th', { 'class': 'th' }, _('Down. (Pkts.)')),
					E('th', { 'class': 'th' }, _('Up. (Bytes)')),
					E('th', { 'class': 'th' }, _('Up. (Pkts.)')),
				])
			])
		]);

		var rows = [];

		for (var i = 0; i < detailData.length; i++) {
			var rec = detailData[i],
			    cell = E('div', rec[col] || _('other'));

			rows.push([
				cell,
				[ rec.conns,    '%1000.2m'.format(rec.conns)     ],
				[ rec.rx_bytes, '%1024.2mB'.format(rec.rx_bytes) ],
				[ rec.rx_pkts,  '%1000.2mP'.format(rec.rx_pkts)  ],
				[ rec.tx_bytes, '%1024.2mB'.format(rec.tx_bytes) ],
				[ rec.tx_pkts,  '%1000.2mP'.format(rec.tx_pkts)  ]
			]);

			rxData.push({
				label: ['%s: %%1024.2mB'.format(rec[col] || _('other')), cell],
				value: rec.rx_bytes
			});

			txData.push({
				label: ['%s: %%1024.2mB'.format(rec[col] || _('other')), cell],
				value: rec.tx_bytes
			});
		}

		cbi_update_table(tooltip.lastElementChild, rows);

		this.pie(tooltip.querySelector('#bubble-pie1'), rxData);
		this.pie(tooltip.querySelector('#bubble-pie2'), txData);

		var mac = key.toUpperCase();
		var name = hostInfo.hasOwnProperty(mac) ? hostInfo[mac].name : null;
		if (!name)
			for (var i = 0; i < detailData.length; i++)
				if ((name = hostNames[detailData[i].ip]) !== undefined)
					break;

		if (mac !== '00:00:00:00:00:00') {
			this.kpi(tooltip.querySelector('#bubble-hostname'), name);
			this.kpi(tooltip.querySelector('#bubble-vendor'), this.oui(mac));
		}
		else {
			this.kpi(tooltip.querySelector('#bubble-hostname'));
			this.kpi(tooltip.querySelector('#bubble-vendor'));
		}

		var rect = node.getBoundingClientRect(), x, y;

		if ('ontouchstart' in window || window.innerWidth <= 992) {
			var vpHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0),
			    scrollFrom = window.pageYOffset,
			    scrollTo = scrollFrom + rect.top - vpHeight * 0.5,
			    start = null;

			tooltip.style.top = (rect.top + rect.height + window.pageYOffset) + 'px';
			tooltip.style.left = 0;

			var scrollStep = function(timestamp) {
				if (!start)
					start = timestamp;

				var duration = Math.max(timestamp - start, 1);
				if (duration < 100) {
					document.body.scrollTop = scrollFrom + (scrollTo - scrollFrom) * (duration / 100);
					window.requestAnimationFrame(scrollStep);
				}
				else {
					document.body.scrollTop = scrollTo;
				}
			};

			window.requestAnimationFrame(scrollStep);
		}
		else {
			x = rect.left + rect.width + window.pageXOffset,
		    y = rect.top + window.pageYOffset;

			if ((y + tooltip.offsetHeight) > (window.innerHeight + window.pageYOffset))
				y -= ((y + tooltip.offsetHeight) - (window.innerHeight + window.pageYOffset));

			tooltip.style.top = y + 'px';
			tooltip.style.left = x + 'px';
		}

		return false;
	},

	// 编辑限速
	handleEditSpeed: function(host, type, dl, ul) {
		dl = dl/1024/1024;
		ul = ul/1024/1024;

		var dialog = ui.showModal(_('Edit Speed Limit'), [
			E('div', { 'class': 'form-group' }, [
				E('label', { 'class': 'form-label' }, _('Host')),
				E('span',{}, host)
			]),
			E('div', { 'class': 'form-group' }, [
				E('label', { 'class': 'form-label' }, _('Download Limit')),
				E('input', {
					'type': 'number',
					'id': 'dl-rate',
					'class': 'cbi-input-number',
					'min': '0',
					'value': dl,
				}),
				E('span',{}, " Mbps")
			]),
			E('div', { 'class': 'form-group' }, [
				E('label', { 'class': 'form-label' }, _('Upload Limit')),
				E('input', {
					'type': 'number',
					'id': 'ul-rate',
					'class': 'cbi-input-number',
					'min': '0',
					'value': ul
				}),
				E('span',{}, " Mbps")
			]),
			// 添加按钮操作区域
			E('div', { 'class': 'cbi-page-actions right' }, [
				E('button', {
					'class': 'btn cbi-button cbi-button-neutral',
					'click': ui.createHandlerFn(this, function(ev) {
						ui.hideModal(); // 取消按钮直接关闭弹窗
					})
				}, _('Cancel')),
				E('button', {
					'class': 'btn cbi-button cbi-button-positive',
					'click': ui.createHandlerFn(this, async function(ev) {
						var pie = this.pie.bind(this);
						var kpi = this.kpi.bind(this);
						var renderHostSpeed = this.renderHostSpeed.bind(this);

						// 保存按钮逻辑
						var dl = document.getElementById('dl-rate').value,
							ul = document.getElementById('ul-rate').value;

						try {
							const results = await Promise.all([
								fs.exec_direct('/usr/bin/aw-bpfctl', [type, 'update', host, "downrate", dl*1024*1024 || '0', "uprate", ul*1024*1024 || '0'], 'text'),
								fs.exec_direct('/usr/bin/aw-bpfctl', [type,  'json'], 'json')
							]);
							const defaultData = {status: "success", data: []};
							const refresh_data = results[1] || defaultData;
							renderHostSpeed(refresh_data, pie, kpi, type);

							ui.addNotification(null, E('p',_('Speed limit updated')), 3000, 'success');
							ui.hideModal();
						} catch (e) {
							ui.addNotification("", _('Error: ') + e.message, 3000, 'error');
						}
					})
				}, _('Save'))
			])
		]);

		// 强制设置定位模式
		dialog.style.position = 'fixed';

		// 动态计算位置
		dialog.style.top = '50%';
		dialog.style.left = '50%';
		dialog.style.transform = 'translate(-50%, -50%)';
		dialog.style.margin = '0';
	},

	renderHostSpeed: function(data, pie, kpi, type) {
		var rows = [];
		var rx_data = [], tx_data = [];
		var rx_total = 0, tx_total = 0;
		var recs = [];
	
		// Check status and data structure
		if (data.status === "success" && Array.isArray(data.data)) {
			recs = data.data;
		} else {
			console.log("Invalid data format");
			return;
		}
	
		for (var i = 0; i < recs.length; i++) {
			var rec = recs[i];
			// Skip entries with no traffic (using total_bytes from both directions)
			// if (rec.incoming.total_bytes === 0 && rec.outgoing.total_bytes === 0)
			// 	continue;

			var hostKey = (type == "mac" ? rec.mac : rec.ip);
			rows.push([
				hostKey,
				[ rec.outgoing.rate, '%1024.2mbps'.format(rec.outgoing.rate) ],
				[ rec.outgoing.total_bytes, '%1024.2mB'.format(rec.outgoing.total_bytes) ],
				[ rec.outgoing.total_packets, '%1000.2mP'.format(rec.outgoing.total_packets) ],
				[ rec.incoming.rate, '%1024.2mbps'.format(rec.incoming.rate) ],
				[ rec.incoming.total_bytes, '%1024.2mB'.format(rec.incoming.total_bytes) ],
				[ rec.incoming.total_packets, '%1000.2mP'.format(rec.incoming.total_packets) ],
				E('button', {
					'class': 'btn cbi-button cbi-button-edit center',
					'click': ui.createHandlerFn(this, function(host, type, dl, ul) {
						this.handleEditSpeed(host, type, dl, ul);
					}, hostKey, type, rec.incoming.incoming_rate_limit, rec.outgoing.outgoing_rate_limit)
					// hostKey是当前行的主机标识（IP/MAC），type是类型（ipv4/ipv6/mac）
				}, _('Edit'))
			]);

			rx_total += rec.incoming.rate;
			tx_total += rec.outgoing.rate;
			rx_data.push({
				value: rec.incoming.rate,
				label: [ rec.ip ]
			});

			tx_data.push({
				value: rec.outgoing.rate,
				label: [ rec.ip ]
			});
		}

		switch (type) {
		  case "ipv4":
			cbi_update_table('#speed-data', rows, E('em', _('No data recorded yet.')));
			pie('speed-rx-pie', rx_data);
			pie('speed-tx-pie', tx_data);
			kpi('speed-rx-max', '%1024.2mbps'.format(rx_total));
			kpi('speed-tx-max', '%1024.2mbps'.format(tx_total));
			kpi('speed-host', '%u'.format(rows.length));
			break;
		  case "ipv6":
			cbi_update_table('#ipv6-speed-data', rows, E('em', _('No data recorded yet.')));
			pie('ipv6-speed-rx-pie', rx_data);
			pie('ipv6-speed-tx-pie', tx_data);
			kpi('ipv6-speed-rx-max', '%1024.2mbps'.format(rx_total));
			kpi('ipv6-speed-tx-max', '%1024.2mbps'.format(tx_total));
			kpi('ipv6-speed-host', '%u'.format(rows.length));
			break;
		  case "mac":
			cbi_update_table('#mac-speed-data', rows, E('em', _('No data recorded yet.')));
			pie('mac-speed-rx-pie', rx_data);
			pie('mac-speed-tx-pie', tx_data);
			kpi('mac-speed-rx-max', '%1024.2mbps'.format(rx_total));
			kpi('mac-speed-tx-max', '%1024.2mbps'.format(tx_total));
			kpi('mac-speed-host', '%u'.format(rows.length));
			break;
		  default:
			break;
		};
	},

	pollChaQoSData: function() {
		poll.add(L.bind(async function() {
			var pie = this.pie.bind(this);
			var kpi = this.kpi.bind(this);
			var renderHostSpeed = this.renderHostSpeed.bind(this);

			try {
				// Get both IPv4 and IPv6 data
				const results = await Promise.all([
					fs.exec_direct('/usr/bin/aw-bpfctl', ['ipv4', 'json'], 'json'),
					fs.exec_direct('/usr/bin/aw-bpfctl', ['ipv6', 'json'], 'json'),
					fs.exec_direct('/usr/bin/aw-bpfctl', ['mac',  'json'], 'json')
				]);

				const defaultData = {status: "success", data: []};

				const ipv4_data = results[0] || defaultData;
				const ipv6_data = results[1] || defaultData;
				const mac_data  = results[2] || defaultData;

				// Render both IPv4 and IPv6 stats
				renderHostSpeed(ipv4_data, pie, kpi, "ipv4");  // IPv4
				renderHostSpeed(ipv6_data, pie, kpi, "ipv6");  // IPv6
				renderHostSpeed(mac_data, pie, kpi, "mac");    // MAC
			} catch (e) {
				console.error('Error polling data:', e);
			}
		}, this), 5);
	},
	handleAddSubmit: async function(val, type) {
		var pie = this.pie.bind(this);
		var kpi = this.kpi.bind(this);
		var renderHostSpeed = this.renderHostSpeed.bind(this);

		try {
			const results = await Promise.all([
				fs.exec_direct('/usr/bin/aw-bpfctl', [type, 'add', val], 'text'),
				fs.exec_direct('/usr/bin/aw-bpfctl', [type,  'json'], 'json')
			]);
			const defaultData = {status: "success", data: []};
			const refresh_data = results[1] || defaultData;
			renderHostSpeed(refresh_data, pie, kpi, type);

			ui.addNotification(null, E('p',_('Updated successfully!')), 3000, 'success');
		} catch (e) {
			ui.addNotification("", _('Error: ') + e.message, 3000, 'error');
		}
	},
	validateData: function(value, type) {
		if (typeof value !== 'string') return false;

		const ipv4Regex = /^((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;
		const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^(([0-9a-fA-F]{1,4}:){0,6}::([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4})$/i;
		const macRegex = /^([0-9A-Fa-f]{2}([-:]))([0-9A-Fa-f]{2}\2){4}[0-9A-Fa-f]{2}$|^([0-9A-Fa-f]{12})$/i;

		switch (type) {
		  case 'ipv4':
			return ipv4Regex.test(value);
		  case 'ipv6':
			return ipv6Regex.test(value);
		  case 'mac':
			return macRegex.test(value);
		  default:
			return false;
		}
	},
	createAddButtonValue: function(type, placeholder) {
		var input = E('input', {
				'type': 'text',
				'id': type + '-add-input',
				'class': 'cbi-input-text',
				'style': 'width:300px',
				'placeholder': _(placeholder)
			});

		var btn = E('button', {
				'class': 'btn cbi-button cbi-button-add',
				'id': type + '-add-btn',
				'disabled': 'disabled',
				'click': ui.createHandlerFn(this, function() {
					var inputValue = input.value.trim()
					if (!this.validateData(inputValue, type)) {
						ui.addNotification(null, _('Data format error'), 3000, "error");
						return
					}
					this.handleAddSubmit(inputValue, type);
					input.value = '';
				})
			}, _('Add'));

		input.addEventListener('input', function() {
			var isEmpty = this.value.trim() === '';
			btn.disabled = isEmpty;
		});
		return [input, btn]
	},
	render: function() {
		document.addEventListener('tooltip-open', L.bind(function(ev) {
			this.renderHostDetail(ev.detail.target, ev.target);
		}, this));

		if ('ontouchstart' in window) {
			document.addEventListener('touchstart', function(ev) {
				var tooltip = document.querySelector('.cbi-tooltip');
				if (tooltip === ev.target || tooltip.contains(ev.target))
					return;

				ui.hideTooltip(ev);
			});
		}

		var node = E([], [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('view/wifidogx.css') }),
			E('script', {
				'type': 'text/javascript',
				'src': L.resource('nlbw.chart.min.js')
			}),

			E('h2', [ _('Auth User Speed Monitor') ]),

			E('div', [
				E('div', { 'class': 'cbi-section', 'data-tab': 'speed', 'data-tab-title': _('Speed Distribution') }, [
					E('div', { 'class': 'head' }, [
						E('div', { 'class': 'pie' }, [
							E('label', [ _('Upload Speed / Host') ]),
							E('canvas', { 'id': 'speed-tx-pie', 'width': 200, 'height': 200 })
						]),

						E('div', { 'class': 'pie' }, [
							E('label', [ _('Download Speed / Host') ]),
							E('canvas', { 'id': 'speed-rx-pie', 'width': 200, 'height': 200 })
						]),

						E('div', { 'class': 'kpi' }, [
							E('ul', [
								E('li', _('<big id="speed-host">0</big> hosts')),
								E('li', _('<big id="speed-rx-max">0</big> download speed')),
								E('li', _('<big id="speed-tx-max">0</big> upload speed')),
							])
						])
					]),

					E('table', { 'class': 'table', 'id': 'speed-data' }, [
						E('tr', { 'class': 'tr table-titles' }, [
							E('th', { 'class': 'th left hostname' }, [ _('Host') ]),
							E('th', { 'class': 'th right' }, [ _('Upload Speed (Bit/s)') ]),
							E('th', { 'class': 'th right' }, [ _('Upload (Bytes)') ]),
							E('th', { 'class': 'th right' }, [ _('Upload (Packets)') ]),
							E('th', { 'class': 'th right' }, [ _('Download Speed (Bit/s)') ]),
							E('th', { 'class': 'th right' }, [ _('Download (Bytes)') ]),
							E('th', { 'class': 'th right' }, [ _('Download (Packets)') ]),
							E('th', { 'class': 'th center' }, [ _('Actions') ])
						]),
						E('tr', { 'class': 'tr placeholder' }, [
							E('td', { 'class': 'td' }, [
								E('em', { 'class': 'spinning' }, [ _('Collecting data...') ])
							])
						])
					]),
					E('div', { 'class': 'cbi-section-create cbi-tblsection-create' }, this.createAddButtonValue("ipv4", "Please enter a valid IPv4 address")),
				]),

				E('div', { 'class': 'cbi-section', 'data-tab': 'ipv6', 'data-tab-title': _('IPv6') }, [
					E('div', { 'class': 'head' }, [
						E('div', { 'class': 'pie' }, [
							E('label', [ _('Upload Speed / Host') ]),
							E('canvas', { 'id': 'ipv6-speed-tx-pie', 'width': 200, 'height': 200 })
						]),

						E('div', { 'class': 'pie' }, [
							E('label', [ _('Download Speed / Host') ]),
							E('canvas', { 'id': 'ipv6-speed-rx-pie', 'width': 200, 'height': 200 })
						]),

						E('div', { 'class': 'kpi' }, [
							E('ul', [
								E('li', _('<big id="ipv6-speed-host">0</big> hosts')),
								E('li', _('<big id="ipv6-speed-rx-max">0</big> download speed')),
								E('li', _('<big id="ipv6-speed-tx-max">0</big> upload speed')),
							])
						])
					]),

					E('table', { 'class': 'table', 'id': 'ipv6-speed-data' }, [
						E('tr', { 'class': 'tr table-titles' }, [
							E('th', { 'class': 'th left hostname' }, [ _('Host') ]),
							E('th', { 'class': 'th right' }, [ _('Upload Speed (Bit/s)') ]),
							E('th', { 'class': 'th right' }, [ _('Upload (Bytes)') ]),
							E('th', { 'class': 'th right' }, [ _('Upload (Packets)') ]),
							E('th', { 'class': 'th right' }, [ _('Download Speed (Bit/s)') ]),
							E('th', { 'class': 'th right' }, [ _('Download (Bytes)') ]),
							E('th', { 'class': 'th right' }, [ _('Download (Packets)') ]),
							E('th', { 'class': 'th center' }, [ _('Actions') ])
						]),
						E('tr', { 'class': 'tr placeholder' }, [
							E('td', { 'class': 'td' }, [
								E('em', { 'class': 'spinning' }, [ _('Collecting data...') ])
							])
						])
					]),
					E('div', { 'class': 'cbi-section-create cbi-tblsection-create' }, this.createAddButtonValue("ipv6", "Please enter a valid IPv6 address")),
				]),

				E('div', { 'class': 'cbi-section', 'data-tab': 'mac', 'data-tab-title': _('MAC') }, [
					E('div', { 'class': 'head' }, [
						E('div', { 'class': 'pie' }, [
							E('label', [ _('Upload Speed / Host') ]),
							E('canvas', { 'id': 'mac-speed-tx-pie', 'width': 200, 'height': 200 })
						]),

						E('div', { 'class': 'pie' }, [
							E('label', [ _('Download Speed / Host') ]),
							E('canvas', { 'id': 'mac-speed-rx-pie', 'width': 200, 'height': 200 })
						]),

						E('div', { 'class': 'kpi' }, [
							E('ul', [
								E('li', _('<big id="mac-speed-host">0</big> hosts')),
								E('li', _('<big id="mac-speed-rx-max">0</big> download speed')),
								E('li', _('<big id="mac-speed-tx-max">0</big> upload speed')),
							])
						])
					]),

					E('table', { 'class': 'table', 'id': 'mac-speed-data' }, [
						E('tr', { 'class': 'tr table-titles' }, [
							E('th', { 'class': 'th left hostname' }, [ _('Host') ]),
							E('th', { 'class': 'th right' }, [ _('Upload Speed (Bit/s)') ]),
							E('th', { 'class': 'th right' }, [ _('Upload (Bytes)') ]),
							E('th', { 'class': 'th right' }, [ _('Upload (Packets)') ]),
							E('th', { 'class': 'th right' }, [ _('Download Speed (Bit/s)') ]),
							E('th', { 'class': 'th right' }, [ _('Download (Bytes)') ]),
							E('th', { 'class': 'th right' }, [ _('Download (Packets)') ]),
							E('th', { 'class': 'th center' }, [ _('Actions') ])
						]),
						E('tr', { 'class': 'tr placeholder' }, [
							E('td', { 'class': 'td' }, [
								E('em', { 'class': 'spinning' }, [ _('Collecting data...') ])
							])
						])
					]),
					E('div', { 'class': 'cbi-section-create cbi-tblsection-create' }, this.createAddButtonValue("mac", "Please enter a valid MAC address")),
				])
			]),
		]);

		ui.tabs.initTabGroup(node.lastElementChild.childNodes);

		this.pollChaQoSData();

		return node;
	},

	handleSave: null,
	handleSaveApply: null,
	handleReset: null
});
