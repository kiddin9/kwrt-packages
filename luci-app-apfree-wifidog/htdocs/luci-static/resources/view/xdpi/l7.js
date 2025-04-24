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

return view.extend({
	load: function() {
		return Promise.all([
			this.loadSIDData(),
			this.loadL7ProtoData()
		]);
	},

	loadSIDData: function() {
		return fs.exec_direct('/usr/bin/aw-bpfctl', ['sid', 'json'], 'json').then(function(result) {
			return result;
		}).catch(function(error) {
			console.error('Error loading SID data:', error);
			return { status: 'error', data: [] };
		});
	},

	loadL7ProtoData: function() {
		return fs.exec_direct('/usr/bin/aw-bpfctl', ['l7', 'json'], 'json').then(function(result) {
			return result;
		}).catch(function(error) {
			console.error('Error loading L7 protocol data:', error);
			return { status: 'error', data: [] };
		});
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

	sortTable: function(table, column) {
		var tbody = table.querySelector('tbody');
		var rows = Array.from(tbody.querySelectorAll('tr:not(.table-titles):not(.placeholder)'));
		var reverse = (currentSortInfo.table === table && currentSortInfo.column === column) ? !currentSortInfo.reverse : false;

		// Reset all header classes
		table.querySelectorAll('th').forEach(function(th) {
			th.classList.remove('th-sort-asc', 'th-sort-desc');
			th.style.position = 'relative';
		});

		// Add sort indicator to current header
		var th = table.querySelector('th:nth-child(' + (column + 1) + ')');
		th.classList.add(reverse ? 'th-sort-desc' : 'th-sort-asc');

		rows.sort(function(row1, row2) {
			var a = row1.cells[column].getAttribute('data-value') || row1.cells[column].textContent;
			var b = row2.cells[column].getAttribute('data-value') || row2.cells[column].textContent;

			if (!isNaN(a) && !isNaN(b)) {
				a = Number(a);
				b = Number(b);
			}

			if (a < b) return reverse ? 1 : -1;
			if (a > b) return reverse ? -1 : 1;
			return 0;
		});

		// Update sort state
		currentSortInfo.table = table;
		currentSortInfo.column = column;
		currentSortInfo.reverse = reverse;

		// Remove existing rows
		rows.forEach(function(row) {
			tbody.removeChild(row);
		});

		// Add sorted rows
		rows.forEach(function(row) {
			tbody.appendChild(row);
		});
	},

	renderSIDData: function(data) {
		var rows = [];
		var rxData = [], txData = [];
		var rx_rate_total = 0, tx_rate_total = 0;
		var self = this;
		
		if (data && data.status === 'success' && Array.isArray(data.data)) {
			// Sort by incoming rate (download speed)
			data.data.sort((a, b) => b.incoming.rate - a.incoming.rate);
			
			data.data.forEach(function(item) {
				// Get domain name or protocol description based on sid_type
				var domainOrProto = item.sid_type === 'Domain' ? item.domain : 
								   (item.sid_type === 'L7' ? item.l7_proto_desc : '-');
				
				// outgoing is upload (rx), incoming is download (tx)
				rows.push([
					item.sid,
					domainOrProto,
					// Download (incoming) data
					[ item.incoming.rate, '%1024.2mbps'.format(item.incoming.rate) ],
					[ item.incoming.total_bytes, '%1024.2mB'.format(item.incoming.total_bytes) ],
					[ item.incoming.total_packets, '%1000.2mP'.format(item.incoming.total_packets) ],
					// Upload (outgoing) data
					[ item.outgoing.rate, '%1024.2mbps'.format(item.outgoing.rate) ],
					[ item.outgoing.total_bytes, '%1024.2mB'.format(item.outgoing.total_bytes) ],
					[ item.outgoing.total_packets, '%1000.2mP'.format(item.outgoing.total_packets) ]
				]);

				// txData is for download pie chart (incoming)
				txData.push({
					value: item.incoming.rate,
					label: domainOrProto // Just use domain/protocol as label, Chart.js will add the value itself
				});

				// rxData is for upload pie chart (outgoing)
				rxData.push({
					value: item.outgoing.rate,
					label: domainOrProto // Just use domain/protocol as label, Chart.js will add the value itself
				});

				// Update totals
				tx_rate_total += item.incoming.rate;  // Download total
				rx_rate_total += item.outgoing.rate;  // Upload total
			});
		}

		var table = document.getElementById('sid-data');
		var headers = table.querySelectorAll('th');
		
		// Add click handlers to headers if not already added
		if (!table.hasAttribute('data-sort-initialized')) {
			headers.forEach(function(header, index) {
				header.style.cursor = 'pointer';
				header.addEventListener('click', function() {
					self.sortTable(table, index);
				});
			});
			table.setAttribute('data-sort-initialized', 'true');
		}

		// Update table with new data
		cbi_update_table('#sid-data', rows, E('em', _('No data recorded yet.')));

		// Store numeric values as data attributes for sorting
		table.querySelectorAll('tr:not(.table-titles):not(.placeholder)').forEach(function(row) {
			Array.from(row.cells).forEach(function(cell, index) {
				if (Array.isArray(rows[0][index])) {
					cell.setAttribute('data-value', rows[0][index][0]);
				}
			});
		});

		// Update pie charts with correct data
		this.pie('sid-tx-pie', txData);  // Download pie chart (left)
		this.pie('sid-rx-pie', rxData);  // Upload pie chart (right)

		// Update KPI displays
		this.kpi('sid-tx-rate', '%1024.2mbps'.format(tx_rate_total));  // Download total
		this.kpi('sid-rx-rate', '%1024.2mbps'.format(rx_rate_total));  // Upload total
		this.kpi('sid-total', '%u'.format(rows.length));
	},

	renderL7ProtoData: function(data) {
		var rows = [];
		var self = this;
		
		if (data && data.status === 'success' && data.data) {
			// Handle protocols section
			if (Array.isArray(data.data.protocols)) {
				data.data.protocols.forEach(function(item) {
					rows.push([
						item.id,
						item.protocol,
						item.sid,
						'-' // Empty domain field for protocol entries
					]);
				});
			}
			
			// Handle domains section
			if (Array.isArray(data.data.domains)) {
				data.data.domains.forEach(function(item) {
					rows.push([
						item.id,
						'-', // Empty protocol field for domain entries
						item.sid,
						item.domain
					]);
				});
			}
		}

		var table = document.getElementById('l7proto-data');
		var headers = table.querySelectorAll('th');
		
		// Add click handlers to headers if not already added
		if (!table.hasAttribute('data-sort-initialized')) {
			headers.forEach(function(header, index) {
				header.style.cursor = 'pointer';
				header.addEventListener('click', function() {
					self.sortTable(table, index);
				});
			});
			table.setAttribute('data-sort-initialized', 'true');
		}

		cbi_update_table('#l7proto-data', rows, E('em', _('No data recorded yet.')));
	},

	pollL7Data: function() {
		var self = this;
		
		// Load L7 protocol data once
		this.loadL7ProtoData().then(function(data) {
			self.renderL7ProtoData(data);
		});

		// Poll SID data every 5 seconds
		poll.add(function() {
			return self.loadSIDData().then(function(data) {
				self.renderSIDData(data);
			});
		}, 5);
	},

	render: function() {
		var self = this;

		var node = E([], [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('view/wifidogx.css') }),
			E('style', { type: 'text/css' }, `
				.th-sort-asc::after {
					content: " ▲";
					display: inline-block;
					margin-left: 5px;
					font-size: 14px;
				}
				.th-sort-desc::after {
					content: " ▼";
					display: inline-block;
					margin-left: 5px;
					font-size: 14px;
				}
				.table .th {
					cursor: pointer;
					position: relative;
				}
				.table .th:hover {
					background-color: #f0f0f0;
				}
			`),
			E('script', {
				'type': 'text/javascript',
				'src': L.resource('echarts.simple.min.js')
			}),

			E('h2', [ _('L7 Data Monitor') ]),

			E('div', [
				E('div', { 'class': 'cbi-section', 'data-tab': 'sid', 'data-tab-title': _('L7 SID Data') }, [
					E('div', { 'class': 'head' }, [
						E('div', { 'class': 'pie' }, [
							E('label', [ _('Download Speed / SID') ]),
							E('canvas', { 'id': 'sid-tx-pie', 'width': 200, 'height': 200 })
						]),

						E('div', { 'class': 'pie' }, [
							E('label', [ _('Upload Speed / SID') ]),
							E('canvas', { 'id': 'sid-rx-pie', 'width': 200, 'height': 200 })
						]),

						E('div', { 'class': 'kpi' }, [
							E('ul', [
								E('li', _('<big id="sid-total">0</big> different SIDs')),
								E('li', _('<big id="sid-tx-rate">0</big> download speed')),
								E('li', _('<big id="sid-rx-rate">0</big> upload speed'))
							])
						])
					]),

					E('table', { 'class': 'table', 'id': 'sid-data' }, [
						E('tr', { 'class': 'tr table-titles' }, [
							E('th', { 'class': 'th left' }, [ _('SID') ]),
							E('th', { 'class': 'th left' }, [ _('Domain') ]),
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
							E('th', { 'class': 'th left' }, [ _('Protocol') ]),
							E('th', { 'class': 'th right' }, [ _('SID') ]),
							E('th', { 'class': 'th left' }, [ _('Domain') ])
						]),
						E('tr', { 'class': 'tr placeholder' }, [
							E('td', { 'class': 'td', 'colspan': '4' }, [
								E('em', { 'class': 'spinning' }, [ _('Collecting data...') ])
							])
						])
					])
				])
			])
		]);

		// Initialize tabs
		ui.tabs.initTabGroup(node.lastElementChild.childNodes);

		// Start polling
		this.pollL7Data();

		return node;
	},

	handleSave: null,
	handleSaveApply: null,
	handleReset: null
});