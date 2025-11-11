'use strict';
'require view';
'require dom';
'require uci';
'require fs';
'require ui';
'require rpc';
'require form';
'require poll';
'require request';

/*
	Copyright (c) 2024-2025 Rafał Wabik - IceG - From eko.one.pl forum
	
	Licensed to the GNU General Public License v3.0.
	
	
	Transfer statistics from easyconfig available in LuCI JS. 
	Package is my simplified conversion.
	You are using a development version of package.
	
	More information on <https://eko.one.pl/?p=easyconfig>.
*/

var callLuciDHCPLeases = rpc.declare({
	object: 'luci-rpc',
	method: 'getDHCPLeases',
	expect: { '': {} }
});

var tableSortState = { col: 4, asc: false };
var graphSVGTemplate = null;
var graphsRoot = null;
var graphsByKey = {};
var tabsInitialized = false;
var clientTabsInitialized = false;
var clientTablesByKey = {};

var clientTableData = {
	'client-period': [],
	'client-today': [],
	'client-monthly': [],
	'client-yearly': [],
	'client-usage-history': []
};

var clientTableSortStates = {
	'client-period': { col: 4, asc: false },
	'client-today': { col: 4, asc: false },
	'client-monthly': { col: 4, asc: false },
	'client-yearly': { col: 4, asc: false },
	'client-usage-history': { col: 0, asc: false }
};

var hourlyDistribution = [
  0.02, 0.01, 0.01, 0.01, 0.02, 0.03, 0.05, 0.08, 0.09, 0.08, 0.07, 0.06,
  0.07, 0.06, 0.05, 0.06, 0.07, 0.08, 0.09, 0.08, 0.06, 0.05, 0.04, 0.03
];

function updateStatsFileSize() {
	var statsPromise = fs.stat('/tmp/easyconfig_statistics.json').then(function(stat) {
		var sizeElement = document.getElementById('stats-file-size');
		var containerElement = document.getElementById('stats-file-size-container');
		
		if (stat && stat.size > 0) {
			sizeElement.textContent = bytesToSize(stat.size);
			containerElement.style.display = 'block';
		} else {
			containerElement.style.display = 'none';
		}
	}).catch(function(e) {
		var containerElement = document.getElementById('stats-file-size-container');
		if (containerElement) {
			containerElement.style.display = 'none';
		}
	});
	
	var archivePromise = fs.stat('/usr/lib/easyconfig/easyconfig_statistics.json.gz').then(function(stat) {
		var sizeElement = document.getElementById('stats-archive-size');
		var containerElement = document.getElementById('stats-archive-size-container');
		
		if (stat && stat.size > 0) {
			sizeElement.textContent = bytesToSize(stat.size);
			containerElement.style.display = 'block';
		} else {
			containerElement.style.display = 'none';
		}
	}).catch(function(e) {
		var containerElement = document.getElementById('stats-archive-size-container');
		if (containerElement) {
			containerElement.style.display = 'none';
		}
	});
	
	return Promise.all([statsPromise, archivePromise]);
}

function popTimeout(a, message, timeout, severity) {
    ui.addTimeLimitedNotification(a, message, timeout, severity)
}

function drawPieChart(container, data, title) {
	var oldSvg = container.querySelector('.pie-chart-svg');
	if (oldSvg) oldSvg.remove();
	var oldLegend = container.querySelector('.pie-chart-legend');
	if (oldLegend) oldLegend.remove();
	var oldTooltip = container.querySelector('.pie-tooltip');
	if (oldTooltip) oldTooltip.remove();
	var oldWrapper = container.querySelector('.pie-chart-wrapper');
	if (oldWrapper) oldWrapper.remove();
	var oldEmpty = container.querySelector('.pie-chart-empty');
	if (oldEmpty) oldEmpty.remove();

	if (!data || data.length === 0) {
		container.appendChild(E('div', { 
			'class': 'pie-chart-empty',
			'style': 'text-align: center; padding: 50px; color: var(--text-color-medium, #666);'
		}, _('No data available')));
		return;
	}

	data.sort(function(a, b) { return b.value - a.value; });

	var total = data.reduce(function(sum, item) { return sum + item.value; }, 0);
	if (total === 0) {
		container.appendChild(E('div', { 
			'class': 'pie-chart-empty',
			'style': 'text-align: center; padding: 50px; color: var(--text-color-medium, #666);'
		}, _('No data available')));
		return;
	}
	
	var solidColors = [
		'#4169E1', '#32CD32', '#FF6B6B', '#FFA500', '#9B59B6',
		'#1ABC9C', '#E74C3C', '#3498DB', '#F39C12', '#2ECC71',
		'#E67E22', '#95A5A6', '#D35400', '#27AE60', '#2980B9',
		'#8E44AD', '#16A085', '#C0392B', '#7F8C8D', '#D98880'
	];

	var fillColors = [
		'rgba(65, 105, 225, 0.3)',
		'rgba(50, 205, 50, 0.3)',
		'rgba(255, 107, 107, 0.3)',
		'rgba(255, 165, 0, 0.3)',
		'rgba(155, 89, 182, 0.3)',
		'rgba(26, 188, 156, 0.3)',
		'rgba(231, 76, 60, 0.3)',
		'rgba(52, 152, 219, 0.3)',
		'rgba(243, 156, 18, 0.3)',
		'rgba(46, 204, 113, 0.3)',
		'rgba(230, 126, 34, 0.3)',
		'rgba(149, 165, 166, 0.3)',
		'rgba(211, 84, 0, 0.3)',
		'rgba(39, 174, 96, 0.3)',
		'rgba(41, 128, 185, 0.3)',
		'rgba(142, 68, 173, 0.3)',
		'rgba(22, 160, 133, 0.3)',
		'rgba(192, 57, 43, 0.3)',
		'rgba(127, 140, 141, 0.3)',
		'rgba(217, 136, 128, 0.3)'
	];

	var size = 300;
	var radius = size / 2 - 20;
	var centerX = size / 2;
	var centerY = size / 2;

	var wrapper = E('div', {
		'class': 'pie-chart-wrapper',
		'style': 'display: flex; align-items: flex-start; justify-content: center; gap: 30px; margin: 10px 0; flex-wrap: wrap;'
	});

	// SVG
	var svgContainer = E('div', {
		'class': 'pie-chart-svg-container',
		'style': 'position: relative; flex-shrink: 0;'
	});

	var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	svg.setAttribute('class', 'pie-chart-svg');
	svg.setAttribute('width', size);
	svg.setAttribute('height', size);
	svg.setAttribute('viewBox', '0 0 ' + size + ' ' + size);
	svg.style.display = 'block';
	svg.style.borderRadius = '0';
	svg.style.background = 'var(--background-color-high, #fff)';

	var tooltip = E('div', {
		'class': 'pie-tooltip',
		'style': 'position: absolute; display: none; padding: 10px; border-radius: 6px; font-size: 12px; pointer-events: none; z-index: 10000; background: color-mix(in srgb, var(--border-color-medium, #666) 100%, transparent 25%); color: var(--text-color-high, #111); border: 1px solid var(--border-color-medium, #666); box-shadow: 0 2px 8px rgba(0,0,0,.25); min-width: 200px;'
	});
	svgContainer.appendChild(tooltip);

	var startAngle = -Math.PI / 2;

	data.forEach(function(item, index) {
		var percentage = (item.value / total) * 100;
		var angle = (item.value / total) * 2 * Math.PI;
		var endAngle = startAngle + angle;

		var x1 = centerX + radius * Math.cos(startAngle);
		var y1 = centerY + radius * Math.sin(startAngle);
		var x2 = centerX + radius * Math.cos(endAngle);
		var y2 = centerY + radius * Math.sin(endAngle);

		var largeArc = angle > Math.PI ? 1 : 0;

		var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		var d = [
			'M', centerX, centerY,
			'L', x1, y1,
			'A', radius, radius, 0, largeArc, 1, x2, y2,
			'Z'
		].join(' ');

		path.setAttribute('d', d);
		path.setAttribute('fill', fillColors[index % fillColors.length]);
		path.setAttribute('stroke', solidColors[index % solidColors.length]);
		path.setAttribute('stroke-width', '2');
		path.style.cursor = 'pointer';
		path.style.transition = 'all 0.2s';

		path.addEventListener('mouseenter', function(e) {
	this.setAttribute('stroke-width', '3');
	this.style.filter = 'brightness(1.1)';
	
	var downloadedBytes = item.uploaded || 0;
	var uploadedBytes = item.downloaded || 0;
	
	tooltip.innerHTML = 
		'<div style="font-weight: bold; margin-bottom: 8px; padding-bottom: 5px; border-bottom: 1px solid var(--border-color-low, rgba(0,0,0,0.2));">' + 
		item.label + 
		'</div>' +
		'<div style="margin: 4px 0; display: flex; justify-content: space-between; gap: 15px;">' +
		'<span>▼ ' + _('Downloaded') + ':</span>' +
		'<strong>' + bytesToSize(downloadedBytes) + '</strong>' +
		'</div>' +
		'<div style="margin: 4px 0; display: flex; justify-content: space-between; gap: 15px;">' +
		'<span>▲ ' + _('Uploaded') + ':</span>' +
		'<strong>' + bytesToSize(uploadedBytes) + '</strong>' +
		'</div>' +
		'<div style="margin: 4px 0; padding-top: 5px; border-top: 1px solid var(--border-color-low, rgba(0,0,0,0.2)); display: flex; justify-content: space-between; gap: 15px;">' +
		'<span>' + _('Total') + ':</span>' +
		'<strong>' + bytesToSize(item.value) + '</strong>' +
		'</div>' +
		'<div style="margin: 4px 0; display: flex; justify-content: space-between; gap: 15px;">' +
		'<span>' + _('Percentage') + ':</span>' +
		'<strong>' + percentage.toFixed(2) + '%</strong>' +
		'</div>';
	
	tooltip.style.display = 'block';
	
	var midAngle = startAngle + angle / 2;
	
	var distanceFromCenter;
	if (percentage > 25) {
		distanceFromCenter = radius * 0.4;
	} else if (percentage > 15) {
		distanceFromCenter = radius * 0.55;
	} else {
		distanceFromCenter = radius * 0.7;
	}
	
	var midX = centerX + distanceFromCenter * Math.cos(midAngle);
	var midY = centerY + distanceFromCenter * Math.sin(midAngle);
	
	var normalizedAngle = ((midAngle * 180 / Math.PI) + 90 + 360) % 360;
	var tooltipRect = tooltip.getBoundingClientRect();

	var left, top;
	
	        if (normalizedAngle >= 330 || normalizedAngle < 30) {
		        if (percentage > 25) {
			        left = midX - tooltipRect.width / 2;
			        top = midY - tooltipRect.height - 15;
		        } else {
			        left = midX - tooltipRect.width / 2;
			        top = midY - tooltipRect.height - 10;
		        }
	        }
	        else if (normalizedAngle >= 30 && normalizedAngle < 120) {
		        if (percentage > 25) {
			        left = midX + 10;
			        top = midY - tooltipRect.height / 2;
		        } else {
			        left = midX + 15;
			        top = midY - tooltipRect.height + 20;
		        }
	        }
	        else if (normalizedAngle >= 120 && normalizedAngle < 150) {
		        if (percentage > 25) {
			        left = midX + 10;
			        top = midY - tooltipRect.height / 2;
		        } else {
			        left = midX + 15;
			        top = midY - tooltipRect.height / 2;
		        }
	        }
	        else if (normalizedAngle >= 150 && normalizedAngle < 240) {
		        if (percentage > 25) {
			        left = midX + 10;
			        top = midY - tooltipRect.height / 2;
		        } else {
			        left = midX + 15;
			        top = midY - 20;
		        }
	        }
	        else if (normalizedAngle >= 240 && normalizedAngle < 300) {
		        if (percentage > 25) {
			        left = midX - tooltipRect.width - 10;
			        top = midY - tooltipRect.height / 2;
		        } else {
			        left = midX - tooltipRect.width - 15;
			        top = midY - 20;
		        }
	        }
	        else {
		        if (percentage > 25) {
			        left = midX - tooltipRect.width - 10;
			        top = midY - tooltipRect.height / 2;
		        } else {
			        left = midX - tooltipRect.width - 15;
			        top = midY - tooltipRect.height + 20;
		        }
	        }
	        
	        if (left < 0) left = 10;
	        if (left + tooltipRect.width > size) left = size - tooltipRect.width - 10;
	        if (top < 0) top = 10;
	        if (top + tooltipRect.height > size) top = size - tooltipRect.height - 10;
	        
	        tooltip.style.left = left + 'px';
	        tooltip.style.top = top + 'px';
	        tooltip.style.right = 'auto';
        });

		svg.appendChild(path);
		startAngle = endAngle;
	});

	svgContainer.appendChild(svg);
	wrapper.appendChild(svgContainer);

	var legend = E('div', {
		'class': 'pie-chart-legend',
		'style': 'flex: 1; min-width: 250px; max-width: 400px; max-height: 300px; overflow-y: auto; padding: 10px; border: 1px solid var(--border-color-medium, #666); border-radius: 0; background: var(--background-color-high, #fff);'
	});

	var legendTitle = E('div', {
		'style': 'font-weight: bold; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 2px solid var(--border-color-medium, #666); color: var(--text-color-high, #111);'
	}, _('Legend'));
	legend.appendChild(legendTitle);

	data.forEach(function(item, index) {
		var percentage = (item.value / total) * 100;
		var legendItem = E('div', {
			'style': 'display: flex; align-items: center; font-size: 12px; padding: 6px 4px; border-bottom: 1px solid var(--border-color-low, rgba(0,0,0,0.1)); cursor: pointer; transition: background 0.2s; color: var(--text-color-high, #111);',
			'class': 'legend-item'
		}, [
			E('div', {
				'style': 'width: 20px; height: 20px; background: ' + fillColors[index % fillColors.length] + '; margin-right: 10px; border-radius: 3px; flex-shrink: 0; border: 2px solid ' + solidColors[index % solidColors.length] + ';'
			}),
			E('div', {
				'style': 'flex: 1; overflow: hidden;'
			}, [
				E('div', {
					'style': 'font-weight: 500; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-color-high, #111);',
					'title': item.label
				}, item.label),
				E('div', {
					'style': 'font-size: 11px; color: var(--text-color-medium, #666);'
				}, bytesToSize(item.value) + ' (' + percentage.toFixed(1) + '%)')
			])
		]);

		legendItem.addEventListener('mouseenter', function() {
			this.style.background = 'var(--background-color-low, rgba(0,0,0,0.05))';
		});

		legendItem.addEventListener('mouseleave', function() {
			this.style.background = 'transparent';
		});

		legend.appendChild(legendItem);
	});

	wrapper.appendChild(legend);
	container.appendChild(wrapper);

	var observer = new MutationObserver(function(mutations) {
		mutations.forEach(function(mutation) {
			mutation.removedNodes.forEach(function(node) {
				if (node === wrapper || (node.contains && node.contains(wrapper))) {
					if (tooltip && tooltip.parentNode) {
						tooltip.parentNode.removeChild(tooltip);
					}
					observer.disconnect();
				}
			});
		});
	});

	if (container.parentNode) {
		observer.observe(container.parentNode, { childList: true, subtree: true });
	}
}

