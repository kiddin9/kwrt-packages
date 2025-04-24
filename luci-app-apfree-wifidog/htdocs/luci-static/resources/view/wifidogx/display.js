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

var callNetworkRrdnsLookup = rpc.declare({
	object: 'network.rrdns',
	method: 'lookup',
	params: [ 'addrs', 'timeout', 'limit' ],
	expect: { '': {} }
});

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
	normalizeDat: function(data) {
		const total = data.reduce((n, d) => n + d.value, 0);
		const normalized = [...data];

		if (normalized.length >= 1) {
			const fakeValue = total*0.001
			normalized.push({
				value: fakeValue,
				name: '', // 空标签
				itemStyle: {
					color: 'transparent'
				},
				label: {
					show: false
				},
				tooltip: {
					show: false
				}
			});
		}

		return normalized;
	},
	pie: function(id, data) {
		const total = data.reduce((n, d) => n + d.value, 0);

		data.sort((a, b) => b.value - a.value);

		if (total === 0) {
			data = [{
				value: 1,
				color: '#cccccc',
				name: 'No traffic'
			}];
		}

		// 自动填充颜色
		data.forEach((d, i) => {
			if (!d.color) {
				const hue = 120 / (data.length - 1 || 1) * i;
				d.color = `hsl(${hue}, 80%, 50%)`;
			}
		});

		const option = {
			tooltip: {
				trigger: 'item',
				formatter: '{b}: {c} ({d}%)'
			},
			series: [
				{
					type: 'pie',
					radius: ['15%', '70%'],
					avoidLabelOverlap: false,
					itemStyle: {
						borderRadius: 5,
						borderColor: '#fff',
						borderWidth: 2
					},
					label: {
						show: false,
						position: 'center'
					},
					emphasis: {
						label: {
							show: true,
							fontSize: 12
						}
					},
					labelLine: {
						show: false
					},
					data: this.normalizeDat(data.map(d => ({
						value: d.value,
						name: d.label || d.name,
						itemStyle: { color: d.color }
					})))
				}
			]
		};

		const dom = typeof id === 'string' ? document.getElementById(id) : id;

		if (!chartRegistry[id]) {
			chartRegistry[id] = echarts.init(dom);
		}

		chartRegistry[id].setOption(option, true);  // 第二个参数 true 表示替换整个 option

		return chartRegistry[id];
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
				value: rec.rx_bytes,
				label: rec.ip || rec.mac
			});

			txData.push({
				value: rec.tx_bytes,
				label: rec.ip || rec.mac
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

	handleDeleteHost: function(host, type) {
		var pie = this.pie.bind(this);
		var kpi = this.kpi.bind(this);
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
							// Execute the delete command
							await fs.exec_direct('/usr/bin/aw-bpfctl', [type, 'del', host], 'text');
							
							// Get updated data
							const updatedData = await fs.exec_direct('/usr/bin/aw-bpfctl', [type, 'json'], 'json');
							
							// Refresh the table with new data
							const defaultData = {status: "success", data: []};
							renderHostSpeed(updatedData || defaultData, pie, kpi, type);
							
							ui.hideModal();
							ui.addNotification(null, E('p', _('Host deleted successfully')), 3000, 'success');
						} catch (e) {
							ui.hideModal();
							ui.addNotification(null, E('p', _('Error: ') + e.message), 3000, 'error');
						}
					})
				}, _('Delete'))
			])
		]);
	},

	// 编辑主机
	handleEditSpeed: function(host, mac, hostname, type) {
		// 原本使用当前的流量统计作为限速值是错误的
		// 我们需要从系统中获取当前已配置的限速值
		var rate_limit_dl = 0;
		var rate_limit_ul = 0;
		
		// 直接获取当前正在使用的 rate limit 值
		fs.exec_direct('/usr/bin/aw-bpfctl', [type, 'json'], 'json').then(result => {
			if (result && result.status === 'success' && Array.isArray(result.data)) {
				// 查找当前主机
				for (var i = 0; i < result.data.length; i++) {
					var item = result.data[i];
					if ((item.ip && item.ip === host) || (item.mac && item.mac === host)) {
						// 找到对应主机，提取其限速值
						// 根据 aw-bpfctl 的实际输出格式调整字段名
						if (item.incoming && item.incoming.incoming_rate_limit) {
							rate_limit_dl = item.incoming.incoming_rate_limit / 1024 / 1024; // 转换为 Mbps
						}
						if (item.outgoing && item.outgoing.outgoing_rate_limit) {
							rate_limit_ul = item.outgoing.outgoing_rate_limit / 1024 / 1024; // 转换为 Mbps
						}
						break;
					}
				}
			}
			
			// 显示对话框，使用实际的限速值
			this.displaySpeedLimitDialog(host, mac, hostname, type, rate_limit_dl, rate_limit_ul);
		}).catch(error => {
			console.error('获取限速值出错:', error);
			// 获取失败时使用默认值 0
			this.displaySpeedLimitDialog(host, mac, hostname, type, 0, 0);
		});
	},
	
	displaySpeedLimitDialog: function(host, mac, hostname, type, dl, ul) {
		let inputDom = E('input', {
			'type': 'text',
			'id': 'host-name',
			'class': 'cbi-input-text',
			'value': hostname,
			'disabled': 'disabled'
		})

		if (mac) {
			inputDom.removeAttribute('disabled');
		}

		var dialog = ui.showModal(_('Edit Speed Limit'), [
			E('div', { 'class': 'form-group' }, [
				E('label', { 'class': 'form-label' }, _('Host')),
				E('span',{}, host)
			]),
			E('div', { 'class': 'form-group' }, [
			E('label', { 'class': 'form-label' }, _('Hostname')),
				inputDom
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
							ul = document.getElementById('ul-rate').value,
							newName = document.getElementById('host-name').value;
						try {
							if (mac && newName != hostname) {
								hostNames[mac] = newName;
								uci.set('hostnames', hostNameMacSectionId, mac.split(':').join('_'), newName);
								uci.save('hostnames');
								uci.apply('hostnames');
								uci.unload('hostnames');
								uci.load('hostnames');
							}

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
		if (!data || !data.status || data.status !== "success" || !data.data) {
			return;
		}

		var rows = [];
		var rx_data = [];
		var tx_data = [];
		var rx_total = 0;
		var tx_total = 0;

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
						'click': ui.createHandlerFn(this, function(host, mac, hostname, type) {
							return function() {
								this.handleEditSpeed(host, mac, hostname, type);
							};
						}(host, rec.mac, hostname, type))
					}, _('Edit')),
					E('button', {
						'class': 'btn cbi-button cbi-button-remove',
						'click': ui.createHandlerFn(this, function(host, type) {
							return function() {
								this.handleDeleteHost(host, type);
							};
						}(host, type))
					}, _('Delete'))
				])
			]);

			rx_total += rec.outgoing.rate;
			tx_total += rec.incoming.rate;

			rx_data.push({
				value: rec.outgoing.rate,
				label: rec.ip || rec.mac
			});

			tx_data.push({
				value: rec.incoming.rate,
				label: rec.ip || rec.mac
			});
		}

		switch (type) {
			case "ipv4":
				cbi_update_table('#speed-data', rows, E('em', _('No data recorded yet.')));
				pie('speed-tx-pie', tx_data);  // Download pie chart
				pie('speed-rx-pie', rx_data);  // Upload pie chart
				kpi('speed-tx-max', '%1024.2mbps'.format(tx_total));  // Download total
				kpi('speed-rx-max', '%1024.2mbps'.format(rx_total));  // Upload total
				kpi('speed-host', '%u'.format(rows.length));
				break;
			case "ipv6":
				cbi_update_table('#ipv6-speed-data', rows, E('em', _('No data recorded yet.')));
				pie('ipv6-speed-tx-pie', tx_data);  // Download pie chart
				pie('ipv6-speed-rx-pie', rx_data);  // Upload pie chart
				kpi('ipv6-speed-tx-max', '%1024.2mbps'.format(tx_total));  // Download total
				kpi('ipv6-speed-rx-max', '%1024.2mbps'.format(rx_total));  // Upload total
				kpi('ipv6-speed-host', '%u'.format(rows.length));
				break;
			case "mac":
				cbi_update_table('#mac-speed-data', rows, E('em', _('No data recorded yet.')));
				pie('mac-speed-tx-pie', tx_data);  // Download pie chart
				pie('mac-speed-rx-pie', rx_data);  // Upload pie chart
				kpi('mac-speed-tx-max', '%1024.2mbps'.format(tx_total));  // Download total
				kpi('mac-speed-rx-max', '%1024.2mbps'.format(rx_total));  // Upload total
				kpi('mac-speed-host', '%u'.format(rows.length));
				break;
			default:
				break;
		}
	},

	pollChaQoSData: async function() {
		await uci.load('hostnames')

		poll.add(L.bind(async function() {
			await this.loadHostNames();
			await this.loadHostSpeedData();
		}, this), 5);
	},
	loadHostSpeedData: async function() {
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

			const ipv4Data = results[0] || defaultData;
			const ipv6Data = results[1] || defaultData;
			const macData  = results[2] || defaultData;
			
			// 确保所有添加按钮状态一致
			this.updateAllAddButtons();

			ipv4Data.data.forEach(item => {
				const mac = hostInfo[item.ip];
				if (mac) {
					item.mac = mac;
					item.hostname = hostNames[mac];
				} else {
					item.mac = null;
					item.hostname = "";
				}
			});
			// 遍历macData.data，根据mac地址获取对应的主机名,更新到macData.data中
			macData.data.forEach(item => {
				const mac = item.mac;
				if (mac) {
					item.hostname = hostNames[mac];
				} else {
					item.mac = null;
					item.hostname = "";
				}
			});
			// Render both IPv4 and IPv6 stats
			renderHostSpeed(ipv4Data, pie, kpi, "ipv4");  // IPv4
			renderHostSpeed(ipv6Data, pie, kpi, "ipv6");  // IPv6
			renderHostSpeed(macData, pie, kpi, "mac");    // MAC
		} catch (e) {
			console.error('Error polling data:', e);
		}
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
		let addInputWidth = 'width:180px';
		if (type == "ipv6") {
			addInputWidth = 'width:320px';
		}

		let input = E('input', {
				'type': 'text',
				'id': type + '-add-input',
				'class': 'cbi-input-text',
				'style': addInputWidth,
				'placeholder': _(placeholder)
			});

		let addBtn = E('button', {
				'class': 'btn cbi-button cbi-button-add',
				'id': type + '-add-btn',
				'disabled': 'disabled',
				'click': ui.createHandlerFn(this, function() {
					var inputValue = input.value.trim()
					if (!this.validateData(inputValue, type)) {
						ui.addNotification(null, _('Data format error'), 3000, "error");
						return
					}
					this.handleAddSubmit(inputValue, type).then(() => {
						// 添加操作完成后刷新页面，以确保所有UI元素正确重置
						this.loadHostSpeedData();
					});
					input.value = ''; // 清空输入框
				})
			}, _('Add'));

		let freshBtn = E('button', {
			'class': 'btn cbi-button cbi-button-add',
			'click': this.loadHostSpeedData.bind(this)
		}, _('Refreshing'));

		// 确保初始状态下按钮是禁用的
		addBtn.disabled = true;
		
		input.addEventListener('input', function() {
			var isEmpty = this.value.trim() === '';
			addBtn.disabled = isEmpty;
		});
		
		// 在页面加载后也执行一次检查，确保状态一致
		setTimeout(function() {
			var isEmpty = input.value.trim() === '';
			addBtn.disabled = isEmpty;
		}, 0);
		
		return [input, addBtn, freshBtn];
	},
	updateAllAddButtons: function() {
		// 获取所有类型的添加按钮和输入框
		['ipv4', 'ipv6', 'mac'].forEach(type => {
			const input = document.getElementById(type + '-add-input');
			const addBtn = document.getElementById(type + '-add-btn');
			
			if (input && addBtn) {
				// 检查输入框是否有值，并相应设置按钮状态
				const isEmpty = input.value.trim() === '';
				addBtn.disabled = isEmpty;
			}
		});
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

		let pidWidth = 200, pidHeight = 200;
		const width = window.innerWidth;
		if (width < 800) {
			pidWidth = pidHeight = width/4
		}
		console.log("width ", width)
		var node = E([], [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('view/wifidogx.css') }),
			E('script', {
				'type': 'text/javascript',
				'src': L.resource('echarts.simple.min.js')
			}),

			E('h2', [ _('Auth User Speed Monitor') ]),

			E('div', [
				E('div', { 'class': 'cbi-section', 'data-tab': 'speed', 'data-tab-title': _('Speed Distribution') }, [
					E('div', { 'class': 'head' }, [
						E('div', { 'class': 'pie' }, [
							E('label', [ _('Download Speed / Host') ]),
							E('canvas', { 'id': 'speed-tx-pie', 'width': pidWidth, 'height': pidHeight })
						]),

						E('div', { 'class': 'pie' }, [
							E('label', [ _('Upload Speed / Host') ]),
							E('canvas', { 'id': 'speed-rx-pie', 'width': pidWidth, 'height': pidHeight })
						]),

						E('div', { 'class': 'kpi' }, [
							E('ul', [
								E('li', _('<big id="speed-host">0</big> hosts')),
								E('li', _('<big id="speed-tx-max">0</big> download speed')),
								E('li', _('<big id="speed-rx-max">0</big> upload speed')),
							])
						])
					]),

					E('table', { 'class': 'table', 'id': 'speed-data' }, [
						E('tr', { 'class': 'tr table-titles' }, [
							E('th', { 'class': 'th left hostname' }, [ _('Host') ]),
							E('th', { 'class': 'th left hostname' }, [ _('Hostname') ]),
							E('th', { 'class': 'th left' }, [ _('Download Speed (Bit/s)') ]),
							E('th', { 'class': 'th left' }, [ _('Download (Bytes)') ]),
							E('th', { 'class': 'th left' }, [ _('Download (Packets)') ]),
							E('th', { 'class': 'th left' }, [ _('Upload Speed (Bit/s)') ]),
							E('th', { 'class': 'th left' }, [ _('Upload (Bytes)') ]),
							E('th', { 'class': 'th left' }, [ _('Upload (Packets)') ]),
							E('th', { 'class': 'th left' }, [ _('Actions') ])
						]),
						E('tr', { 'class': 'tr placeholder' }, [
							E('td', { 'class': 'td' }, [
								E('em', { 'class': 'spinning' }, [ _('Collecting data...') ])
							])
						])
					]),
					E('div', { 'style': 'align-items: center; padding: 0.5rem 1rem;' }, this.createAddButtonValue("ipv4", "Please enter a valid IPv4 address")),
				]),

				E('div', { 'class': 'cbi-section', 'data-tab': 'ipv6', 'data-tab-title': _('IPv6') }, [
					E('div', { 'class': 'head' }, [
						E('div', { 'class': 'pie' }, [
							E('label', [ _('Download Speed / Host') ]),
							E('canvas', { 'id': 'ipv6-speed-tx-pie', 'width': pidWidth, 'height': pidHeight })
						]),

						E('div', { 'class': 'pie' }, [
							E('label', [ _('Upload Speed / Host') ]),
							E('canvas', { 'id': 'ipv6-speed-rx-pie', 'width': pidWidth, 'height': pidHeight })
						]),

						E('div', { 'class': 'kpi' }, [
							E('ul', [
								E('li', _('<big id="ipv6-speed-host">0</big> hosts')),
								E('li', _('<big id="ipv6-speed-tx-max">0</big> download speed')),
								E('li', _('<big id="ipv6-speed-rx-max">0</big> upload speed')),
							])
						])
					]),

					E('table', { 'class': 'table', 'id': 'ipv6-speed-data' }, [
						E('tr', { 'class': 'tr table-titles' }, [
							E('th', { 'class': 'th left hostname' }, [ _('Host') ]),
							E('th', { 'class': 'th left hostname' }, [ _('Hostname') ]),
							E('th', { 'class': 'th left' }, [ _('Download Speed (Bit/s)') ]),
							E('th', { 'class': 'th left' }, [ _('Download (Bytes)') ]),
							E('th', { 'class': 'th left' }, [ _('Download (Packets)') ]),
							E('th', { 'class': 'th left' }, [ _('Upload Speed (Bit/s)') ]),
							E('th', { 'class': 'th left' }, [ _('Upload (Bytes)') ]),
							E('th', { 'class': 'th left' }, [ _('Upload (Packets)') ]),
							E('th', { 'class': 'th left' }, [ _('Actions') ])
						]),
						E('tr', { 'class': 'tr placeholder' }, [
							E('td', { 'class': 'td' }, [
								E('em', { 'class': 'spinning' }, [ _('Collecting data...') ])
							])
						])
					]),
					E('div', { 'style': 'align-items: center; padding: 0.5rem 1rem;' }, this.createAddButtonValue("ipv6", "Please enter a valid IPv6 address")),
				]),

				E('div', { 'class': 'cbi-section', 'data-tab': 'mac', 'data-tab-title': _('MAC') }, [
					E('div', { 'class': 'head' }, [
						E('div', { 'class': 'pie' }, [
							E('label', [ _('Download Speed / Host') ]),
							E('canvas', { 'id': 'mac-speed-tx-pie', 'width': pidWidth, 'height': pidHeight })
						]),

						E('div', { 'class': 'pie' }, [
							E('label', [ _('Upload Speed / Host') ]),
							E('canvas', { 'id': 'mac-speed-rx-pie', 'width': pidWidth, 'height': pidHeight })
						]),

						E('div', { 'class': 'kpi' }, [
							E('ul', [
								E('li', _('<big id="mac-speed-host">0</big> hosts')),
								E('li', _('<big id="mac-speed-tx-max">0</big> download speed')),
								E('li', _('<big id="mac-speed-rx-max">0</big> upload speed')),
							])
						])
					]),

					E('table', { 'class': 'table', 'id': 'mac-speed-data' }, [
						E('tr', { 'class': 'tr table-titles' }, [
							E('th', { 'class': 'th left hostname' }, [ _('Host') ]),
							E('th', { 'class': 'th left hostname' }, [ _('Hostname') ]),
							E('th', { 'class': 'th left' }, [ _('Download Speed (Bit/s)') ]),
							E('th', { 'class': 'th left' }, [ _('Download (Bytes)') ]),
							E('th', { 'class': 'th left' }, [ _('Download (Packets)') ]),
							E('th', { 'class': 'th left' }, [ _('Upload Speed (Bit/s)') ]),
							E('th', { 'class': 'th left' }, [ _('Upload (Bytes)') ]),
							E('th', { 'class': 'th left' }, [ _('Upload (Packets)') ]),
							E('th', { 'class': 'th left' }, [ _('Actions') ])
						]),
						E('tr', { 'class': 'tr placeholder' }, [
							E('td', { 'class': 'td' }, [
								E('em', { 'class': 'spinning' }, [ _('Collecting data...') ])
							])
						])
					]),
					E('div', { 'style': 'align-items: center; padding: 0.5rem 1rem;' }, this.createAddButtonValue("mac", "Please enter a valid MAC address")),
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
