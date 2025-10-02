'use strict';
'require view';
'require fs';
'require ui';
'require poll';
'require rpc';
'require dom';

var chartRegistry = {};
var currentSortInfo = {
	table: null,
	column: null,
	reverse: false
};
var sidLookupTable = {};
var isPaused = false;
var lastUpdated = null;
var pollActive = false;
var lastSIDData = null;

return view.extend({
	load: function() {
		return Promise.all([
			this.loadSIDData(),
			this.loadL7ProtoData()
		]);
	},

	showError: function(message) {
		var errorEl = document.getElementById('l7-error-message');
		if (errorEl) {
			errorEl.textContent = message;
			errorEl.style.display = 'block';
		}
	},

	hideError: function() {
		var errorEl = document.getElementById('l7-error-message');
		if (errorEl) {
			errorEl.style.display = 'none';
		}
	},

	loadSIDData: function() {
		var self = this;
		return fs.exec_direct('/usr/bin/aw-bpfctl', ['sid', 'json'], 'json').then(function(result) {
			self.hideError();
			lastSIDData = result;
			return result;
		}).catch(function(error) {
			console.error('Error loading SID data:', error);
			self.showError(_('Error loading SID data: %s').format(error.message));
			return { status: 'error', data: [] };
		});
	},

	loadL7ProtoData: function() {
		var self = this;
		return fs.exec_direct('/usr/bin/aw-bpfctl', ['l7', 'json'], 'json').then(function(result) {
			self.hideError();
			return result;
		}).catch(function(error) {
			console.error('Error loading L7 protocol data:', error);
			self.showError(_('Error loading L7 protocol data: %s').format(error.message));
			return { status: 'error', data: [] };
		});
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

	sortTable: function(table, column) {
		var tbody = table.querySelector('tbody');
		if (!tbody) return;
		var rows = Array.from(tbody.querySelectorAll('tr:not(.table-titles):not(.placeholder)'));
		var reverse = (currentSortInfo.table === table && currentSortInfo.column === column) ? !currentSortInfo.reverse : false;

		table.querySelectorAll('th').forEach(function(th) {
			th.classList.remove('th-sort-asc', 'th-sort-desc');
		});

		var th = table.querySelector('th:nth-child(' + (column + 1) + ')');
		th.classList.add(reverse ? 'th-sort-desc' : 'th-sort-asc');

		rows.sort(function(row1, row2) {
			var a = row1.cells[column].getAttribute('data-value') || row1.cells[column].textContent;
			var b = row2.cells[column].getAttribute('data-value') || row2.cells[column].textContent;

			if (!isNaN(a) && !isNaN(b)) { a = Number(a); b = Number(b); }

			if (a < b) return reverse ? 1 : -1;
			if (a > b) return reverse ? -1 : 1;
			return 0;
		});

		currentSortInfo.table = table;
		currentSortInfo.column = column;
		currentSortInfo.reverse = reverse;

		rows.forEach(function(row) { tbody.removeChild(row); });
		rows.forEach(function(row) { tbody.appendChild(row); });
	},

	renderSIDData: function(data) {
		var rows = [];
		var txRateData = [], rxRateData = [];
		var txVolumeData = [], rxVolumeData = [];
		var tx_rate_total = 0, rx_rate_total = 0;
		var tx_bytes_total = 0, rx_bytes_total = 0;
		var self = this;
		var allItems = [];
		
		if (data && data.status === 'success' && Array.isArray(data.data)) {
			allItems = data.data;
			var listSizeEl = document.getElementById('sid-size-select');
			var listSize = listSizeEl ? parseInt(listSizeEl.value, 10) : 10;

			var activeConnections = allItems.filter(function(item) { return item.incoming.rate > 0 || item.outgoing.rate > 0; });
			var inactiveConnections = allItems.filter(function(item) { return item.incoming.rate === 0 && item.outgoing.rate === 0; });
		
			activeConnections.sort(function(a, b) { return (b.incoming.rate + b.outgoing.rate) - (a.incoming.rate + a.outgoing.rate); });
			inactiveConnections.sort(function(a, b) { return b.incoming.total_bytes - a.incoming.total_bytes; });
		
			var displayData = activeConnections;
			if (displayData.length < listSize) {
				displayData = displayData.concat(inactiveConnections.slice(0, listSize - displayData.length));
			}
			
			if (displayData.length > listSize) {
				displayData = displayData.slice(0, listSize);
			}

			displayData.forEach(function(item) {
				var domainOrL7Proto = 'unknown';
				var lookupInfo = sidLookupTable[item.sid];
				
				if (lookupInfo) {
					domainOrL7Proto = lookupInfo.name;
				} else if (item.sid_type === 'Domain' && item.domain && item.domain !== 'unknown') {
					domainOrL7Proto = item.domain;
				} else if (item.sid_type === 'L7' && item.l7_proto_desc && item.l7_proto_desc !== 'unknown') {
					domainOrL7Proto = item.l7_proto_desc;
				}
				
				rows.push([
					item.sid,
					domainOrL7Proto,
					[ item.incoming.rate, '%1024.2mbps'.format(item.incoming.rate) ],
					[ item.incoming.total_bytes, '%1024.2mB'.format(item.incoming.total_bytes) ],
					[ item.incoming.total_packets, '%1000.2mP'.format(item.incoming.total_packets) ],
					[ item.outgoing.rate, '%1024.2mbps'.format(item.outgoing.rate) ],
					[ item.outgoing.total_bytes, '%1024.2mB'.format(item.outgoing.total_bytes) ],
					[ item.outgoing.total_packets, '%1000.2mP'.format(item.outgoing.total_packets) ]
				]);

				txRateData.push({ value: item.incoming.rate, label: domainOrL7Proto });
				rxRateData.push({ value: item.outgoing.rate, label: domainOrL7Proto });
				txVolumeData.push({ value: item.incoming.total_bytes, label: domainOrL7Proto });
				rxVolumeData.push({ value: item.outgoing.total_bytes, label: domainOrL7Proto });
			});

			allItems.forEach(function(item) {
				tx_rate_total += item.incoming.rate;
				rx_rate_total += item.outgoing.rate;
				tx_bytes_total += item.incoming.total_bytes;
				rx_bytes_total += item.outgoing.total_bytes;
			});
		}

		var table = document.getElementById('sid-data');
		cbi_update_table('#sid-data', rows, E('em', _('No data recorded yet.')));

		var headers = table.querySelectorAll('th');
		
		if (!table.hasAttribute('data-sort-initialized')) {
			headers.forEach(function(header, index) {
				header.style.cursor = 'pointer';
				header.addEventListener('click', function() { self.sortTable(table, index); });
			});
			table.setAttribute('data-sort-initialized', 'true');
		}

		table.querySelectorAll('tr:not(.table-titles):not(.placeholder)').forEach(function(row, rowIndex) {
			if (!rows[rowIndex]) return;
			Array.from(row.cells).forEach(function(cell, cellIndex) {
				if (Array.isArray(rows[rowIndex][cellIndex])) {
					cell.setAttribute('data-value', rows[rowIndex][cellIndex][0]);
				}
			});
		});

		this.pie('sid-tx-rate-pie', txRateData, function(p) { return p.name + ': ' + '%1024.2mbps'.format(p.value) + ' (' + p.percent + '%)'; });
		this.pie('sid-rx-rate-pie', rxRateData, function(p) { return p.name + ': ' + '%1024.2mbps'.format(p.value) + ' (' + p.percent + '%)'; });
		this.pie('sid-tx-volume-pie', txVolumeData, function(p) { return p.name + ': ' + '%1024.2mB'.format(p.value) + ' (' + p.percent + '%)'; });
		this.pie('sid-rx-volume-pie', rxVolumeData, function(p) { return p.name + ': ' + '%1024.2mB'.format(p.value) + ' (' + p.percent + '%)'; });

		var sidTotalEl = document.getElementById('sid-total-val');
		if(sidTotalEl) sidTotalEl.textContent = allItems.length;

		var txRateEl = document.getElementById('sid-tx-rate-val');
		if(txRateEl) txRateEl.textContent = '%1024.2mbps'.format(tx_rate_total);

		var rxRateEl = document.getElementById('sid-rx-rate-val');
		if(rxRateEl) rxRateEl.textContent = '%1024.2mbps'.format(rx_rate_total);

		var txVolEl = document.getElementById('sid-tx-volume-val');
		if(txVolEl) txVolEl.textContent = '%1024.2mB'.format(tx_bytes_total);

		var rxVolEl = document.getElementById('sid-rx-volume-val');
		if(rxVolEl) rxVolEl.textContent = '%1024.2mB'.format(rx_bytes_total);

		lastUpdated = new Date();
		var timestampEl = document.getElementById('last-updated');
		if (timestampEl) {
			timestampEl.textContent = _('Last updated: %s').format(lastUpdated.toLocaleTimeString());
		}
	},

	renderL7ProtoData: function(data) {
		var rows = [];
		var self = this;
		
		sidLookupTable = {};
		
		if (data && data.status === 'success' && data.data) {
			if (Array.isArray(data.data.protocols)) {
				data.data.protocols.forEach(function(item) {
					sidLookupTable[item.sid] = { type: 'protocol', name: item.protocol };
					rows.push([ item.id, item.protocol, item.sid ]);
				});
			}
			
			if (Array.isArray(data.data.domains)) {
				data.data.domains.forEach(function(item) {
					sidLookupTable[item.sid] = { type: 'domain', name: item.domain };
					rows.push([ item.id, item.domain, item.sid ]);
				});
			}
		}

		var table = document.getElementById('l7proto-data');
		var headers = table.querySelectorAll('th');
		
		if (!table.hasAttribute('data-sort-initialized')) {
			headers.forEach(function(header, index) {
				header.style.cursor = 'pointer';
				header.addEventListener('click', function() { self.sortTable(table, index); });
			});
			table.setAttribute('data-sort-initialized', 'true');
		}

		cbi_update_table('#l7proto-data', rows, E('em', _('No data recorded yet.')));
	},

	pollL7Data: function() {
		if (pollActive) return;

		var self = this;
		pollActive = true;
		
		self.loadL7ProtoData().then(function(l7data) {
			self.renderL7ProtoData(l7data);
			return self.loadSIDData();
		}).then(function(sidData){
			self.renderSIDData(sidData);
		});

		poll.add(function() {
			if (isPaused) return Promise.resolve();
			
			return self.loadL7ProtoData().then(function(data) {
				self.renderL7ProtoData(data);
			}).then(function() {
				return self.loadSIDData().then(function(data) {
					self.renderSIDData(data);
				});
			});
		}, 5);
	},

	render: function() {
		var self = this;

		var tabContainer = E('div', {}, [
			E('div', { 'class': 'cbi-section', 'data-tab': 'sid', 'data-tab-title': _('L7 SID Data') }, [
				E('div', { 'class': 'dashboard-container' }, [
					E('div', { 'class': 'kpi-row' }, [
						E('div', { 'class': 'kpi-card' }, [ E('big', { id: 'sid-total-val' }, '0'), E('span', { 'class': 'kpi-card-label' }, _('Active Clients')) ]),
						E('div', { 'class': 'kpi-card' }, [ E('big', { id: 'sid-tx-rate-val' }, '0'), E('span', { 'class': 'kpi-card-label' }, _('Download Speed')) ]),
						E('div', { 'class': 'kpi-card' }, [ E('big', { id: 'sid-rx-rate-val' }, '0'), E('span', { 'class': 'kpi-card-label' }, _('Upload Speed')) ]),
						E('div', { 'class': 'kpi-card' }, [ E('big', { id: 'sid-tx-volume-val' }, '0'), E('span', { 'class': 'kpi-card-label' }, _('Download Total')) ]),
						E('div', { 'class': 'kpi-card' }, [ E('big', { id: 'sid-rx-volume-val' }, '0'), E('span', { 'class': 'kpi-card-label' }, _('Upload Total')) ])
					]),
					E('div', { 'class': 'chart-grid' }, [
						E('div', { 'class': 'chart-card' }, [
							E('h4', [_('Download Speed / SID')]),
							E('canvas', { id: 'sid-tx-rate-pie', height: '250' })
						]),
						E('div', { 'class': 'chart-card' }, [
							E('h4', [_('Upload Speed / SID')]),
							E('canvas', { id: 'sid-rx-rate-pie', height: '250' })
						]),
						E('div', { 'class': 'chart-card' }, [
							E('h4', [_('Download Traffic / SID')]),
							E('canvas', { id: 'sid-tx-volume-pie', height: '250' })
						]),
						E('div', { 'class': 'chart-card' }, [
							E('h4', [_('Upload Traffic / SID')]),
							E('canvas', { id: 'sid-rx-volume-pie', height: '250' })
						])
					])
				]),
				E('table', { 'class': 'table', 'id': 'sid-data' }, [
					E('tr', { 'class': 'tr table-titles' }, [
						E('th', { 'class': 'th left' }, [ _('SID') ]),
						E('th', { 'class': 'th left' }, [ _('Domain&L7Protocol') ]),
						E('th', { 'class': 'th right' }, [ _('Download Speed (Bit/s)') ]),
						E('th', { 'class': 'th right' }, [ _('Download (Bytes)') ]),
						E('th', { 'class': 'th right' }, [ _('Download (Packets)') ]),
						E('th', { 'class': 'th right' }, [ _('Upload Speed (Bit/s)') ]),
						E('th', { 'class': 'th right' }, [ _('Upload (Bytes)') ]),
						E('th', { 'class': 'th right' }, [ _('Upload (Packets)') ])
					]),
					E('tr', { 'class': 'tr placeholder' }, [
						E('td', { 'class': 'td', 'colspan': '8' }, [
							E('em', { 'class': 'spinning' }, [ _('Collecting data...') ])
						])
					])
				])
			]),
			E('div', { 'class': 'cbi-section', 'data-tab': 'l7proto', 'data-tab-title': _('L7 Protocol Data') }, [
				E('table', { 'class': 'table', 'id': 'l7proto-data' }, [
					E('tr', { 'class': 'tr table-titles' }, [
						E('th', { 'class': 'th left' }, [ _('ID') ]),
						E('th', { 'class': 'th left' }, [ _('Domain&L7Protocol') ]),
						E('th', { 'class': 'th right' }, [ _('SID') ])
					]),
					E('tr', { 'class': 'tr placeholder' }, [
						E('td', { 'class': 'td', 'colspan': '3' }, [
							E('em', { 'class': 'spinning' }, [ _('Collecting data...') ])
						])
					])
				])
			])
		]);

		var controls = E('div', { 'class': 'l7-controls' }, [
			E('div', { 'class': 'l7-controls-left' }, [
				E('label', { 'for': 'sid-size-select' }, _('Show entries: ')),
				E('select', {
					'id': 'sid-size-select',
					'change': ui.createHandlerFn(this, function() {
						if (lastSIDData) {
							self.renderSIDData(lastSIDData);
						}
					})
				}, [
					E('option', { 'value': '10' }, '10'),
					E('option', { 'value': '15' }, '15'),
					E('option', { 'value': '20' }, '20'),
					E('option', { 'value': '25' }, '25')
				])
			]),
			E('div', { 'class': 'l7-controls-right' }, [
				E('span', { 'id': 'last-updated' }, _('Last updated: never')),
				E('button', {
					'class': 'cbi-button cbi-button-apply',
					'click': function(ev) {
						isPaused = !isPaused;
						ev.target.textContent = isPaused ? _('Resume') : _('Pause');
					}
				}, _('Pause'))
			])
		]);

		var node = E([], [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('view/wifidogx.css') }),
			E('style', { type: 'text/css' },
			'.th-sort-asc::after { content: " ▲"; display: inline-block; margin-left: 5px; font-size: 14px; } '+
			'.th-sort-desc::after { content: " ▼"; display: inline-block; margin-left: 5px; font-size: 14px; } '+
			'.table .th { cursor: pointer; position: relative; } '+
			'.table .th:hover { background-color: #f0f0f0; } '+
			'#l7-error-message { color: red; background-color: #ffefef; border: 1px solid red; padding: 10px; margin-bottom: 10px; display: none; } '+
			'.dashboard-container { display: flex; flex-direction: column; gap: 20px; margin-bottom: 20px; } '+
			'.kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; } '+
			'.kpi-card { background-color: #f9f9f9; border-radius: 8px; padding: 15px; text-align: center; border: 1px solid #e0e0e0; } '+
			'.kpi-card big { display: block; font-size: 1.8em; font-weight: bold; color: #3771c8; } '+
			'.kpi-card-label { font-size: 0.9em; color: #666; } '+
			'.chart-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; } '+
			'.chart-card { background-color: #ffffff; border-radius: 8px; padding: 20px; border: 1px solid #e0e0e0; } '+
			'.chart-card h4 { margin-top: 0; margin-bottom: 15px; text-align: center; font-size: 1.1em; } '+
			'.chart-card canvas { max-width: 100%; height: auto !important; } '+
			'.l7-controls { display: flex; justify-content: space-between; align-items: center; margin-top: 15px; padding: 10px; background-color: #f2f2f2; border-radius: 4px; } ' +
			'.l7-controls-left, .l7-controls-right { display: flex; align-items: center; gap: 15px; } '
			),
			E('script', { 'type': 'text/javascript', 'src': L.resource('echarts.simple.min.js') }),

			E('h2', [ _('L7 Data Monitor') ]),
			E('div', { 'id': 'l7-error-message' }),
			tabContainer,
			controls
		]);

		ui.tabs.initTabGroup(tabContainer.childNodes);

		setTimeout(this.pollL7Data.bind(this), 0);

		return node;
	},

	handleSave: null,
	handleSaveApply: null,
	handleReset: null
});