function setSortedColumnTH(table, th, tableKey) {
	var cur = table.querySelector('th.sorted');
	if (cur && cur === th) {
		th.classList.toggle('ascent');
	} else {
		if (cur) cur.classList.remove('sorted', 'ascent');
		th.classList.add('sorted');
	}
	var idx = Array.prototype.indexOf.call(th.parentNode.children, th);
	clientTableSortStates[tableKey].col = idx;
	clientTableSortStates[tableKey].asc = th.classList.contains('ascent');
}

function attachClientTableSortHandlers(table, tableKey) {
	var ths = table.querySelectorAll('tr.table-titles > th');
	ths.forEach(function(th, index){
		th.style.cursor = 'pointer';
		var newTh = th.cloneNode(true);
		th.parentNode.replaceChild(newTh, th);
		newTh.addEventListener('click', function(){
			setSortedColumnTH(table, newTh, tableKey);
			renderClientTableManual(table, tableKey);
		});
	});
}

function sortClientObjectsByHeader(tableKey) {
	var objs = clientTableData[tableKey] || [];
	var sortState = clientTableSortStates[tableKey];
	var col = sortState.col;
	var asc = sortState.asc;
	var out = objs.slice();

	if (tableKey === 'client-usage-history') {
		if (col === 1) {
			out.sort(function(a,b) { 
				return asc ? (a.dBytes - b.dBytes) : (b.dBytes - a.dBytes);
			});
		} else if (col === 2) {
			out.sort(function(a,b) { 
				return asc ? (a.uBytes - b.uBytes) : (b.uBytes - a.uBytes);
			});
		} else if (col === 3) {
			out.sort(function(a,b) { 
				return asc ? (a.total - b.total) : (b.total - a.total);
			});
		} else {
			var getter = (col === 0) ? (o => o.dateLabel) : (() => '');
			out.sort(function(a,b){
				var av = String(getter(a)||'').toLowerCase();
				var bv = String(getter(b)||'').toLowerCase();
				if (av === bv) return 0;
				return asc ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
			});
		}
	} else {
		if (col === 4) {
			out.sort(function(a,b) { 
				return asc ? (a.dBytes - b.dBytes) : (b.dBytes - a.dBytes);
			});
		} else if (col === 5) {
			out.sort(function(a,b) { 
				return asc ? (a.uBytes - b.uBytes) : (b.uBytes - a.uBytes);
			});
		} else {
			var getter =
				(col===0) ? (o=>o.macOut) :
				(col===1) ? (o=>o.nameOut) :
				(col===2) ? (o=>o.first) :
				(col===3) ? (o=>o.last) : (()=> '');
			out.sort(function(a,b){
				var av = String(getter(a)||'').toLowerCase();
				var bv = String(getter(b)||'').toLowerCase();
				if (av === bv) return 0;
				return asc ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
			});
		}
	}
	return out;
}

function renderClientTableManual(table, tableKey) {
	while (table.childElementCount > 1) {
		table.removeChild(table.lastElementChild);
	}

	var rows = sortClientObjectsByHeader(tableKey);
	if (!rows.length) {
		var colspan = (tableKey === 'client-usage-history') ? 4 : 6;
		table.appendChild(E('tr', { 'class': 'tr placeholder' },
			E('td', { 'class': 'td', 'colspan': colspan }, E('em', {}, _('There are currently no data to show...')))
		));
		return;
	}

	if (tableKey === 'client-usage-history') {
		rows.forEach(function(o, i){
			var tr = E('tr', { 'class': 'tr cbi-rowstyle-%d'.format(i % 2 ? 2 : 1) }, [
				E('td', { 'class': 'td', 'data-title': _('Date') }, o.dateLabel),
				(function(){ 
					var td = E('td', { 'class': 'td', 'data-title': _('Downloaded') }, bytesToSize(o.dBytes)); 
					td.dataset.bytes = String(o.dBytes||0); 
					return td; 
				})(),
				(function(){ 
					var td = E('td', { 'class': 'td', 'data-title': _('Uploaded') }, bytesToSize(o.uBytes)); 
					td.dataset.bytes = String(o.uBytes||0); 
					return td; 
				})(),
				(function(){ 
					var td = E('td', { 'class': 'td', 'data-title': _('Total') }, bytesToSize(o.total)); 
					td.dataset.bytes = String(o.total||0); 
					return td; 
				})()
			]);
			table.appendChild(tr);
		});
	} else {
		rows.forEach(function(o, i){
			var tr = E('tr', { 'class': 'tr cbi-rowstyle-%d'.format(i % 2 ? 2 : 1) }, [
				E('td', { 'class': 'td', 'data-title': _('MAC Address') }, o.macOut),
				E('td', { 'class': 'td', 'data-title': _('Hostname')   }, o.nameOut && o.nameOut.length>1 ? o.nameOut : '-'),
				E('td', { 'class': 'td', 'data-title': _('First Seen')  }, o.first),
				E('td', { 'class': 'td', 'data-title': _('Last Seen')   }, o.last),
				(function(){ 
					var td = E('td', { 'class': 'td', 'data-title': _('Uploaded')   }, bytesToSize(o.dBytes)); 
					td.dataset.bytes = String(o.dBytes||0); 
					return td; 
				})(),
				(function(){ 
					var td = E('td', { 'class': 'td', 'data-title': _('Downloaded') }, bytesToSize(o.uBytes)); 
					td.dataset.bytes = String(o.uBytes||0); 
					return td; 
				})()
			]);
			table.appendChild(tr);
		});
	}
}

/* Data Progress bars */
function tdata_bar(value, max, byte) {
	var pg = document.querySelector('#idtraffic_today_progress1'),
		vn = parseInt(value) || 0,
		mn = parseInt(max) || 100,
		fv = byte ? String.format('%1024.2mB', value) : value,
		fm = byte ? String.format('%1024.2mB', max) : max,
		pc = Math.floor((100 / mn) * vn);
	if (pc >= 85 && pc <= 95 ) 
		{ pg.firstElementChild.style.background = 'darkorange'; }
	if (pc >= 96 && pc <= 100) 
		{ pg.firstElementChild.style.background = 'red'; }
	pg.firstElementChild.style.width = pc + '%';
	pg.setAttribute('title', '%s / %s (%d%%)'.format(fv, fm, pc));
	pg.firstElementChild.style.animationDirection = "reverse";
}

function pdata_bar(value, max, byte) {
	var pg = document.querySelector('#idtraffic_currentperiod_progress1'),
		vn = parseInt(value) || 0,
		mn = parseInt(max) || 100,
		fv = byte ? String.format('%1024.2mB', value) : value,
		fm = byte ? String.format('%1024.2mB', max) : max,
		pc = Math.floor((100 / mn) * vn);
	if (pc >= 85 && pc <= 95 ) 
		{ pg.firstElementChild.style.background = 'darkorange'; }
	if (pc >= 96 && pc <= 100) 
		{ pg.firstElementChild.style.background = 'red'; }
	pg.firstElementChild.style.width = pc + '%';
	pg.setAttribute('title', '%s / %s (%d%%)'.format(fv, fm, pc));
	pg.firstElementChild.style.animationDirection = "reverse";
}

function formatDate(d) {
	function z(n){return (n<10?'0':'')+ +n;}
	return d.getFullYear() + '' + z(d.getMonth() + 1) + '' + z(d.getDate());
}

function formatDateWithoutDay(d) {
	function z(n){return (n<10?'0':'')+ +n;}
	return d.getFullYear() + '' + z(d.getMonth() + 1);
}

function formatDateTime(s) {
	if (s.length == 14) {
		return s.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1-$2-$3 $4:$5:$6");
	} else if (s.length == 12) {
		return s.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1-$2-$3 $4:$5");
	} else if (s.length == 8) {
		return s.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
	} else if (s.length == 6) {
		return s.replace(/(\d{4})(\d{2})/, "$1-$2");
	}
	return s;
}

function lastDays(cnt,d) {
	d = +(d || new Date());
	var days = [];
	var i=cnt;
	while (i--) {
		days.push(formatDate(new Date(d-=8.64e7)));
	}
	return days;
}

function currentPeriod(start) {
	var d = new Date();
	var days = [];
	var i=31;
	d.setDate(d.getDate() + 1);
	while (i--) {
		var nd = new Date(d-=8.64e7);
		days.push(formatDate(nd));
		if (nd.getDate() == start) {
			return days;
		}
	}
	return days;
}

function formatDatelP(d) {
	var year = d.getFullYear().toString();
	var month = (d.getMonth() + 1 < 10 ? '0' : '') + (d.getMonth() + 1).toString();
	var day = (d.getDate() < 10 ? '0' : '') + d.getDate().toString();
	return year + month + day;
}

function lastPeriod(d) {
	const todayDate = new Date();
	const year = todayDate.getFullYear();
	const month = todayDate.getMonth() + 1;
	const daysInMonth = new Date(year, month, 0).getDate();
	const daysInPreviousMonth = new Date(year, month - 1, 0).getDate();

	var startDay = Math.min(d, daysInMonth);
	startDay = Math.max(1, startDay);

	const dates = [];

	for (var i = startDay; i >= 1; i--) {
		const currentDay = i < 10 ? '0' + i : '' + i;
		const date = `${year}${month < 10 ? '0' + month : month}${currentDay}`;
		dates.push(date);
	}

	if (dates.length < daysInMonth && month > 1) {
		for (var i = daysInPreviousMonth; dates.length < daysInMonth; i--) {
			const currentDay = i < 10 ? '0' + i : '' + i;
			const date = `${year}${month - 1 < 10 ? '0' + (month - 1) : month - 1}${currentDay}`;
			dates.push(date);
		}
	}
	dates.pop();
	dates.shift();
	return dates;
}

function bytesToSize(bytes) {
	var sizes = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
	if (bytes == 0) return '0';
	var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
var dm = 0;
	if (i == 2) {dm = 1;}
	if (i > 2) {dm = 3;}
	return parseFloat((bytes / Math.pow(1024, i)).toFixed(dm)) + ' ' + sizes[i];
}

function json2ubuscall(input) {
	const output = [];
	const owan = input["wan"];
	if (owan) {
		for (const key in owan) {
			if (key !== "first_seen" && key !== "type" && key !== "last_seen") {
				const ifname = key;
				const ostats = owan[ifname];
				for (const date in ostats) {
					if (date.match(/^\d{8}$/)) {
						const stats = ostats[date];
						output.push({
							ifname,
							date,
							tx: stats.total_tx,
							rx: stats.total_rx
						});
					}
				}
			}
		}
	}
	return { statistics: output };
}

function loadSVG(src) {
	return request.get(src).then(function(response) {
		if (!response.ok) throw new Error(response.statusText);
		return E('div', {
			'style': 'width:100%;height:300px;border:1px solid #000;background:#fff'
		}, E(response.text()));
	});
}

function labelBytes(n) {
	n = (n || 0).toFixed(2);
	return [ '%1024.2mB'.format(n) ];
}

function clearNode(node) {
	while (node && node.firstChild)
		node.removeChild(node.firstChild);
}

function getWanTotalsForDate(jsonData, ymd) {
  var wan = jsonData.wan || {};
  var rxTotal = 0, txTotal = 0;

  for (var ifname in wan) {
    if (ifname ==='first_seen' || ifname === 'last_seen' || ifname === 'type') continue;
    var byDate = wan[ifname] || {};
    var st = byDate[ymd];
    if (st) {
      var r = (st.rx != null) ? st.rx : (st.total_rx != null ? st.total_rx : 0);
      var t = (st.tx != null) ? st.tx : (st.total_tx != null ? st.total_tx : 0);
      rxTotal += r || 0;
      txTotal += t || 0;
    }
  }
  return { rx: rxTotal, tx: txTotal };
}

function sumWanTotalsForDates(jsonData, dates) {
	var rx = 0, tx = 0;
	(dates || []).forEach(function(d) {
		var t = getWanTotalsForDate(jsonData, d);
		rx += t.rx || 0;
		tx += t.tx || 0;
	});
	return { rx: rx, tx: tx };
}

function aggregateWanByDates(jsonData, dates) {
	var wan = jsonData.wan || {};
	var rx = new Array(dates.length).fill(0);
	var tx = new Array(dates.length).fill(0);

	for (var ifname in wan) {
		if (ifname === 'first_seen' || ifname === 'last_seen' || ifname === 'type') continue;
		var byDate = wan[ifname] || {};
		for (var di=0; di<dates.length; di++) {
			var d = dates[di];
			var st = byDate[d];
			if (st) {
				var r = (st.rx != null) ? st.rx : (st.total_rx != null ? st.total_rx : 0);
				var t = (st.tx != null) ? st.tx : (st.total_tx != null ? st.total_tx : 0);
				rx[di] += r || 0;
				tx[di] += t || 0;
			}
		}
	}
	return { rx: rx, tx: tx };
}

function showEstimateDialog(callback) {
	var overlay = E('div', {
		'style': 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;'
	});
	
	var modal = E('div', {
		'style': 'background: var(--background-color-high, #fff); border-radius: 8px; padding: 25px; max-width: 500px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); border: 1px solid var(--border-color-medium, #ccc);'
	}, [
		E('h3', {
			'style': 'margin: 0 0 15px 0; color: var(--text-color-high, #111); font-size: 18px;'
		}, _('No hourly data available for this day')),
		
		E('p', {
			'style': 'margin: 0 0 20px 0; color: var(--text-color-medium, #666); line-height: 1.5;'
		}, _('Would you like to show an estimated hourly distribution based on daily totals? (This is only an approximation)')),
		
		E('div', {
			'style': 'display: flex; gap: 10px; justify-content: flex-end;'
		}, [
			E('button', {
				'class': 'cbi-button cbi-button-neutral',
				'click': function() {
					document.body.removeChild(overlay);
					callback(false);
				}
			}, _('No')),
			
			E('button', {
				'class': 'cbi-button cbi-button-action',
				'click': function() {
					document.body.removeChild(overlay);
					callback(true);
				}
			}, _('Yes, show estimate'))
		])
	]);
	
	overlay.appendChild(modal);
	document.body.appendChild(overlay);
	
	overlay.addEventListener('click', function(e) {
		if (e.target === overlay) {
			document.body.removeChild(overlay);
			callback(false);
		}
	});
	
	var escHandler = function(e) {
		if (e.key === 'Escape') {
			if (document.body.contains(overlay)) {
				document.body.removeChild(overlay);
				callback(false);
			}
			document.removeEventListener('keydown', escHandler);
		}
	};
	document.addEventListener('keydown', escHandler);
}

function aggregateWanHoursForDate(jsonData, ymd, askForEstimate, onComplete) {
  var wan = jsonData.wan || {};
  var rx = new Array(24).fill(0);
  var tx = new Array(24).fill(0);
  var hasHourlyData = false;

  function addHour(h, obj) {
    var r = (obj.rx != null) ? obj.rx : (obj.total_rx != null ? obj.total_rx : 0);
    var t = (obj.tx != null) ? obj.tx : (obj.total_tx != null ? obj.total_tx : 0);
    h = parseInt(h, 10);
    if (!isNaN(h) && h >= 0 && h < 24) {
      rx[h] += r || 0;
      tx[h] += t || 0;
      hasHourlyData = true;
    }
  }

  for (var ifname in wan) {
    if (ifname === 'first_seen' || ifname === 'last_seen' || ifname === 'type') continue;

    var byKey = wan[ifname] || {};
    for (var key in byKey) {
      if (!byKey.hasOwnProperty(key)) continue;
      var val = byKey[key];

      if (key === ymd && val && typeof val === 'object') {
        var hours = val.hours || val.h || val.by_hour || null;
        if (hours && typeof hours === 'object') {
          for (var h in hours) if (hours.hasOwnProperty(h)) addHour(h, hours[h] || {});
        } else {
          for (var k2 in val) {
            if (val.hasOwnProperty(k2) && /^\d{2}$/.test(k2)) addHour(k2, val[k2] || {});
          }
        }
      }

      if (key.startsWith(ymd) && key.length >= 10) {
        var m = key.match(new RegExp('^' + ymd + '(\\d{2})(\\d{2})?(\\d{2})?$'));
        if (m) addHour(m[1], val || {});
      }
    }
  }

  var isToday = (ymd === formatDate(new Date()));
  var curHour = (new Date()).getHours();

  if (!hasHourlyData) {
    var dayTotals = getWanTotalsForDate(jsonData, ymd);

    if ((dayTotals.rx > 0 || dayTotals.tx > 0) && askForEstimate === true && !isToday) {
      var currentRx = rx.slice();
      var currentTx = tx.slice();
      
      showEstimateDialog(function(shouldEstimate) {
        if (shouldEstimate) {
          for (var h = 0; h < 24; h++) {
            currentRx[h] = dayTotals.rx * hourlyDistribution[h];
            currentTx[h] = dayTotals.tx * hourlyDistribution[h];
          }
          if (onComplete) onComplete({ rx: currentRx, tx: currentTx });
        } else {
          // None
        }
      });
      return { rx: rx, tx: tx };
    }
  } else {
    if (isToday) {
      for (var h = curHour + 1; h < 24; h++) {
        rx[h] = 0;
        tx[h] = 0;
      }
    }
  }

  if (onComplete) {
    setTimeout(function() { onComplete({ rx: rx, tx: tx }); }, 0);
  }

  return { rx: rx, tx: tx };
}

function getTop3ClientsForDates(jsonData, dates) {
	var sections = uci.sections('easyconfig_transfer');
	var includeWan = sections[1].wan_view;
	
	var clientStats = [];
	
	for (var mac in jsonData) {
		if (jsonData.hasOwnProperty(mac) && (includeWan == "1" || !mac.includes("wan"))) {
			var deviceData = jsonData[mac];
			var totalTX = 0;
			var totalRX = 0;

			for (var key in deviceData) {
				if (key.startsWith("phy") && key.includes("ap")) {
					var phyData = deviceData[key];
					for (var date in phyData) {
						if (dates.includes(date)) {
							var datai = phyData[date];
							totalTX += (datai.total_tx || 0);
							totalRX += (datai.total_rx || 0);
						}
					}
				}
				if (!key.startsWith("phy") && key !== 'dhcpname' && key !== 'first_seen' && key !== 'last_seen') {
					var phyData2 = deviceData[key];
					for (var date2 in phyData2) {
						if (dates.includes(date2)) {
							var dataj = phyData2[date2];
							totalTX += (dataj.total_tx || 0);
							totalRX += (dataj.total_rx || 0);
						}
					}
				}
			}

			if (totalTX > 0 || totalRX > 0) {
				var modifiedMac = mac.replaceAll("_", ":").toUpperCase();
				var dhcpname = deviceData.dhcpname || modifiedMac;
				
				clientStats.push({
					name: dhcpname,
					downloaded: totalRX,
					uploaded: totalTX
				});
			}
		}
	}
	
	var topDownloaded = clientStats.slice().sort(function(a, b) {
		return b.downloaded - a.downloaded;
	}).slice(0, 3);
	
	var topUploaded = clientStats.slice().sort(function(a, b) {
		return b.uploaded - a.uploaded;
	}).slice(0, 3);
	
	return {
		downloaded: topDownloaded,
		uploaded: topUploaded
	};
}

function getTop3ClientsForMonth(jsonData, yearMonth) {
	var sections = uci.sections('easyconfig_transfer');
	var includeWan = sections[1].wan_view;
	
	var clientStats = [];
	
	for (var mac in jsonData) {
		if (jsonData.hasOwnProperty(mac) && (includeWan == "1" || !mac.includes("wan"))) {
			var deviceData = jsonData[mac];
			var totalTX = 0;
			var totalRX = 0;

			for (var key in deviceData) {
				if (key.startsWith("phy") && key.includes("ap")) {
					var phyData = deviceData[key];
					for (var date in phyData) {
						if (date.startsWith(yearMonth)) {
							var datai = phyData[date];
							totalTX += (datai.total_tx || 0);
							totalRX += (datai.total_rx || 0);
						}
					}
				}
				if (!key.startsWith("phy") && key !== 'dhcpname' && key !== 'first_seen' && key !== 'last_seen') {
					var phyData2 = deviceData[key];
					for (var date2 in phyData2) {
						if (date2.startsWith(yearMonth)) {
							var dataj = phyData2[date2];
							totalTX += (dataj.total_tx || 0);
							totalRX += (dataj.total_rx || 0);
						}
					}
				}
			}

			if (totalTX > 0 || totalRX > 0) {
				var modifiedMac = mac.replaceAll("_", ":").toUpperCase();
				var dhcpname = deviceData.dhcpname || modifiedMac;
				
				clientStats.push({
					name: dhcpname,
					downloaded: totalRX,
					uploaded: totalTX
				});
			}
		}
	}
	
	var topDownloaded = clientStats.slice().sort(function(a, b) {
		return b.downloaded - a.downloaded;
	}).slice(0, 3);
	
	var topUploaded = clientStats.slice().sort(function(a, b) {
		return b.uploaded - a.uploaded;
	}).slice(0, 3);
	
	return {
		downloaded: topDownloaded,
		uploaded: topUploaded
	};
}

function positionTooltip(tooltip, point, svg, idx, totalPoints, chartType) {
	var tooltipRect = tooltip.getBoundingClientRect();
	var svgRect = svg.getBoundingClientRect();
	var pointRect = point.getBoundingClientRect();
	
	var tooltipWidth = tooltipRect.width;
	var tooltipHeight = tooltipRect.height;
	var svgWidth = svgRect.width;
	var svgHeight = svgRect.height;
	
	var pointX = pointRect.left - svgRect.left + pointRect.width / 2;
	var pointY = pointRect.top - svgRect.top + pointRect.height / 2;
	
	var left, top;
	var margin = 10; 
	
	var leftEdge = (chartType === 'yearly') ? 2 : 5;
	var rightEdge = totalPoints - leftEdge;
	
	if (idx < leftEdge) {
		left = pointX + margin;
	} else if (idx >= rightEdge) {
		left = pointX - tooltipWidth - margin;
	} else {
		left = pointX - tooltipWidth / 2;
	}
	
	if (left < 0) {
		left = margin;
	}
	
	if (left + tooltipWidth > svgWidth) {
		left = svgWidth - tooltipWidth - margin;
	}
	
	top = pointY - tooltipHeight - margin;
	
	if (top < 0) {
		top = pointY + margin;
	}
	
	if (top + tooltipHeight > svgHeight) {
		top = pointY - tooltipHeight / 2;
		if (top < 0) top = margin;
		if (top + tooltipHeight > svgHeight) top = svgHeight - tooltipHeight - margin;
	}
	
	return {
		left: left + 'px',
		top: top + 'px'
	};
}

function drawStaticGraph(svg, rxSeries, txSeries, scaleText, labelsX, jsonData, dates, chartType) {
	var G = svg.firstElementChild;
	var tab = svg.parentNode;

	var width  = (svg.offsetWidth ? svg.offsetWidth : 800) - 2;
	var height = 300 - 2;

	var oldTooltip = tab.querySelector('.graph-tooltip');
	if (oldTooltip) oldTooltip.remove();
	var oldOverlay = tab.querySelector('.graph-overlay');
	if (oldOverlay) oldOverlay.remove();
	var oldPoints = tab.querySelectorAll('.data-point');
	oldPoints.forEach(function(p) { p.remove(); });
	var oldPointsContainer = tab.querySelector('.data-points-container');
	if (oldPointsContainer) oldPointsContainer.remove();
	var oldLabelsX = tab.querySelector('.x-axis-labels');
	if (oldLabelsX) oldLabelsX.remove();

	var rx = (rxSeries || []).slice();
	var tx = (txSeries || []).slice();

	var hasAnyData = false;
	for (var i = 0; i < rx.length; i++) {
		if ((rx[i] != null && rx[i] > 0) || (tx[i] != null && tx[i] > 0)) { 
			hasAnyData = true; 
			break; 
		}
	}

	if (!hasAnyData) {
		var elRx0 = G.getElementById('rx');
		var elTx0 = G.getElementById('tx');
		if (elRx0) elRx0.setAttribute('points', '0,' + height);
		if (elTx0) elTx0.setAttribute('points', '0,' + height);

		if (G.getElementById('label_25')?.firstChild) G.getElementById('label_25').firstChild.data = '0';
		if (G.getElementById('label_50')?.firstChild) G.getElementById('label_50').firstChild.data = '0';
		if (G.getElementById('label_75')?.firstChild) G.getElementById('label_75').firstChild.data = '0';

		var scaleEl0 = tab.querySelector('#scale');
		if (!scaleEl0) {
			tab.appendChild(E('div', { 'class': 'right' }, E('small', { 'id': 'scale' }, scaleText || '-')));
		} else {
			dom.content(scaleEl0, scaleText || '-');
		}
		return;
	}

	var firstNonZero = -1, lastNonZero = -1;

	for (var j = 0; j < rx.length; j++) {
		var r = rx[j], t = tx[j];
		var hasData = (r != null && r > 0) || (t != null && t > 0);
		if (hasData) {
			if (firstNonZero === -1) firstNonZero = j;
			lastNonZero = j;
		}
	}

	if (firstNonZero !== -1 && lastNonZero !== -1) {
		for (var a = 0; a < firstNonZero; a++) {
			rx[a] = null;
			tx[a] = null;
		}
		for (var b = lastNonZero + 1; b < rx.length; b++) {
			rx[b] = null;
			tx[b] = null;
		}
	}

	var points = Math.max(rx.length, 2);
	var step = width / (points - 1);

	var peak = 0;
	for (var m = 0; m < points; m++) {
		var rv = rx[m], tv = tx[m];
		if (rv != null) peak = Math.max(peak, rv);
		if (tv != null) peak = Math.max(peak, tv);
	}
	if (peak <= 0) peak = 1;

	var size = Math.floor(Math.log(peak) * Math.LOG2E);
	var div  = Math.pow(2, size - (size % 10));
	var mult = peak / div;
	mult = (mult < 5) ? 2 : ((mult < 50) ? 10 : ((mult < 500) ? 100 : 1000));
	peak = peak + (mult * div) - (peak % (mult * div));
	var data_scale = height / peak;

	function seriesToSegments(series) {
		var segments = [];
		var current = null;
		for (var j2 = 0; j2 < points; j2++) {
			var x = Math.round(j2 * step);
			var val = series[j2];
			var isValid = (val != null);
			if (isValid) {
				var y = height - Math.floor(val * data_scale);
				if (current === null) {
					current = [];
					current.push(x + ',' + height);
				}
				current.push(x + ',' + y);
			} else if (current && current.length > 1) {
				var lastPoint = current[current.length - 1];
				var lastX = lastPoint.split(',')[0];
				current.push(lastX + ',' + height);
				segments.push(current.join(' '));
				current = null;
			}
		}
		if (current && current.length > 1) {
			var lastPoint2 = current[current.length - 1];
			var lastX2 = lastPoint2.split(',')[0];
			current.push(lastX2 + ',' + height);
			segments.push(current.join(' '));
		}
		return (segments.length ? segments : ('0,' + height));
	}

	var oldRxPolygons = G.querySelectorAll('polygon[id^="rx-segment-"]'); 
	oldRxPolygons.forEach(function(p){ p.remove(); });
	var oldTxPolygons = G.querySelectorAll('polygon[id^="tx-segment-"]'); 
	oldTxPolygons.forEach(function(p){ p.remove(); });

	var elRx = G.getElementById('rx');
	var elTx = G.getElementById('tx');

	function createSegmentPolygons(segments, baseElement, idPrefix) {
		if (typeof segments === 'string') {
			baseElement.setAttribute('points', segments);
			baseElement.style.display = '';
			return;
		}
		var cs = window.getComputedStyle(baseElement);
		var baseClass = baseElement.getAttribute('class') || '';
		baseElement.setAttribute('points', '0,' + height);
		baseElement.style.display = 'none';

		function copyAttr(el, attr, prop) {
			var v = baseElement.getAttribute(attr);
			if (v == null || v === '') v = cs.getPropertyValue(prop || attr);
			if (v != null && v !== '' && v !== 'initial' && v !== 'auto') el.setAttribute(attr, v);
		}

		segments.forEach(function(seg, idx){
			var polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
			polygon.setAttribute('id', idPrefix + idx);
			if (baseClass) polygon.setAttribute('class', baseClass);
			polygon.setAttribute('points', seg);
			copyAttr(polygon, 'fill');
			copyAttr(polygon, 'stroke');
			copyAttr(polygon, 'stroke-width', 'stroke-width');
			copyAttr(polygon, 'stroke-linejoin', 'stroke-linejoin');
			copyAttr(polygon, 'stroke-linecap', 'stroke-linecap');
			copyAttr(polygon, 'stroke-dasharray', 'stroke-dasharray');
			copyAttr(polygon, 'stroke-dashoffset', 'stroke-dashoffset');
			copyAttr(polygon, 'fill-opacity', 'fill-opacity');
			copyAttr(polygon, 'stroke-opacity', 'stroke-opacity');
			copyAttr(polygon, 'opacity', 'opacity');
			var pe = cs.getPropertyValue('pointer-events');
			if (pe) polygon.style.pointerEvents = pe;
			baseElement.parentNode.insertBefore(polygon, baseElement.nextSibling);
		});
	}

	var rxSegments = seriesToSegments(rx);
	var txSegments = seriesToSegments(tx);
	if (elRx) createSegmentPolygons(rxSegments, elRx, 'rx-segment-');
	if (elTx) createSegmentPolygons(txSegments, elTx, 'tx-segment-');

	// Desc Y
	var l25 = 0.25 * peak, l50 = 0.5 * peak, l75 = 0.75 * peak;
	if (G.getElementById('label_25')?.firstChild) G.getElementById('label_25').firstChild.data = labelBytes(l25).join('');
	if (G.getElementById('label_50')?.firstChild) G.getElementById('label_50').firstChild.data = labelBytes(l50).join('');
	if (G.getElementById('label_75')?.firstChild) G.getElementById('label_75').firstChild.data = labelBytes(l75).join('');

	// Scale
	var scaleEl = tab.querySelector('#scale');
	if (!scaleEl) tab.appendChild(E('div', { 'class':'right' }, E('small', { 'id':'scale' }, scaleText || '-')));
	else dom.content(scaleEl, scaleText || '-');

	// Desc X
	if (labelsX && labelsX.length > 0) {
		var labelsContainer = E('div', { 'class': 'x-axis-labels', 'style': 'position: relative; height: 20px; margin-top: 5px; font-size: 10px; color: #666;' });
		var labelStep = (labelsX.length === 24) ? 3 : (labelsX.length <= 7 ? 1 : Math.max(1, Math.floor(labelsX.length / 10)));
		for (var i3 = 0; i3 < labelsX.length; i3 += labelStep) {
			var lx = Math.round(i3 * step);
			labelsContainer.appendChild(E('span', { 'style': 'position:absolute; left:' + lx + 'px; transform:translateX(-50%);' }, labelsX[i3]));
		}
		if ((labelsX.length - 1) % labelStep !== 0) {
			var lxLast = Math.round((labelsX.length - 1) * step);
			labelsContainer.appendChild(E('span', { 'style': 'position:absolute; left:' + lxLast + 'px; transform:translateX(-50%);' }, labelsX[labelsX.length - 1]));
		}
		svg.parentNode.insertBefore(labelsContainer, svg.nextSibling);
	}

	// Tooltip
	var tooltip = E('div', {
		'class': 'graph-tooltip',
		'style': 'position:absolute; display:none; padding:12px 15px; border-radius:6px; font-size:12px; pointer-events:none; z-index:1000; width:280px; box-sizing:border-box;'
	});
	tooltip.style.background = 'color-mix(in srgb, var(--border-color-medium, #666) 100%, transparent 25%)';
	tooltip.style.color = 'var(--text-color-high, #111)';
	tooltip.style.border = '1px solid var(--border-color-medium, #666)';
	tooltip.style.boxShadow = '0 2px 8px rgba(0,0,0,.25)';
	svg.parentNode.style.position = 'relative';
	svg.parentNode.appendChild(tooltip);

	var pointsContainer = E('div', { 
		'class': 'data-points-container', 
		'style': 'position:absolute; top:0; left:0; width:100%; height:' + height + 'px; pointer-events:none;' 
	});
	svg.parentNode.insertBefore(pointsContainer, svg.nextSibling);

for (var p = 0; p < points; p++) {
	var rv2 = rx[p], tv2 = tx[p];

	if (rv2 == null && tv2 == null) continue;
	if ((rv2 || 0) === 0 && (tv2 || 0) === 0) continue;

	var x = p * step;
	var yRx = height - Math.floor((rv2 || 0) * data_scale);
	var yTx = height - Math.floor((tv2 || 0) * data_scale);

var pointRx = E('div', {
	'class': 'data-point data-point-rx',
	'style': 'position:absolute; width:8px; height:8px; background:#4169E1; border:2px solid white; border-radius:50%; left:' + (x - 3) + 'px; top:' + (yRx - 4) + 'px; pointer-events:auto; cursor:pointer; transition:all 0.2s;',
	'data-index': p, 
	'data-type': 'rx',
	'data-x': x
});
var pointTx = E('div', {
	'class': 'data-point data-point-tx',
	'style': 'position:absolute; width:8px; height:8px; background:#32CD32; border:2px solid white; border-radius:50%; left:' + (x - 3) + 'px; top:' + (yTx - 4) + 'px; pointer-events:auto; cursor:pointer; transition:all 0.2s;',
	'data-index': p, 
	'data-type': 'tx',
	'data-x': x
});

		[pointRx, pointTx].forEach(function(point){
			point.addEventListener('mouseenter', function(){
				var idx = parseInt(this.dataset.index);
				this.style.width = '12px'; 
				this.style.height = '12px';
				this.style.marginLeft = '-2px'; 
				this.style.marginTop = '-2px';
				this.style.boxShadow = '0 0 8px rgba(0,0,0,0.5)';

				var rxVal = rx[idx] || 0;
				var txVal = tx[idx] || 0;
				var label = labelsX && labelsX[idx] ? labelsX[idx] : String(idx);

				var top3 = null;
				if (chartType === 'yearly' && dates && dates[idx]) {
					var yearMonth = dates[idx].substring(0, 6);
					top3 = getTop3ClientsForMonth(jsonData, yearMonth);
				} else if ((chartType === 'monthly' || chartType === 'today') && dates && dates[idx]) {
					top3 = getTop3ClientsForDates(jsonData, [dates[idx]]);
				}

				var tooltipContent =
					'<div style="font-weight:bold; margin-bottom:8px; border-bottom:1px solid var(--border-color-low, rgba(0,0,0,0.2)); padding-bottom:5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + label + '</div>';

				if (top3) {
					if (top3.uploaded && top3.uploaded.length > 0) {
						tooltipContent += '<div style="margin-bottom:6px; margin-top:4px;"><strong style="font-size:11px;">▼ Top 3</strong></div>';
						top3.uploaded.forEach(function(client, iTop){
							if (client.uploaded > 0) {
								tooltipContent += '<div style="font-size:10px; margin:2px 0; padding-left:8px; display:flex; justify-content:space-between; gap:8px;">' +
									'<span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="' + client.name + '">' + (iTop+1) + '. ' + client.name + '</span>' +
									'<span style="white-space:nowrap;">' + bytesToSize(client.uploaded) + '</span>' +
								'</div>';
							}
						});
					}
					if (top3.downloaded && top3.downloaded.length > 0) {
						tooltipContent += '<div style="margin-top:6px; margin-bottom:4px;"><strong style="font-size:11px;">▲ Top 3</strong></div>';
						top3.downloaded.forEach(function(client, iTop){
							if (client.downloaded > 0) {
								tooltipContent += '<div style="font-size:10px; margin:2px 0; padding-left:8px; display:flex; justify-content:space-between; gap:8px;">' +
									'<span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="' + client.name + '">' + (iTop+1) + '. ' + client.name + '</span>' +
									'<span style="white-space:nowrap;">' + bytesToSize(client.downloaded) + '</span>' +
								'</div>';
							}
						});
					}
					tooltipContent += '<div style="margin-top:8px; margin-bottom:8px; border-top:2px solid var(--border-color-low, rgba(0,0,0,0.2));"></div>';
				}

				tooltipContent +=
					'<div style="margin:4px 0; display:flex; justify-content:space-between; gap:10px;"><span>▼ ' + _('Downloaded') + ':</span><strong>' + bytesToSize(rxVal) + '</strong></div>' +
					'<div style="margin:4px 0; display:flex; justify-content:space-between; gap:10px;"><span>▲ ' + _('Uploaded') + ':</span><strong>' + bytesToSize(txVal) + '</strong></div>' +
					'<div style="margin:4px 0; padding-top:5px; border-top:1px solid var(--border-color-low, rgba(0,0,0,0.2)); display:flex; justify-content:space-between; gap:10px;"><span>' + _('Total') + ':</span><strong>' + bytesToSize(rxVal + txVal) + '</strong></div>';

				tooltip.innerHTML = tooltipContent;
				tooltip.style.display = 'block';

				var pos = positionTooltip(tooltip, point, svg, idx, points, chartType);
				tooltip.style.left = pos.left;
				tooltip.style.top = pos.top;
				tooltip.style.right = 'auto';
			});
			point.addEventListener('mouseleave', function(){
				this.style.width = '8px'; 
				this.style.height = '8px';
				this.style.marginLeft = '0'; 
				this.style.marginTop = '0';
				this.style.boxShadow = 'none';
				tooltip.style.display = 'none';
			});
		});

		pointsContainer.appendChild(pointRx);
		pointsContainer.appendChild(pointTx);
	}
}

function daysOfCurrentMonthToYesterday() {
  var now = new Date();
  var y = now.getFullYear();
  var m = now.getMonth() + 1;
  var today = now.getDate();
  var dates = [];
  for (var d = 1; d < today; d++) {
    var mm = String(m).padStart(2, '0');
    var dd = String(d).padStart(2, '0');
    dates.push(String(y) + mm + dd);
  }
  return dates;
}

function buildGraphsOnce() {
	if (!graphsRoot || !graphSVGTemplate) return;

	var tabHolder = graphsRoot.firstElementChild;
	while (tabHolder.firstChild) tabHolder.removeChild(tabHolder.firstChild);

	function makeSummaryTable() {
		var tdRx = E('td', { 'class': 'td' }, [ '-' ]);
		var tdTx = E('td', { 'class': 'td' }, [ '-' ]);
		var tdTotal = E('td', { 'class': 'td' }, [ '-' ]);
		var tbl = E('table', { 
			'class': 'table', 
			'style': 'width:100%;table-layout:fixed;' 
		}, [
			E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td right top' }, E('strong', { 'style': 'border-bottom:2px solid #4169E1' }, [ _('Downloaded') + ':' ])),
				tdRx,
				E('td', { 'class': 'td right top' }, E('strong', { 'style': 'border-bottom:2px solid #32CD32' }, [ _('Uploaded') + ':' ])),
				tdTx,
				E('td', { 'class': 'td right top' }, E('strong', { 'style': 'border-bottom:2px solid #FFA500' }, [ _('Total') + ':' ])),
				tdTotal
			])
		]);
		return { tbl: tbl, tdRx: tdRx, tdTx: tdTx, tdTotal: tdTotal };
	}

	function makeTab(key, title, hasDropdown) {
		var csvg = graphSVGTemplate.cloneNode(true);
		var summary = makeSummaryTable();
		var scaleEl = E('small', { 'id': 'scale' }, '-');
		
		var dropdown = null;
		var dropdownContainer = null;
		if (hasDropdown) {
			var labelText = (key === 'today') ? _('Select day') + ':' : 
							(key === 'monthly') ? _('Select month') + ':' : 
							_('Select year') + ':';
			
			dropdown = E('select', {
				'class': 'cbi-input-select',
				'style': 'padding: 5px; width: 200px;',
				'id': 'dropdown-' + key
			});
			dropdownContainer = E('div', { 
				'style': 'margin-top: 15px; margin-bottom: 10px;' 
			}, [
				E('label', { 'style': 'margin-right: 10px; font-weight: bold;' }, labelText),
				dropdown
			]);
		}

		var tabDiv = E('div', { 'class': 'cbi-section', 'data-tab': key, 'data-tab-title': title }, [
			csvg,
			E('div', { 'class': 'right' }, scaleEl),
			dropdownContainer,
			summary.tbl,
			E('div', { 'class': 'cbi-section-create' })
		].filter(function(x) { return x !== null; }));

		tabHolder.appendChild(tabDiv);

		graphsByKey[key] = {
			svg: csvg,
			rxCell: summary.tdRx,
			txCell: summary.tdTx,
			totalCell: summary.tdTotal,
			scaleEl: scaleEl,
			title: title,
			dropdown: dropdown
		};
	}

	function makePieTab(key, title, hasDropdown) {
		var dropdown = null;
		var dropdownContainer = null;
		if (hasDropdown) {
			var labelText = _('Select period') + ':';
			
			dropdown = E('select', {
				'class': 'cbi-input-select',
				'style': 'padding: 5px; width: 200px;',
				'id': 'dropdown-' + key
			});
			dropdownContainer = E('div', { 
				'style': 'margin-top: 15px; margin-bottom: 10px;' 
			}, [
				E('label', { 'style': 'margin-right: 10px; font-weight: bold;' }, labelText),
				dropdown
			]);
		}

		var pieContainer = E('div', { 
			'class': 'pie-chart-container',
			'style': 'position: relative; min-height: 300px;'
		});

		var summary = (function() {
			var tdRx = E('td', { 'class': 'td' }, [ '-' ]);
			var tdTx = E('td', { 'class': 'td' }, [ '-' ]);
			var tdTotal = E('td', { 'class': 'td' }, [ '-' ]);
			var tbl = E('table', { 
				'class': 'table', 
				'style': 'width:100%;table-layout:fixed;margin-top:10px;' 
			}, [
				E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td right top' }, E('strong', { 'style': 'border-bottom:2px solid #4169E1' }, [ _('Downloaded') + ':' ])),
					tdRx,
					E('td', { 'class': 'td right top' }, E('strong', { 'style': 'border-bottom:2px solid #32CD32' }, [ _('Uploaded') + ':' ])),
					tdTx,
					E('td', { 'class': 'td right top' }, E('strong', { 'style': 'border-bottom:2px solid #FFA500' }, [ _('Total') + ':' ])),
					tdTotal
				])
			]);
			return { tbl: tbl, tdRx: tdRx, tdTx: tdTx, tdTotal: tdTotal };
		})();

		var tabDiv = E('div', { 'class': 'cbi-section', 'data-tab': key, 'data-tab-title': title }, [
			dropdownContainer,
			pieContainer,
			summary.tbl,
			E('div', { 'class': 'cbi-section-create' })
		].filter(function(x) { return x !== null; }));

		tabHolder.appendChild(tabDiv);

		graphsByKey[key] = {
			container: pieContainer,
			dropdown: dropdown,
			title: title,
			rxCell: summary.tdRx,
			txCell: summary.tdTx,
			totalCell: summary.tdTotal
		};
	}

	makeTab('today',    _('Today'), true);
	makeTab('monthly',  _('Monthly'), true);
	makeTab('yearly',   _('Yearly'), true);
	makePieTab('clients', _('Clients data usage'), true);

	if (!tabsInitialized) {
		ui.tabs.initTabGroup(tabHolder.childNodes);
		tabsInitialized = true;
	}
}

function isClientMacKey(k) {
	return /^[0-9a-f]{2}(?:_[0-9a-f]{2}){5}$/i.test(k);
}

function getClientsList(jsonData) {
	var clients = [];
	
	for (var mac in jsonData) {
		if (!jsonData.hasOwnProperty(mac)) continue;
		if (!isClientMacKey(mac)) continue;
		
		var deviceData = jsonData[mac];
		var modifiedMac = mac.replaceAll("_", ":").toUpperCase();
		var dhcpname = deviceData.dhcpname || modifiedMac;
		
		clients.push({
			mac: mac,
			displayMac: modifiedMac,
			name: dhcpname,
			displayName: dhcpname || modifiedMac
		});
	}
	
	clients.sort(function(a, b) {
		return a.displayName.localeCompare(b.displayName);
	});
	
	return clients;
}

function getClientDataForDateRange(jsonData, clientMac, dates, timeRange) {
	var deviceData = jsonData[clientMac];
	if (!deviceData) return [];
	
	var dataByDate = {};
	
	for (var key in deviceData) {
		if (!deviceData.hasOwnProperty(key)) continue;
		if (key === 'dhcpname' || key === 'first_seen' || key === 'last_seen') continue;
		
		var phyData = deviceData[key];
		for (var date in phyData) {
			if (!phyData.hasOwnProperty(date)) continue;
			if (!dates || dates.indexOf(date) === -1) continue;
			
			if (!dataByDate[date]) {
				dataByDate[date] = { rx: 0, tx: 0 };
			}
			
			var entry = phyData[date] || {};
			dataByDate[date].rx += (entry.total_rx || entry.rx || 0);
			dataByDate[date].tx += (entry.total_tx || entry.tx || 0);
		}
	}
	
	var result = [];
	
	if (timeRange === 'last7days') {
		dates.forEach(function(date) {
			var data = dataByDate[date] || { rx: 0, tx: 0 };
			result.push({
				date: date,
				dateLabel: formatDateTime(date),
				dBytes: data.rx,
				uBytes: data.tx,
				total: data.rx + data.tx
			});
		});
	} else if (timeRange === 'monthly') {
		dates.forEach(function(date) {
			var data = dataByDate[date] || { rx: 0, tx: 0 };
			result.push({
				date: date,
				dateLabel: formatDateTime(date),
				dBytes: data.rx,
				uBytes: data.tx,
				total: data.rx + data.tx
			});
		});
	} else if (timeRange === 'yearly') {
		var monthlyData = {};
		
		dates.forEach(function(date) {
			var yearMonth = date.substring(0, 6);
			if (!monthlyData[yearMonth]) {
				monthlyData[yearMonth] = { rx: 0, tx: 0 };
			}
			var data = dataByDate[date] || { rx: 0, tx: 0 };
			monthlyData[yearMonth].rx += data.rx;
			monthlyData[yearMonth].tx += data.tx;
		});
		
		var sortedMonths = Object.keys(monthlyData).sort();
		sortedMonths.forEach(function(yearMonth) {
			var data = monthlyData[yearMonth];
			result.push({
				date: yearMonth,
				dateLabel: formatDateTime(yearMonth),
				dBytes: data.rx,
				uBytes: data.tx,
				total: data.rx + data.tx
			});
		});
	}
	
	return result;
}

function updatePieChart(key, jsonData, dates) {
	var pieObj = graphsByKey[key];
	if (!pieObj || !pieObj.container) return;

	var sections = uci.sections('easyconfig_transfer');
	var hideZeros = sections[1].zero_view;
	var hidden_data_value = sections[1].hidden_data;
	var mac_list = Array.isArray(sections[1].host_names) ? sections[1].host_names : [];
	var macs_list = [];
	for (var i = 0; i < mac_list.length; i++) macs_list.push(mac_list[i]);

	var wanTotals = sumWanTotalsForDates(jsonData, dates || []);
	dom.content(pieObj.rxCell, String.format('%1024.2mB', wanTotals.rx || 0));
	dom.content(pieObj.txCell, String.format('%1024.2mB', wanTotals.tx || 0));
	dom.content(pieObj.totalCell, String.format('%1024.2mB', (wanTotals.rx||0) + (wanTotals.tx||0)));

	callLuciDHCPLeases().then(function(leaseData) {
		var leases = Array.isArray(leaseData.dhcp_leases) ? leaseData.dhcp_leases : [];
		var clientData = [];

		for (var mac in jsonData) {
			if (!jsonData.hasOwnProperty(mac)) continue;
			if (!isClientMacKey(mac)) continue;

			var deviceData = jsonData[mac];
			var totalTX = 0, totalRX = 0;

			for (var key in deviceData) {
				if (!deviceData.hasOwnProperty(key)) continue;
				if (key === 'dhcpname' || key === 'first_seen' || key === 'last_seen') continue;

				var byDate = deviceData[key];
				if (!byDate || typeof byDate !== 'object') continue;

				for (var d in byDate) {
					if (!byDate.hasOwnProperty(d)) continue;
					if (!dates || dates.indexOf(d) === -1) continue;

					var e = byDate[d] || {};
					totalTX += (e.total_tx || e.tx || 0);
					totalRX += (e.total_rx || e.rx || 0);
				}
			}

			if ((hideZeros == "1" && (totalTX > 0 || totalRX > 0)) || (hideZeros == "0")) {
				var modifiedMac = mac.replaceAll("_", ":").toUpperCase();

				var dhcpname = deviceData.dhcpname || '';
				if (leases.length > 0 || macs_list.length > 0) {
					for (var i2 = 0; i2 < Math.max(leases.length, macs_list.length); i2++) {
						if (i2 < leases.length && leases[i2].macaddr === modifiedMac) {
							dhcpname += " (" + leases[i2].ipaddr + ')';
						}
						if (i2 < macs_list.length && macs_list[i2].split(';')[0] === modifiedMac) {
							var custom = macs_list[i2].split(';')[1] || '';
							var ipForCustom = (i2 < leases.length && leases[i2].macaddr === modifiedMac) ? leases[i2].ipaddr : '';
							dhcpname = custom + (ipForCustom ? " (" + ipForCustom + ")" : "");
						}
					}
				}

				var label = dhcpname || modifiedMac;
				if (hidden_data_value === 'mh') { 
					label = (dhcpname ? dhcpname : modifiedMac).replace(/[A-Za-z0-9]/g, '#');
				} else if (hidden_data_value === 'm') { 
					label = modifiedMac.replace(/[^:]/g, '#');
				} else if (hidden_data_value === 'h' && dhcpname) { 
					label = dhcpname.replace(/[A-Za-z0-9]/g, '#');
				}

				clientData.push({
					label: label,
					value: totalTX + totalRX,
					downloaded: totalRX,
					uploaded: totalTX
				});
			}
		}

		clientData.sort(function(a, b) { return b.value - a.value; });
		if (clientData.length > 50) {
			var others = clientData.slice(50);
			var othersTotal = others.reduce(function(sum, item) { return sum + item.value; }, 0);
			var othersDownloaded = others.reduce(function(sum, item) { return sum + item.downloaded; }, 0);
			var othersUploaded = others.reduce(function(sum, item) { return sum + item.uploaded; }, 0);
			clientData = clientData.slice(0, 50);
			if (othersTotal > 0) {
				clientData.push({
					label: _('Others') + ' (' + others.length + ')',
					value: othersTotal,
					downloaded: othersDownloaded,
					uploaded: othersUploaded
				});
			}
		}

		drawPieChart(pieObj.container, clientData, pieObj.title);
	});
}

function getAvailableYears(jsonData) {
	var years = new Set();
	var wan = jsonData.wan || {};
	
	for (var ifname in wan) {
		if (ifname === 'first_seen' || ifname === 'last_seen' || ifname === 'type') continue;
		var byDate = wan[ifname] || {};
		for (var dateKey in byDate) {
			if (dateKey.match(/^\d{8}$/)) {
				var year = parseInt(dateKey.substring(0, 4), 10);
				years.add(year);
			}
		}
	}
	
	return Array.from(years).sort();
}

function getAvailableMonths(jsonData) {
	var months = new Set();
	var wan = jsonData.wan || {};
	
	for (var ifname in wan) {
		if (ifname === 'first_seen' || ifname === 'last_seen' || ifname === 'type') continue;
		var byDate = wan[ifname] || {};
		for (var dateKey in byDate) {
			if (dateKey.match(/^\d{8}$/)) {
				var yearMonth = dateKey.substring(0, 6);
				months.add(yearMonth);
			}
		}
	}
	
	return Array.from(months).sort();
}

function populateDropdowns(jsonData) {
	var todayDropdown = graphsByKey.today.dropdown;
	if (todayDropdown) {
		todayDropdown.innerHTML = '';
		
		var todayDate = formatDate(new Date());
		var todayOption = E('option', { 'value': todayDate, 'selected': 'selected' }, formatDateTime(todayDate) + ' (' + _('Today') + ')');
		todayDropdown.appendChild(todayOption);
		
		var dates = lastDays(30);
		dates.forEach(function(dateStr) {
			if (dateStr !== todayDate) {
				var option = E('option', { 'value': dateStr }, formatDateTime(dateStr));
				todayDropdown.appendChild(option);
			}
		});
		
		todayDropdown.addEventListener('change', function() {
			var selectedDate = this.value;
			
			aggregateWanHoursForDate(jsonData, selectedDate, true, function(todayH) {
				var hoursLabels = [];
				for (var h = 0; h < 24; h++) {
					var h1 = String(h).padStart(2,'0');
					var h2 = String((h + 1) % 24).padStart(2,'0');
					hoursLabels.push(h1 + '-' + h2);
				}
				
				var hourDates = [];
				for (var h = 0; h < 24; h++) {
					hourDates.push(selectedDate);
				}
				
				drawStaticGraph(
					graphsByKey.today.svg,
					todayH.rx,
					todayH.tx,
					_('(Hour-by-hour data usage chart for selected day)'),
					hoursLabels,
					jsonData,
					hourDates,
					'today'
				);
				
				var totals = getWanTotalsForDate(jsonData, selectedDate);
				dom.content(graphsByKey.today.rxCell, String.format('%1024.2mB', totals.rx));
				dom.content(graphsByKey.today.txCell, String.format('%1024.2mB', totals.tx));
				dom.content(graphsByKey.today.totalCell, String.format('%1024.2mB', totals.rx + totals.tx));
			});
		});
	}
	
	var monthlyDropdown = graphsByKey.monthly.dropdown;
	if (monthlyDropdown) {
		monthlyDropdown.innerHTML = '';
		var now = new Date();
		var currentYear = now.getFullYear();
		var currentMonth = now.getMonth() + 1;
		
		for (var m = 1; m <= currentMonth; m++) {
			var monthStr = currentYear + String(m).padStart(2, '0');
			var monthName = formatDateWithoutDay(new Date(currentYear, m - 1, 1));
			var option = E('option', { 'value': monthStr }, formatDateTime(monthName));
			monthlyDropdown.appendChild(option);
		}
		
		monthlyDropdown.value = currentYear + String(currentMonth).padStart(2, '0');
		
		monthlyDropdown.addEventListener('change', function() {
			var selectedMonth = this.value;
			drawMonthlyChart(jsonData, selectedMonth);
		});
	}
	
	var yearlyDropdown = graphsByKey.yearly.dropdown;
	if (yearlyDropdown) {
		yearlyDropdown.innerHTML = '';
		var availableYears = getAvailableYears(jsonData);
		var currentYear = new Date().getFullYear();
		
		if (availableYears.length === 0) {
			availableYears = [currentYear];
		}
		
		availableYears.forEach(function(year) {
			var option = E('option', { 'value': year }, year.toString());
			yearlyDropdown.appendChild(option);
		});
		
		yearlyDropdown.value = currentYear;
		
		yearlyDropdown.addEventListener('change', function() {
			var selectedYear = parseInt(this.value, 10);
			drawYearlyChart(jsonData, selectedYear);
		});
	}

	var clientsDropdown = graphsByKey.clients.dropdown;
	if (clientsDropdown) {
		clientsDropdown.innerHTML = '';
		
		var sections = uci.sections('easyconfig_transfer');
		var data_traffic_cycle = sections[1].cycle;
		
		var currentPeriodOption = E('option', { 'value': 'current_period', 'selected': 'selected' }, _('Current billing period'));
		clientsDropdown.appendChild(currentPeriodOption);
		
		var todayOption = E('option', { 'value': 'today' }, _('Today'));
		clientsDropdown.appendChild(todayOption);
		
		var separatorDay = E('option', { 'disabled': 'disabled', 'value': '' }, '─────────────');
		clientsDropdown.appendChild(separatorDay);

		var daysThisMonth = daysOfCurrentMonthToYesterday().reverse();
		daysThisMonth.forEach(function(day) {
			var dayOption = E('option', { 'value': 'day_' + day }, formatDateTime(day));
			clientsDropdown.appendChild(dayOption);
		});
		
		var separatorMonth = E('option', { 'disabled': 'disabled', 'value': '' }, '─────────────');
		clientsDropdown.appendChild(separatorMonth);
		
		var availableMonths = getAvailableMonths(jsonData);
		availableMonths.reverse();
		availableMonths.forEach(function(monthStr) {
			var monthOption = E('option', { 'value': 'month_' + monthStr }, formatDateTime(monthStr));
			clientsDropdown.appendChild(monthOption);
		});
		
		var separatorYear = E('option', { 'disabled': 'disabled', 'value': '' }, '─────────────');
		clientsDropdown.appendChild(separatorYear);
		
		var availableYears = getAvailableYears(jsonData);
		availableYears.reverse();
		availableYears.forEach(function(year) {
			var yearOption = E('option', { 'value': 'year_' + year }, year.toString());
			clientsDropdown.appendChild(yearOption);
		});
		
		clientsDropdown.addEventListener('change', function() {
			var selectedValue = this.value;
			var dates = [];
			
			if (selectedValue === 'current_period') {
				dates = currentPeriod(data_traffic_cycle);
			} else if (selectedValue === 'today') {
				dates = [formatDate(new Date())];
			} else if (selectedValue.startsWith('day_')) {
				var day = selectedValue.replace('day_', '');
				dates = [day];
			} else if (selectedValue.startsWith('month_')) {
				var monthStr = selectedValue.replace('month_', '');
				var year = parseInt(monthStr.substring(0, 4), 10);
				var month = parseInt(monthStr.substring(4, 6), 10);
				var daysInMonth = new Date(year, month, 0).getDate();
				for (var d = 1; d <= daysInMonth; d++) {
					dates.push(monthStr + String(d).padStart(2, '0'));
				}
			} else if (selectedValue.startsWith('year_')) {
				var year = parseInt(selectedValue.replace('year_', ''), 10);
				var now = new Date();
				var currentYear = now.getFullYear();
				var maxMonth = (year === currentYear) ? (now.getMonth() + 1) : 12;
				
				for (var m = 1; m <= maxMonth; m++) {
					var monthStr = year + String(m).padStart(2, '0');
					var daysInMonth = new Date(year, m, 0).getDate();
					for (var d = 1; d <= daysInMonth; d++) {
						dates.push(monthStr + String(d).padStart(2, '0'));
					}
				}
			}
			
			updatePieChart('clients', jsonData, dates);
		});
	}
}

function drawMonthlyChart(jsonData, yearMonth) {
	var year  = parseInt(yearMonth.substring(0, 4), 10);
	var month = parseInt(yearMonth.substring(4, 6), 10);

	var now = new Date();
	var currentYear  = now.getFullYear();
	var currentMonth = now.getMonth() + 1;
	var currentDay   = now.getDate();

	var isCurrentMonth = (year === currentYear && month === currentMonth);
	var daysInMonth = new Date(year, month, 0).getDate();
	var maxDay = isCurrentMonth ? currentDay : daysInMonth;

	var allDates = [];
	for (var d = 1; d <= maxDay; d++) {
		allDates.push(yearMonth + String(d).padStart(2, '0'));
	}

	var data = aggregateWanByDates(jsonData, allDates);

	var firstValidIndex = -1;
	var lastValidIndex = -1;
	
	for (var i = 0; i < data.rx.length; i++) {
		if ((data.rx[i] !== null && data.rx[i] > 0) || 
		    (data.tx[i] !== null && data.tx[i] > 0)) {
			if (firstValidIndex === -1) {
				firstValidIndex = i;
			}
			lastValidIndex = i;
		}
	}

	var dates, labels;
	if (firstValidIndex === -1) {
		dates = [];
		labels = [];
		data.rx = [];
		data.tx = [];
	} else {
		dates = allDates.slice(firstValidIndex, lastValidIndex + 1);
		labels = dates.map(function(d) {
			return d.substring(6, 8) + '.' + d.substring(4, 6);
		});
		data.rx = data.rx.slice(firstValidIndex, lastValidIndex + 1);
		data.tx = data.tx.slice(firstValidIndex, lastValidIndex + 1);
	}

	var scaleText = _('(Daily usage chart for a selected month)');

	drawStaticGraph(
		graphsByKey.monthly.svg,
		data.rx,
		data.tx,
		scaleText,
		labels,
		jsonData,
		dates,
		'monthly'
	);

	function sum(a){ return (a||[]).reduce((s,v)=> s + (v != null ? v : 0), 0); }
	var rxSum = sum(data.rx);
	var txSum = sum(data.tx);
	dom.content(graphsByKey.monthly.rxCell, String.format('%1024.2mB', rxSum));
	dom.content(graphsByKey.monthly.txCell, String.format('%1024.2mB', txSum));
	dom.content(graphsByKey.monthly.totalCell, String.format('%1024.2mB', rxSum + txSum));
}

function drawYearlyChart(jsonData, selectedYear) {
	var now = new Date();
	var currentYear = now.getFullYear();
	var currentMonth = now.getMonth() + 1;
	
	var year = selectedYear || currentYear;
	var maxMonth = (year === currentYear) ? currentMonth : 12;
	
	var allMonthsRx = [];
	var allMonthsTx = [];
	var allLabels = [];
	var allFirstDates = [];
	
	var monthNames = [
		_('Jan'), _('Feb'), _('Mar'), _('Apr'), _('May'), _('Jun'),
		_('Jul'), _('Aug'), _('Sep'), _('Oct'), _('Nov'), _('Dec')
	];
	
	for (var m = 1; m <= maxMonth; m++) {
		var monthStr = year + String(m).padStart(2, '0');
		var daysInMonth = new Date(year, m, 0).getDate();
		
		var dates = [];
		for (var d = 1; d <= daysInMonth; d++) {
			dates.push(monthStr + String(d).padStart(2, '0'));
		}
		allFirstDates.push(dates[0]);

		var monthData = aggregateWanByDates(jsonData, dates);
		
		var monthRx = monthData.rx.reduce(function(s, v) { return s + (v || 0); }, 0);
		var monthTx = monthData.tx.reduce(function(s, v) { return s + (v || 0); }, 0);
		
		allMonthsRx.push(monthRx);
		allMonthsTx.push(monthTx);
		allLabels.push(monthNames[m - 1]);
	}
	
	var firstValidIndex = -1;
	var lastValidIndex = -1;
	
	for (var i = 0; i < allMonthsRx.length; i++) {
		if (allMonthsRx[i] > 0 || allMonthsTx[i] > 0) {
			if (firstValidIndex === -1) {
				firstValidIndex = i;
			}
			lastValidIndex = i;
		}
	}
	
	var rx, tx, labels, firstDates;
	if (firstValidIndex === -1) {
		rx = [];
		tx = [];
		labels = [];
		firstDates = [];
	} else {
		rx = allMonthsRx.slice(firstValidIndex, lastValidIndex + 1);
		tx = allMonthsTx.slice(firstValidIndex, lastValidIndex + 1);
		labels = allLabels.slice(firstValidIndex, lastValidIndex + 1);
		firstDates = allFirstDates.slice(firstValidIndex, lastValidIndex + 1);
	}
	
	function sum(a){ 
		return (a||[]).reduce(function(s,v){ 
			return s + (v !== null && v !== undefined ? v : 0); 
		}, 0); 
	}
	
	var scaleText = (year === currentYear) 
		? _('(Data usage chart for individual months)')
		: _('(Data usage chart for each month of the year ') + year + ')';
	
	drawStaticGraph(
		graphsByKey.yearly.svg,
		rx,
		tx,
		scaleText,
		labels,
		jsonData,
		firstDates,
		'yearly'
	);
	
	var rxSum = sum(rx);
	var txSum = sum(tx);
	dom.content(graphsByKey.yearly.rxCell, String.format('%1024.2mB', rxSum));
	dom.content(graphsByKey.yearly.txCell, String.format('%1024.2mB', txSum));
	dom.content(graphsByKey.yearly.totalCell, String.format('%1024.2mB', rxSum + txSum));
}

function refreshGraphsFromFile() {
	if (!graphsByKey.today || !graphsByKey.monthly || !graphsByKey.yearly) return;

	return fs.trimmed('/tmp/easyconfig_statistics.json').then(function(data) {
		if (!data || data.length < 2) {
			console.warn('No data');
			['today','monthly','yearly'].forEach(function(k){
				drawStaticGraph(graphsByKey[k].svg, [], [], '-', [], null, [], k);
				dom.content(graphsByKey[k].rxCell, '-');
				dom.content(graphsByKey[k].txCell, '-');
				dom.content(graphsByKey[k].totalCell, '-');
			});
			return;
		}

		var jsonData = JSON.parse(data);
		populateDropdowns(jsonData);

		var todayYMD = formatDate(new Date());
		
		var todayH = aggregateWanHoursForDate(jsonData, todayYMD, false);

		var hoursLabels = [];
		var hourDates = [];
		for (var h = 0; h < 24; h++) {
			var h1 = String(h).padStart(2,'0');
			var h2 = String((h + 1) % 24).padStart(2,'0');
			hoursLabels.push(h1 + '-' + h2);
			hourDates.push(todayYMD);
		}

		drawStaticGraph(
			graphsByKey.today.svg,
			todayH.rx,
			todayH.tx,
			_('(Hour-by-hour data usage chart for selected day)'),
			hoursLabels,
			jsonData,
			hourDates,
			'today'
		);

		var todayTotals = getWanTotalsForDate(jsonData, todayYMD);
		dom.content(graphsByKey.today.rxCell, String.format('%1024.2mB', todayTotals.rx));
		dom.content(graphsByKey.today.txCell, String.format('%1024.2mB', todayTotals.tx));
		dom.content(graphsByKey.today.totalCell, String.format('%1024.2mB', todayTotals.rx + todayTotals.tx));

		var now = new Date();
		var currentMonth = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0');
		drawMonthlyChart(jsonData, currentMonth);
		drawYearlyChart(jsonData, now.getFullYear());

		var sections = uci.sections('easyconfig_transfer');
		var data_traffic_cycle = sections[1].cycle;
		var current_period = currentPeriod(data_traffic_cycle);
		updatePieChart('clients', jsonData, current_period);

	}).catch(function(e){
		console.error('Error to refresh charts:', e);
	});
}

function buildClientTablesOnce() {
	var clientTablesRoot = document.getElementById('clientTablesRoot');
	if (!clientTablesRoot) return;

	var tabHolder = clientTablesRoot.firstElementChild;
	while (tabHolder.firstChild) tabHolder.removeChild(tabHolder.firstChild);

	function makeClientTable(key) {
		if (key === 'client-usage-history') {
			var table = E('table', { 
				'class': 'table lases', 
				'id': 'trTable-' + key,
				'style': 'border:1px solid var(--border-color-medium)!important;'
			}, [
				E('tr', { 'class': 'tr table-titles' }, [
					E('th', { 'class': 'th sorted' }, _('Date')),
					E('th', { 'class': 'th' }, _('Uploaded')),
					E('th', { 'class': 'th' }, _('Downloaded')),
					E('th', { 'class': 'th' }, _('Total'))
				])
			]);
		} else {
			var table = E('table', { 
				'class': 'table lases', 
				'id': 'trTable-' + key,
				'style': 'border:1px solid var(--border-color-medium)!important;'
			}, [
				E('tr', { 'class': 'tr table-titles' }, [
					E('th', { 'class': 'th' }, _('MAC Address')),
					E('th', { 'class': 'th' }, _('Hostname')),
					E('th', { 'class': 'th' }, _('First Seen')),
					E('th', { 'class': 'th' }, _('Last Seen')),
					E('th', { 'class': 'th sorted' }, _('Uploaded')),
					E('th', { 'class': 'th' }, _('Downloaded'))
				])
			]);
		}
		
		return table;
	}

	function makeClientTab(key, title, hasDropdown) {
		var table = makeClientTable(key);
		
		var dropdown = null;
		var dropdownContainer = null;
		if (hasDropdown) {
			var labelText = (key === 'client-today') ? _('Select day') + ':' : 
							(key === 'client-monthly') ? _('Select month') + ':' : 
							_('Select year') + ':';
			
			dropdown = E('select', {
				'class': 'cbi-input-select',
				'style': 'padding: 5px; width: 200px;',
				'id': 'client-dropdown-' + key
			});
			dropdownContainer = E('div', { 
				'style': 'margin-top: 15px; margin-bottom: 10px;' 
			}, [
				E('label', { 'style': 'margin-right: 10px; font-weight: bold;' }, labelText),
				dropdown
			]);
		}

		var tabDiv = E('div', { 'class': 'cbi-section', 'data-tab': key, 'data-tab-title': title }, [
			dropdownContainer,
			table,
			E('div', { 'class': 'cbi-section-create' })
		].filter(function(x) { return x !== null; }));

		tabHolder.appendChild(tabDiv);

		clientTablesByKey[key] = {
			table: table,
			dropdown: dropdown
		};
	}

	function makeClientUsageHistoryTab() {
		var table = makeClientTable('client-usage-history');
		
		var timeRangeDropdown = E('select', {
			'class': 'cbi-input-select',
			'style': 'padding: 5px; width: 200px; margin-right: 15px;',
			'id': 'client-usage-timerange'
		});
		
		var clientDropdown = E('select', {
			'class': 'cbi-input-select',
			'style': 'padding: 5px; width: 300px;',
			'id': 'client-usage-client'
		});
		
		var dropdownContainer = E('div', { 
			'style': 'margin-top: 15px; margin-bottom: 10px; display: flex; flex-wrap: wrap; gap: 10px; align-items: center;' 
		}, [
			E('label', { 'style': 'font-weight: bold;' }, _('Select period') + ':'),
			timeRangeDropdown,
			E('label', { 'style': 'font-weight: bold; margin-left: 15px;' }, _('Client') + ':'),
			clientDropdown
		]);

		var tabDiv = E('div', { 'class': 'cbi-section', 'data-tab': 'client-usage-history', 'data-tab-title': _('Clients data usage') }, [
			dropdownContainer,
			table,
			E('div', { 'class': 'cbi-section-create' })
		]);

		tabHolder.appendChild(tabDiv);

		clientTablesByKey['client-usage-history'] = {
			table: table,
			timeRangeDropdown: timeRangeDropdown,
			clientDropdown: clientDropdown
		};
	}

	makeClientTab('client-period',  _('Current billing period'), false);
	makeClientTab('client-today',   _('Today'), true);
	makeClientTab('client-monthly', _('Monthly'), true);
	makeClientTab('client-yearly',  _('Yearly'), true);
	makeClientUsageHistoryTab();

	if (!clientTabsInitialized) {
		ui.tabs.initTabGroup(tabHolder.childNodes);
		clientTabsInitialized = true;
		
		setTimeout(function() {
			var tabs = tabHolder.querySelectorAll('[data-tab]');
			tabs.forEach(function(tab) {
				var tabKey = tab.getAttribute('data-tab');
				var tabButton = tabHolder.parentNode.querySelector('[data-tab="' + tabKey + '"]');
				
				var tabButtons = document.querySelectorAll('.cbi-tabmenu .cbi-tab');
				tabButtons.forEach(function(btn) {
					btn.addEventListener('click', function() {
						var clickedTab = this.getAttribute('data-tab');
						if (clickedTab && clientTablesByKey[clickedTab]) {
							setTimeout(function() {
								reloadCurrentClientTab(clickedTab);
							}, 50);
						}
					});
				});
			});
		}, 200);
	}
}

function populateClientDropdowns(jsonData) {
	var todayDropdown = clientTablesByKey['client-today'].dropdown;
	if (todayDropdown) {
		todayDropdown.innerHTML = '';
		
		var todayDate = formatDate(new Date());
		var todayOption = E('option', { 'value': todayDate, 'selected': 'selected' }, formatDateTime(todayDate) + ' (' + _('Today') + ')');
		todayDropdown.appendChild(todayOption);
		
		var dates = lastDays(30);
		dates.forEach(function(dateStr) {
			if (dateStr !== todayDate) {
				var option = E('option', { 'value': dateStr }, formatDateTime(dateStr));
				todayDropdown.appendChild(option);
			}
		});
		
		todayDropdown.addEventListener('change', function() {
			var selectedDate = this.value;
			updateClientTable('client-today', jsonData, [selectedDate]);
		});
	}
	
	var monthlyDropdown = clientTablesByKey['client-monthly'].dropdown;
	if (monthlyDropdown) {
		monthlyDropdown.innerHTML = '';
		var now = new Date();
		var currentYear = now.getFullYear();
		var currentMonth = now.getMonth() + 1;
		
		for (var m = 1; m <= currentMonth; m++) {
			var monthStr = currentYear + String(m).padStart(2, '0');
			var monthName = formatDateWithoutDay(new Date(currentYear, m - 1, 1));
			var option = E('option', { 'value': monthStr }, formatDateTime(monthName));
			monthlyDropdown.appendChild(option);
		}
		
		monthlyDropdown.value = currentYear + String(currentMonth).padStart(2, '0');
		
		monthlyDropdown.addEventListener('change', function() {
			var selectedMonth = this.value;
			var year = parseInt(selectedMonth.substring(0, 4), 10);
			var month = parseInt(selectedMonth.substring(4, 6), 10);
			var daysInMonth = new Date(year, month, 0).getDate();
			
			var dates = [];
			for (var d = 1; d <= daysInMonth; d++) {
				dates.push(selectedMonth + String(d).padStart(2, '0'));
			}
			
			updateClientTable('client-monthly', jsonData, dates);
		});
	}
	
	var yearlyDropdown = clientTablesByKey['client-yearly'].dropdown;
	if (yearlyDropdown) {
		yearlyDropdown.innerHTML = '';
		var availableYears = getAvailableYears(jsonData);
		var currentYear = new Date().getFullYear();
		
		if (availableYears.length === 0) {
			availableYears = [currentYear];
		}
		
		availableYears.forEach(function(year) {
			var option = E('option', { 'value': year }, year.toString());
			yearlyDropdown.appendChild(option);
		});
		
		yearlyDropdown.value = currentYear;
		
		yearlyDropdown.addEventListener('change', function() {
			var selectedYear = parseInt(this.value, 10);
			var maxMonth = (selectedYear === currentYear) ? (new Date().getMonth() + 1) : 12;
			
			var dates = [];
			for (var m = 1; m <= maxMonth; m++) {
				var monthStr = selectedYear + String(m).padStart(2, '0');
				var daysInMonth = new Date(selectedYear, m, 0).getDate();
				for (var d = 1; d <= daysInMonth; d++) {
					dates.push(monthStr + String(d).padStart(2, '0'));
				}
			}
			
			updateClientTable('client-yearly', jsonData, dates);
		});
	}

	var usageHistoryObj = clientTablesByKey['client-usage-history'];
	if (usageHistoryObj) {
		var timeRangeDropdown = usageHistoryObj.timeRangeDropdown;
		var clientDropdown = usageHistoryObj.clientDropdown;
		
		if (timeRangeDropdown) {
			timeRangeDropdown.innerHTML = '';
			
			// Last 7 days
			var option1 = E('option', { 'value': 'last7days', 'selected': 'selected' }, _('Last 7 days'));
			timeRangeDropdown.appendChild(option1);
			
			// Today
			var optionToday = E('option', { 'value': 'today' }, _('Today'));
			timeRangeDropdown.appendChild(optionToday);
			
			var separatorDay = E('option', { 'disabled': 'disabled', 'value': '' }, '─────────────');
			timeRangeDropdown.appendChild(separatorDay);
			
			var daysThisMonth2 = daysOfCurrentMonthToYesterday().reverse();
			daysThisMonth2.forEach(function(day) {
				var dayOption = E('option', { 'value': 'day_' + day }, formatDateTime(day));
				timeRangeDropdown.appendChild(dayOption);
			});
			
			var separatorMonth = E('option', { 'disabled': 'disabled', 'value': '' }, '─────────────');
			timeRangeDropdown.appendChild(separatorMonth);
			
			// Current year months
			var now = new Date();
			var currentYear = now.getFullYear();
			var currentMonth = now.getMonth() + 1;
			
			for (var m = currentMonth; m >= 1; m--) {
				var monthStr = currentYear + String(m).padStart(2, '0');
				var monthOption = E('option', { 'value': 'month_' + monthStr }, formatDateTime(monthStr));
				timeRangeDropdown.appendChild(monthOption);
			}
			
			// Separator - Years
			var separatorYear = E('option', { 'disabled': 'disabled', 'value': '' }, '─────────────');
			timeRangeDropdown.appendChild(separatorYear);
			
			// Available years
			var availableYears = getAvailableYears(jsonData);
			availableYears.reverse();
			availableYears.forEach(function(year) {
				var yearOption = E('option', { 'value': 'year_' + year }, year.toString());
				timeRangeDropdown.appendChild(yearOption);
			});
		}
		
		if (clientDropdown) {
			clientDropdown.innerHTML = '';
			
			var clients = getClientsList(jsonData);
			clients.forEach(function(client) {
				var option = E('option', { 'value': client.mac }, client.displayName);
				clientDropdown.appendChild(option);
			});
		}
		
		var updateUsageHistory = function() {
			var timeRange = timeRangeDropdown.value;
			var clientMac = clientDropdown.value;
			
			if (!clientMac) return;
			
			var dates = [];
			var actualTimeRange = 'last7days';
			
			if (timeRange === 'last7days') {
				dates = lastDays(7);
				actualTimeRange = 'last7days';
			} else if (timeRange === 'today') {
				dates = [formatDate(new Date())];
				actualTimeRange = 'last7days';
			} else if (timeRange.startsWith('day_')) {
				var day = timeRange.replace('day_', '');
				dates = [day];
				actualTimeRange = 'last7days';
			} else if (timeRange.startsWith('month_')) {
				var monthStr = timeRange.replace('month_', '');
				var year = parseInt(monthStr.substring(0, 4), 10);
				var month = parseInt(monthStr.substring(4, 6), 10);
				var daysInMonth = new Date(year, month, 0).getDate();
				for (var d = 1; d <= daysInMonth; d++) {
					dates.push(monthStr + String(d).padStart(2, '0'));
				}
				actualTimeRange = 'monthly';
			} else if (timeRange.startsWith('year_')) {
				var year = parseInt(timeRange.replace('year_', ''), 10);
				var now = new Date();
				var currentYear = now.getFullYear();
				var maxMonth = (year === currentYear) ? (now.getMonth() + 1) : 12;
				
				for (var m = 1; m <= maxMonth; m++) {
					var monthStr = year + String(m).padStart(2, '0');
					var daysInMonth = new Date(year, m, 0).getDate();
					for (var d = 1; d <= daysInMonth; d++) {
						dates.push(monthStr + String(d).padStart(2, '0'));
					}
				}
				actualTimeRange = 'yearly';
			}
			
			updateClientUsageHistoryTable(jsonData, clientMac, dates, actualTimeRange);
		};
		
		timeRangeDropdown.addEventListener('change', updateUsageHistory);
		clientDropdown.addEventListener('change', updateUsageHistory);
		
		if (clientDropdown.options.length > 0) {
			updateUsageHistory();
		}
	}
}

function updateClientTable(tableKey, jsonData, dates) {
	var tableObj = clientTablesByKey[tableKey];
	if (!tableObj) return;
	
	var table = tableObj.table;
	
	var sections = uci.sections('easyconfig_transfer');
	var hideZeros = sections[1].zero_view;
	var hidden_data_value = sections[1].hidden_data;
	var mac_list = Array.isArray(sections[1].host_names) ? sections[1].host_names : [];
	var macs_list = [];
	for (var i = 0; i < mac_list.length; i++) macs_list.push(mac_list[i]);
	
	callLuciDHCPLeases().then(function(leaseData) {
		var leases = Array.isArray(leaseData.dhcp_leases) ? leaseData.dhcp_leases : [];
		
		clientTableData[tableKey] = [];
		
		for (var mac in jsonData) {
			if (!jsonData.hasOwnProperty(mac)) continue;
			if (!isClientMacKey(mac)) continue;

			var deviceData = jsonData[mac];
			var totalTX = 0, totalRX = 0;

			for (var key in deviceData) {
				if (!deviceData.hasOwnProperty(key)) continue;
				if (key === 'dhcpname' || key === 'first_seen' || key === 'last_seen') continue;

				var phyData = deviceData[key];
				for (var date in phyData) {
					if (dates.includes(date)) {
						var datai = phyData[date];
						totalTX += datai.total_tx || datai.tx || 0;
						totalRX += datai.total_rx || datai.rx || 0;
					}
				}
			}

			var modifiedMac = mac.replaceAll("_", ":").toUpperCase();

			var dhcpname = deviceData.dhcpname || '';
			if (leases.length > 0 || macs_list.length > 0) {
				for (var i2 = 0; i2 < Math.max(leases.length, macs_list.length); i2++) {
					if (i2 < leases.length && leases[i2].macaddr === modifiedMac) {
						dhcpname += " (" + leases[i2].ipaddr + ')';
					}
					if (i2 < macs_list.length && macs_list[i2].split(';')[0] === modifiedMac) {
						var custom = macs_list[i2].split(';')[1] || '';
						var ipForCustom = (i2 < leases.length && leases[i2].macaddr === modifiedMac) ? leases[i2].ipaddr : '';
						dhcpname = custom + (ipForCustom ? " (" + ipForCustom + ")" : "");
					}
				}
			}

			if ((hideZeros == "1" && (totalTX > 0 || totalRX > 0)) || (hideZeros == "0")) {
				var macOut = modifiedMac;
				var nameOut = dhcpname || '';

				if (hidden_data_value === 'mh') { 
					macOut = modifiedMac.replace(/[^:]/g, '#'); 
					nameOut = (nameOut||'').replace(/[a-zA-Z0-9]/g, '#'); 
				} else if (hidden_data_value === 'm') { 
					macOut = modifiedMac.replace(/[^:]/g, '#'); 
				} else if (hidden_data_value === 'h') { 
					nameOut = (nameOut||'').replace(/[a-zA-Z0-9]/g, '#'); 
				}

				clientTableData[tableKey].push({
					macOut: macOut,
					nameOut: (nameOut && nameOut.length>1) ? nameOut : '-',
					first: formatDateTime(deviceData.first_seen || '-') || '-',
					last:  formatDateTime(deviceData.last_seen  || '-') || '-',
					dBytes: totalRX,
					uBytes: totalTX
				});
			}
		}
		
		renderClientTableManual(table, tableKey);
		setTimeout(function() {
			attachClientTableSortHandlers(table, tableKey);
		}, 10);
	});
}

function updateClientUsageHistoryTable(jsonData, clientMac, dates, timeRange) {
	var tableObj = clientTablesByKey['client-usage-history'];
	if (!tableObj) return;
	
	var table = tableObj.table;
	
	var data = getClientDataForDateRange(jsonData, clientMac, dates, timeRange);
	
	clientTableData['client-usage-history'] = data;
	
	renderClientTableManual(table, 'client-usage-history');
	setTimeout(function() {
		attachClientTableSortHandlers(table, 'client-usage-history');
	}, 10);
}

function reloadCurrentClientTab(tableKey) {
	return fs.trimmed('/tmp/easyconfig_statistics.json').then(function(data) {
		if (!data || data.length < 2) return;

		var jsonData = JSON.parse(data);
		var sections = uci.sections('easyconfig_transfer');
		var data_traffic_cycle = sections[1].cycle;
		
		if (tableKey === 'client-period') {
			var current_period = currentPeriod(data_traffic_cycle);
			updateClientTable('client-period', jsonData, current_period);
		} else if (tableKey === 'client-today') {
			var todayDate = formatDate(new Date());
			updateClientTable('client-today', jsonData, [todayDate]);
		} else if (tableKey === 'client-monthly') {
			var now = new Date();
			var currentMonthStr = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0');
			var daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
			var monthDates = [];
			for (var d = 1; d <= daysInMonth; d++) {
				monthDates.push(currentMonthStr + String(d).padStart(2, '0'));
			}
			updateClientTable('client-monthly', jsonData, monthDates);
		} else if (tableKey === 'client-yearly') {
			var now = new Date();
			var currentYear = now.getFullYear();
			var currentMonth = now.getMonth() + 1;
			var yearDates = [];
			for (var m = 1; m <= currentMonth; m++) {
				var monthStr = currentYear + String(m).padStart(2, '0');
				var daysInM = new Date(currentYear, m, 0).getDate();
				for (var d = 1; d <= daysInM; d++) {
					yearDates.push(monthStr + String(d).padStart(2, '0'));
				}
			}
			updateClientTable('client-yearly', jsonData, yearDates);
		} else if (tableKey === 'client-usage-history') {
			var usageHistoryObj = clientTablesByKey['client-usage-history'];
			if (usageHistoryObj && usageHistoryObj.clientDropdown && usageHistoryObj.timeRangeDropdown) {
				var clientMac = usageHistoryObj.clientDropdown.value;
				var timeRange = usageHistoryObj.timeRangeDropdown.value;
				
				if (!clientMac) return;
				
				var dates = [];
				var actualTimeRange = 'last7days';
				
				if (timeRange === 'last7days') {
					dates = lastDays(7);
					actualTimeRange = 'last7days';
				} else if (timeRange === 'today') {
					dates = [formatDate(new Date())];
					actualTimeRange = 'last7days';
				} else if (timeRange.startsWith('day_')) {
					var day = timeRange.replace('day_', '');
					dates = [day];
					actualTimeRange = 'last7days';
				} else if (timeRange.startsWith('month_')) {
					var monthStr = timeRange.replace('month_', '');
					var year = parseInt(monthStr.substring(0, 4), 10);
					var month = parseInt(monthStr.substring(4, 6), 10);
					var daysInMonth = new Date(year, month, 0).getDate();
					for (var d = 1; d <= daysInMonth; d++) {
						dates.push(monthStr + String(d).padStart(2, '0'));
					}
					actualTimeRange = 'monthly';
				} else if (timeRange.startsWith('year_')) {
					var year = parseInt(timeRange.replace('year_', ''), 10);
					var now = new Date();
					var currentYear = now.getFullYear();
					var maxMonth = (year === currentYear) ? (now.getMonth() + 1) : 12;
					
					for (var m = 1; m <= maxMonth; m++) {
						var monthStr = year + String(m).padStart(2, '0');
						var daysInM = new Date(year, m, 0).getDate();
						for (var d = 1; d <= daysInM; d++) {
							yearDates.push(monthStr + String(d).padStart(2, '0'));
						}
					}
					actualTimeRange = 'yearly';
				}
				
				updateClientUsageHistoryTable(jsonData, clientMac, dates, actualTimeRange);
			}
		}
	});
}

function refreshClientTables() {
	return fs.trimmed('/tmp/easyconfig_statistics.json').then(function(data) {
		if (!data || data.length < 2) {
			console.warn('No data for clients');
			return;
		}

		var jsonData = JSON.parse(data);
		var sections = uci.sections('easyconfig_transfer');
		var data_traffic_cycle = sections[1].cycle;
		
		populateClientDropdowns(jsonData);
		
		var current_period = currentPeriod(data_traffic_cycle);
		updateClientTable('client-period', jsonData, current_period);
		
		var todayDate = formatDate(new Date());
		updateClientTable('client-today', jsonData, [todayDate]);
		
		var now = new Date();
		var currentYear = now.getFullYear();
		var currentMonth = now.getMonth() + 1;
		var currentMonthStr = currentYear + String(currentMonth).padStart(2, '0');
		var daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
		var monthDates = [];
		for (var d = 1; d <= daysInMonth; d++) {
			monthDates.push(currentMonthStr + String(d).padStart(2, '0'));
		}
		updateClientTable('client-monthly', jsonData, monthDates);
		
		var yearDates = [];
		for (var m = 1; m <= currentMonth; m++) {
			var monthStr = currentYear + String(m).padStart(2, '0');
			var daysInM = new Date(currentYear, m, 0).getDate();
			for (var d = 1; d <= daysInM; d++) {
				yearDates.push(monthStr + String(d).padStart(2, '0'));
			}
		}
		updateClientTable('client-yearly', jsonData, yearDates);

	}).catch(function(e){
		console.error('Error refresh clients table:', e);
	});
}

return view.extend({
	load: function() {
		return Promise.all([
			callLuciDHCPLeases(),
			L.resolveDefault(L.uci.load('easyconfig_transfer'), {}),
			loadSVG(L.resource('svg/bandwidth.svg'))
		]);
	},

	handleRfresh: function(ev) {
		var self = this;

		var loadingMsg = ui.showModal(_('Please wait...'), [
			E('p', { 'class': 'spinning' }, _('Refreshing data...'))
		]);

		fs.exec_direct('/usr/bin/easyconfig_statistics.sh').then(function () {
			return new Promise(function (resolve) { setTimeout(resolve, 800); });
		}).then(function () {
			return Promise.all([refreshGraphsFromFile(), refreshClientTables()]);
		}).then(function () {
			ui.hideModal();
		}).catch(function (e) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error refreshing data: ') + e.message), 'error');
			console.error('Błąd odświeżania:', e);
		});
	},

	handleRT: function(ev) {
		if (confirm(_('Do you want to clear transfer statistics data?')))
		{
			fs.write('/tmp/easyconfig_statistics.json', '{}');
			fs.exec_direct('/bin/lock', [ '-u' , '/var/lock/easyconfig_statistics.lock' ]);
			fs.remove('/etc/modem/easyconfig_statistics.json.gz');
			fs.exec('sleep 2');
			fs.remove('/etc/modem/easyconfig_statistics.json');
			
			ui.addNotification(null, E('p', _('Statistics data cleared')), 'info');
			
			setTimeout(function() {
				window.location.reload();
			}, 2000);
		}
	},

	handleGo: function(ev) {
		var elem = document.getElementById('mr');
		var vN = elem.innerText;

		if (vN.includes(_('Make')) == true)
		{
			fs.exec_direct('/bin/lock', [ '-u' , '/var/lock/easyconfig_statistics.lock' ]);
			fs.exec('sleep 2');
			fs.remove('/etc/modem/easyconfig_statistics.json');
			fs.exec('sleep 2');
			fs.exec_direct('/bin/cp', [ '/tmp/easyconfig_statistics.json' , '/etc/modem' ]);
			ui.addNotification(null, E('p', _('Backup created successfully')), 'info');
		}

		if (vN.includes(_('Restore')) == true)
		{
			fs.exec_direct('/bin/lock', [ '-u' , '/var/lock/easyconfig_statistics.lock' ]);
			fs.exec('sleep 2');
			fs.remove('/tmp/easyconfig_statistics.json');
			fs.exec('sleep 2');
			fs.exec_direct('/bin/cp', [ '/etc/modem/easyconfig_statistics.json' , '/tmp' ]);
			fs.exec('sleep 2');
			fs.remove('/etc/modem/easyconfig_statistics.json');
			ui.addNotification(null, E('p', _('Backup restored successfully')), 'info');
			
			setTimeout(function() {
				Promise.all([refreshGraphsFromFile(), refreshClientTables()]);
			}, 1500);
		}
	},

	render: function(stat) {
		var estatus;

		graphSVGTemplate = stat[2];
		graphsRoot = E('div', { 'class': 'cbi-map', 'id': 'graphsRoot' }, E('div'));

		poll.add(function() {
		    updateStatsFileSize();
			return fs.trimmed('/tmp/easyconfig_statistics.json').then(function(data) {
				if (data.length > 1) {
					var jsonData = JSON.parse(data);
					const output = json2ubuscall(jsonData);
					var json = JSON.parse(JSON.stringify(output, null, 2));

					var sections = uci.sections('easyconfig_transfer');
					var data_traffic_cycle = sections[1].cycle;
					var data_traffic_warning_unit = sections[1].warning_unit;
					var data_traffic_warning_cycle = sections[1].warning_cycle;
					var data_traffic_warning_value = sections[1].warning_value;
					var usage_bar_view = sections[1].warning_enabled;

					var now = new Date();
					var day = now.getDate();
					var month = now.getMonth();
					var year = now.getFullYear();
					now = new Date(year, month, day);
					var newdate = (day <= data_traffic_cycle)
						? new Date(year, month, data_traffic_cycle)
						: (month == 11 ? new Date(year + 1, 0, data_traffic_cycle) : new Date(year, month + 1, data_traffic_cycle));
					var timediff = Math.abs(newdate.getTime() - now.getTime());
					var diffdays = Math.ceil(timediff / (1000 * 3600 * 24));

					var traffic_limit = 0;
					if (data_traffic_warning_unit == "m") traffic_limit = 1024 * 1024 * data_traffic_warning_value;
					if (data_traffic_warning_unit == "g") traffic_limit = 1024 * 1024 * 1024 * data_traffic_warning_value;
					if (data_traffic_warning_unit == "t") traffic_limit = 1024 * 1024 * 1024 * 1024 * data_traffic_warning_value;

					var today = new Array(formatDate(new Date));
					var yesterday = lastDays(1);
					var last7d = lastDays(7);
					var last30d = lastDays(30);

					var current_period = currentPeriod(data_traffic_cycle);
					var last_period = lastPeriod(data_traffic_cycle);

					var traffic_today = 0;
					var traffic_yesterday = 0;
					var traffic_last7d = 0;
					var traffic_last30d = 0;
					var traffic_total = 0;
					var traffic_currentperiod = 0;
					var traffic_lastperiod = 0;
					var total_since = '';
					var traffic = json.statistics.length > 0 ? json.statistics : [];

					for (var idx = 0; idx < traffic.length; idx++) {
						var t_date = traffic[idx].date;
						var t_rx = traffic[idx].rx;
						var t_tx = traffic[idx].tx;
						var t_value = (parseInt(t_rx) || 0) + (parseInt(t_tx) || 0);
						if (total_since == '') { total_since = t_date; }

						if (t_date == today[0]) traffic_today += parseInt(t_value);
						if (t_date == yesterday[0]) traffic_yesterday += parseInt(t_value);

						for (var idx1 = 0; idx1 < 7; idx1++)
							if (t_date == last7d[idx1]) traffic_last7d += parseInt(t_value);

						for (var idx1 = 0; idx1 < 30; idx1++)
							if (t_date == last30d[idx1]) traffic_last30d += parseInt(t_value);

						for (var idx1 = 0; idx1 < current_period.length; idx1++)
							if (t_date == current_period[idx1]) traffic_currentperiod += parseInt(t_value);

						for (var idx1 = 0; idx1 < last_period.length; idx1++)
							if (t_date == last_period[idx1]) traffic_lastperiod += parseInt(t_value);

						traffic_total += parseInt(t_value);
						if (total_since > t_date) { total_since = t_date; }
					}

					var traffic_total_since = total_since ? '(' + _('from') + ' ' + formatDateTime(total_since) + ')' : '';

					var ntraffic_currentperiod = bytesToSize(traffic_currentperiod);
					var ntraffic_currentperiod_projected = bytesToSize((traffic_currentperiod / current_period.length) * (current_period.length + diffdays - 1));
					var ntraffic_lastperiod = bytesToSize(traffic_lastperiod);

					if (usage_bar_view === "1") {
						if (data_traffic_warning_cycle == 'p') {
							var percent = parseInt((traffic_currentperiod * 100) / traffic_limit);
							var traffic_currentperiod_progress = ' (' + percent + '% ' + _('out of') + ' ' + bytesToSize(traffic_limit) + ')';
							if (percent > 100) {
								percent = 100;
								estatus = bytesToSize((traffic_currentperiod - traffic_limit));
								ui.addNotification(null, E('p', _('You have exceeded your available transfer by over')+' '+estatus), 'error');
								poll.stop();
								traffic_currentperiod = traffic_limit;
							}
							var viewX = document.getElementById("idtraffic_currentperiod");
							viewX.innerHTML = ntraffic_currentperiod + ' ' + traffic_currentperiod_progress;
							pdata_bar(traffic_currentperiod, traffic_limit, true);
							var viewbar = document.getElementById('idtraffic_currentperiod_progress');
							viewbar.style.display = "block";
							document.getElementById('idtraffic_currentperiod_progress').classList.remove('hidden');
						}
						if (data_traffic_warning_cycle == 'd') {
							var percentD = parseInt((traffic_today * 100) / traffic_limit);
							var traffic_today_progress = ' (' + percentD + '% ' + _('out of') + ' ' + bytesToSize(traffic_limit) + ')';
							if (percentD > 100) {
								percentD = 100;
								estatus = bytesToSize((traffic_today - traffic_limit));
								ui.addNotification(null, E('p', _('You have exceeded your available transfer by over')+' '+estatus), 'error');
								poll.stop();
								traffic_today = traffic_limit;
							}
							var viewY = document.getElementById("idtraffic_currentperiod");
							viewY.innerHTML = ntraffic_currentperiod + ' ' + traffic_today_progress;
							tdata_bar(traffic_today, traffic_limit, true);
							var viewbar2 = document.getElementById('idtraffic_today_progress');
							viewbar2.style.display = "block";
							document.getElementById('idtraffic_today_progress').classList.remove('hidden');
						}
					} else {
						var viewrem = document.getElementById('idremaining_transfer_gl');
						viewrem.style.display = "none";
						var viewZ = document.getElementById("idtraffic_currentperiod");
						viewZ.innerHTML = ntraffic_currentperiod;
					}

					document.getElementById("idtraffic_today").innerHTML = bytesToSize(traffic_today);
					document.getElementById("idtraffic_yesterday").innerHTML = bytesToSize(traffic_yesterday);
					document.getElementById("idtraffic_last7d").innerHTML = bytesToSize(traffic_last7d);
					document.getElementById("idtraffic_last30d").innerHTML = bytesToSize(traffic_last30d);
					document.getElementById("idtraffic_total").innerHTML = bytesToSize(traffic_total) + ' ' + traffic_total_since;
					document.getElementById("idtraffic_currentperiod_daysleft").innerHTML = diffdays;
					document.getElementById("idtraffic_currentperiod_projected").innerHTML = ntraffic_currentperiod_projected;
					document.getElementById("idtraffic_lastperiod").innerHTML = ntraffic_lastperiod;

					var viewR = document.getElementById("idremaining_transfer");
					if (data_traffic_warning_cycle == 'p')
						viewR.innerHTML = diffdays > 0 ? bytesToSize(traffic_limit - traffic_currentperiod) + ' (' + _('approximately remains') + ' ' + bytesToSize((traffic_limit - traffic_currentperiod) / diffdays) + ' ' + _('per day') + ')' : bytesToSize(traffic_limit - traffic_currentperiod);
					if (data_traffic_warning_cycle == 'd')
						viewR.innerHTML = bytesToSize(traffic_limit - traffic_today);
				}
			});
		});

		var viewNode = E([], [
			E('h2', _('Transfer')),
			E('div', { 'class': 'cbi-map-descr' }, _('User interface for easyconfig scripts estimating transfer consumption. More information on the %seko.one.pl forum%s.').format('<a href="https://eko.one.pl/?p=easyconfig" target="_blank">', '</a>')),
			E('p'),
			E('div', { 'class': 'ifacebox', 'style': 'display:flex' }, [
				E('strong', _('Info')),
				E('label', {}, _('Calculations may differ from the operator indications')),
			]),

			E('h3', _('Transfer usage statistics')),
			E('table', { 'class': 'table' }, [
				E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td left', 'width': '33%' }, [_('Today')]),
					E('td', { 'class': 'td left', 'id': 'idtraffic_today' }, [ _('-') ])
				]),
				E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td left', 'width': '33%' }, [_('Yesterday')]),
					E('td', { 'class': 'td left', 'id': 'idtraffic_yesterday' }, [ _('-') ])
				]),
				E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td left', 'width': '33%' }, [_('Last 7 days')]),
					E('td', { 'class': 'td left', 'id': 'idtraffic_last7d' }, [ _('-') ])
				]),
				E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td left', 'width': '33%' }, [_('Last 30 days')]),
					E('td', { 'class': 'td left', 'id': 'idtraffic_last30d' }, [ _('-') ])
				]),
				E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td left', 'width': '33%' }, [ _('Total')]),
					E('td', { 'class': 'td left', 'id': 'idtraffic_total' }, [ _('-') ])
				]),
				E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td left', 'width': '33%' }, [ _('Days until the end of the billing period')]),
					E('td', { 'class': 'td left', 'id': 'idtraffic_currentperiod_daysleft' }, [ _('-') ])
				]),
				E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td left', 'width': '33%' }, [ _('Current billing period')]),
					E('td', { 'class': 'td left', 'id': 'idtraffic_currentperiod' }, [ _('-') ])
				]),
				E('tr', { 'class': 'tr', 'id': 'idremaining_transfer_gl' }, [
					E('td', { 'class': 'td left', 'width': '33%' }, [_('Estimated remaining transfer')]),
					E('td', { 'class': 'td left', 'id': 'idremaining_transfer' }, [ _('-') ])
				]),
				E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td left', 'width': '33%' }, [ _('Expected data usage for the current period')]),
					E('td', { 'class': 'td left', 'id': 'idtraffic_currentperiod_projected' }, [ _('-') ])
				]),
				E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td left', 'width': '33%' }, [ _('Previous billing period')]),
					E('td', { 'class': 'td left', 'id': 'idtraffic_lastperiod' }, [ _('-') ])
				])
			]),

            E('div', { 
                'class': 'cbi-value', 
                'id': 'stats-file-size-container',
                'style': 'margin-bottom: 0.5em; text-align: right;'
            }, [
                E('small', { 'style': 'font-size: 0.85em; color: var(--text-color-medium, #111);' }, [
                    _('Size of .json file')+': ',
                    E('span', { 'id': 'stats-file-size' }, [_('-')]),
                    ' | '+_('Size of .gz file')+': ',
                    E('span', { 'id': 'stats-archive-size' }, [_('-')])
                ])
            ]),

			E('div', { 
				'class': 'controls',
				'style': 'display: none;',
				'id': 'idtraffic_today_progress'
			}, [
				E('div', {}, [
					E('label', {}, _('Estimated data usage') + ' (' + _('per day') + ')' + ':'),
					E('div', { 'class': 'cbi-progressbar', 'title': _('unknown'), 'id': 'idtraffic_today_progress1' }, E('div', {}, [ '\u00a0']))
				])
			]),
			E('div', {
				'class': 'controls',
				'style': 'display: none;',
				'id': 'idtraffic_currentperiod_progress'
			}, [
				E('div', {}, [
					E('label', {}, _('Estimated data usage') + ' (' + _('per period') + ')' + ':'),
					E('div', { 'class': 'cbi-progressbar', 'title': _('unknown'), 'id': 'idtraffic_currentperiod_progress1' }, E('div', {}, [ '\u00a0' ]))
				])
			]),

			E('p'),

			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'cbi-button cbi-button-remove',
					'id': 'rst',
					'click': ui.createHandlerFn(this, 'handleRT')
				}, [ _('Reset data') ]),
				'\xa0\xa0\xa0',
				E('span', { 'class': 'diag-action' }, [
					new ui.ComboButton('mcopy', {
						'mcopy': '%s %s'.format(_('Make'), _('a backup')),
						'rcopy': '%s %s'.format(_('Restore'), _('a backup')),
					}, {
						'click': ui.createHandlerFn(this, 'handleGo'),
						'id': 'mr',
						'classes': {
							'mcopy': 'cbi-button cbi-button-action',
							'rcopy': 'cbi-button cbi-button-action',
						},
						'id': 'mr',
					}).render()
				]),
				'\xa0\xa0\xa0',
				E('button', {
					'class': 'cbi-button cbi-button-add',
					'id': 'rfresh',
					'click': ui.createHandlerFn(this, 'handleRfresh')
				}, [ _('Refresh') ]),
			]),

			E('br'),

			graphsRoot,

			E('h3', _('Clients')),
			E('div', { 'class': 'cbi-map-descr' }, _('Statistics of data usage by clients.')),
			E('div', { 'class': 'cbi-map', 'id': 'clientTablesRoot' }, E('div'))
		]);

		setTimeout(function () {
			buildGraphsOnce();
			refreshGraphsFromFile();
			updateStatsFileSize();	
			buildClientTablesOnce();
			refreshClientTables();
		}, 100);

		return viewNode;
	},

	handleSave: null,
	handleSaveApply:null,
	handleReset: null
});
