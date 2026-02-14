'use strict';
'require view';
'require poll';
'require rpc';
'require ui';
'require form';
'require dom';
'require fs';
'require uci';

// Define RPC calls
var callQoSmateStats = rpc.declare({
    object: 'luci.qosmate_stats',
    method: 'getStats',
    expect: { }
});

var callQoSmateHistoricalStats = rpc.declare({
    object: 'luci.qosmate_stats',
    method: 'getHistoricalStats',
    expect: { }
});

var callQoSmateRrdData = rpc.declare({
    object: 'luci.qosmate_stats',
    method: 'getRrdData',
    expect: { }
});

// Utility functions
var formatSize = function(bytes) {
    var sizes = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];
    if (bytes == 0) return '0 B';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

var convertToKbps = function(bytesPerSecond) {
    return (bytesPerSecond * 8 / 1000).toFixed(2) + ' Kbit/s';
};

// Format time value intelligently (microseconds to ms or s when appropriate)
var formatTime = function(microseconds) {
    if (microseconds === undefined || microseconds === null) return '0 µs';
    
    if (microseconds === 0) return '0 µs';
    
    if (microseconds >= 1000000) {
        // Convert to seconds for values >= 1s
        return (microseconds / 1000000).toFixed(2) + ' s';
    } else if (microseconds >= 1000) {
        // Convert to milliseconds for values >= 1ms
        return (microseconds / 1000).toFixed(2) + ' ms';
    } else {
        // Keep as microseconds for small values
        return microseconds + ' µs';
    }
};

// Parse size string like "10.5 MiB" to bytes
var parseSizeToBytes = function(sizeStr) {
    if (!sizeStr || typeof sizeStr !== 'string') return 0;
    
    var numericPart = parseFloat(sizeStr);
    var unit = sizeStr.split(' ')[1];
    var multiplier = 1;
    
    if (unit === 'KiB') multiplier = 1024;
    else if (unit === 'MiB') multiplier = 1024 * 1024;
    else if (unit === 'GiB') multiplier = 1024 * 1024 * 1024;
    else if (unit === 'TiB') multiplier = 1024 * 1024 * 1024 * 1024;
    
    return numericPart * multiplier;
};

// Convert bytes to Kbits
var bytesToKbits = function(bytes) {
    return (bytes * 8 / 1000).toFixed(2);
};

var callQoSmateAutorateStats = rpc.declare({
    object: 'luci.qosmate_stats',
    method: 'getAutorateStats',
    expect: { }
});

// Standard chart colors
var chartColors = ['#4CAF50', '#2196F3', '#FFC107', '#F44336', '#9C27B0', '#795548', '#FF9800', '#607D8B'];

// Lightweight Canvas time-series chart renderer
var TimeSeriesChart = {
    draw: function(canvas, config) {
        var ctx = canvas.getContext('2d');
        var dpr = window.devicePixelRatio || 1;
        var w = canvas.clientWidth;
        var h = canvas.clientHeight;

        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, w, h);

        // Detect text color from page theme (works for light and dark themes)
        var textColor = window.getComputedStyle(canvas.parentNode || canvas).color || '#ccc';

        var pad = { top: 20, right: 15, bottom: 32, left: 58 };

        // Determine data ranges
        var xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
        (config.series || []).forEach(function(s) {
            (s.data || []).forEach(function(pt) {
                if (pt[0] < xMin) xMin = pt[0];
                if (pt[0] > xMax) xMax = pt[0];
                if (pt[1] < yMin) yMin = pt[1];
                if (pt[1] > yMax) yMax = pt[1];
            });
        });
        (config.hLines || []).forEach(function(hl) {
            if (hl.value < yMin) yMin = hl.value;
            if (hl.value > yMax) yMax = hl.value;
        });

        if (!isFinite(xMin)) { xMin = 0; xMax = 300; }
        if (!isFinite(yMin)) { yMin = 0; yMax = 100; }
        var yr = yMax - yMin || 1;
        yMin = Math.max(0, yMin - yr * 0.05);
        yMax = yMax + yr * 0.1;
        if (xMax - xMin < 1) xMax = xMin + 60;

        // Measure longest Y-axis label to set dynamic left padding
        ctx.font = '10px sans-serif';
        var yTicks = this._ticks(yMin, yMax, 5);
        var maxLabelW = 0;
        yTicks.forEach(function(v) {
            var label = config.yFmt ? config.yFmt(v) : String(v);
            var lw = ctx.measureText(label).width;
            if (lw > maxLabelW) maxLabelW = lw;
        });
        pad.left = Math.max(58, Math.ceil(maxLabelW + 12));
        var cw = w - pad.left - pad.right;
        var ch = h - pad.top - pad.bottom;
        if (cw < 50 || ch < 50) return;

        var xS = function(v) { return pad.left + (v - xMin) / (xMax - xMin) * cw; };
        var yS = function(v) { return pad.top + ch - (v - yMin) / (yMax - yMin) * ch; };

        // Grid and labels
        ctx.fillStyle = textColor;
        ctx.font = '10px sans-serif';

        // Y axis
        ctx.textAlign = 'right';
        yTicks.forEach(function(v) {
            var y = yS(v);
            ctx.strokeStyle = '#e0e0e0';
            ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + cw, y); ctx.stroke();
            ctx.fillText(config.yFmt ? config.yFmt(v) : String(v), pad.left - 5, y + 3);
        });

        // X axis (relative time with time-aware ticks)
        ctx.textAlign = 'center';
        this._timeTicks(xMin, xMax, 6).forEach(function(v) {
            var x = xS(v);
            ctx.strokeStyle = '#e0e0e0';
            ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + ch); ctx.stroke();
            var ago = Math.round(xMax - v);
            var label;
            if (ago <= 0) label = 'now';
            else if (ago < 120) label = '-' + ago + 's';
            else if (ago < 5400) label = '-' + Math.round(ago / 60) + 'min';
            else if (ago < 172800) { var h = ago / 3600; label = '-' + (h % 1 === 0 ? h.toFixed(0) : h.toFixed(1)) + 'h'; }
            else { var d = ago / 86400; label = '-' + (d % 1 === 0 ? d.toFixed(0) : d.toFixed(1)) + 'd'; }
            ctx.fillText(label, x, pad.top + ch + 15);
        });

        // Chart border
        ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1;
        ctx.strokeRect(pad.left, pad.top, cw, ch);

        // Clip to chart area
        ctx.save();
        ctx.beginPath(); ctx.rect(pad.left, pad.top, cw, ch); ctx.clip();

        // Horizontal reference lines
        (config.hLines || []).forEach(function(hl) {
            ctx.strokeStyle = hl.color || '#999';
            ctx.lineWidth = hl.width || 1;
            if (hl.dashed) ctx.setLineDash([5, 3]);
            ctx.beginPath();
            var y = yS(hl.value);
            ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + cw, y);
            ctx.stroke(); ctx.setLineDash([]);
        });

        // Data series
        (config.series || []).forEach(function(s) {
            if (!s.data || s.data.length < 2) return;
            ctx.strokeStyle = s.color || '#2196F3';
            ctx.lineWidth = s.width || 2;
            if (s.dashed) ctx.setLineDash([5, 3]);

            if (s.fill) {
                ctx.fillStyle = s.fill;
                ctx.beginPath();
                ctx.moveTo(xS(s.data[0][0]), yS(yMin));
                s.data.forEach(function(pt) { ctx.lineTo(xS(pt[0]), yS(pt[1])); });
                ctx.lineTo(xS(s.data[s.data.length - 1][0]), yS(yMin));
                ctx.closePath(); ctx.fill();
            }

            ctx.beginPath();
            ctx.moveTo(xS(s.data[0][0]), yS(s.data[0][1]));
            for (var i = 1; i < s.data.length; i++) ctx.lineTo(xS(s.data[i][0]), yS(s.data[i][1]));
            ctx.stroke(); ctx.setLineDash([]);
        });

        ctx.restore();

        // Legend is rendered as DOM elements outside the canvas (see updateAutorateUI)
    },

    _ticks: function(min, max, count) {
        var range = max - min;
        if (range <= 0) return [min];
        var rough = range / count;
        var mag = Math.pow(10, Math.floor(Math.log10(rough)));
        var n = rough / mag;
        var step = n <= 1.5 ? mag : n <= 3.5 ? 2 * mag : n <= 7.5 ? 5 * mag : 10 * mag;
        var ticks = [];
        for (var v = Math.ceil(min / step) * step; v <= max; v += step)
            ticks.push(Math.round(v * 1000) / 1000);
        return ticks;
    },

    // Time-aware tick generation: picks clean second/minute/hour/day intervals
    _timeTicks: function(min, max, count) {
        var span = max - min;
        if (span <= 0) return [max];
        var steps = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800,
                     3600, 7200, 10800, 21600, 43200, 86400, 172800, 432000, 604800];
        var ideal = span / count;
        var step = steps[steps.length - 1];
        for (var i = 0; i < steps.length; i++) {
            if (steps[i] >= ideal) { step = steps[i]; break; }
        }
        var ticks = [];
        var maxAgo = Math.floor(span / step) * step;
        for (var ago = maxAgo; ago >= 0; ago -= step)
            ticks.push(max - ago);
        return ticks;
    }
};

// Main view
return view.extend({
    pollInterval: 5,
    lastData: null,
    charts: {},
    pollHandler: null,
    activeTabIndex: 0, // Track the active tab
    autorateData: null, // Persistent autorate state across polls
    autorateTimeRange: '60m', // Active time range for autorate charts

    load: function() {
        return Promise.all([
            callQoSmateStats(),
            callQoSmateHistoricalStats(),
            callQoSmateRrdData(),
            callQoSmateAutorateStats(),
            uci.load('qosmate')
        ]);
    },

    // Helper function to create a poll handler with consistent behavior
    createPollFunction: function() {
        var view = this;
        return function() {
            return Promise.all([
                callQoSmateStats(),
                callQoSmateHistoricalStats(),
                callQoSmateRrdData(),
                callQoSmateAutorateStats()
            ]).then(function(data) {
                view.updateContent(data);
                return data;
            }).catch(function(error) {
                // Simple error handling to show feedback when API calls fail
                console.error('Error fetching QoS statistics:', error);
                
                // Find the content container
                var contentContainer = document.querySelector('.qosmate-content-container');
                if (contentContainer) {
                    // Show error message
                    dom.content(contentContainer, E('div', { 'class': 'cbi-section' }, [
                        E('p', { 'class': 'alert-message warning' }, [
                            _('Error loading QoS statistics. Please check if the QoSmate service is running.')
                        ])
                    ]));
                }
                
                return null;
            });
        };
    },

    // Create a table to display QoS statistics
    createStatsTable: function(title, headers, rows) {
        var table = E('table', { 'class': 'table cbi-section-table' });
        
        // Add table headers
        var headerRow = E('tr', { 'class': 'tr table-titles' });
        headers.forEach(function(header) {
            headerRow.appendChild(E('th', { 'class': 'th' }, header));
        });
        table.appendChild(headerRow);
        
        // Add table rows
        if (rows && rows.length > 0) {
            rows.forEach(function(row) {
                var tableRow = E('tr', { 'class': 'tr' });
                row.forEach(function(cell) {
                    tableRow.appendChild(E('td', { 'class': 'td' }, cell));
                });
                table.appendChild(tableRow);
            });
        } else {
            var emptyRow = E('tr', { 'class': 'tr' });
            emptyRow.appendChild(E('td', { 
                'class': 'td', 
                'colspan': headers.length, 
                'style': 'text-align: center;' 
            }, _('No data available')));
            table.appendChild(emptyRow);
        }
        
        return E('div', { 'class': 'stats-table-container', 'style': 'margin-bottom: 10px;' }, [
            E('h3', { 'style': 'margin-bottom: 1.5em;' }, title),
            table
        ]);
    },

    // Create a simple chart using DOM elements
    createChart: function(id, title, data, labels, colors) {
        var container = E('div', { 'class': 'chart-container', 'style': 'height: 250px; margin-bottom: 10px;' });
        var chartTitle = E('h3', { 'style': 'margin-bottom: 1.5em;' }, title);
        
        container.appendChild(chartTitle);
        
        // Simple bar chart implementation
        var chartData = E('div', { 'class': 'chart-data', 'style': 'display: flex; height: 180px; margin-top: 5px; align-items: flex-end;' });
        
        if (data && data.length > 0) {
            var maxValue = Math.max.apply(null, data);
            
            for (var i = 0; i < data.length; i++) {
                var value = data[i];
                var barHeight = maxValue > 0 ? (value / maxValue * 160) : 0;
                
                var barContainer = E('div', { 
                    'style': 'flex: 1; text-align: center; padding: 0 2px; display: flex; flex-direction: column; align-items: center;' 
                });
                
                // Add value at top of bar
                var valueLabel = E('div', { 'style': 'font-size: 10px; margin-bottom: 5px;' }, 
                                 (typeof value === 'number') ? 
                                 (value > 1000000 ? (value / 1000000).toFixed(1) + 'M' : 
                                  value > 1000 ? (value / 1000).toFixed(1) + 'K' : value) : '0');
                
                var bar = E('div', { 
                    'style': 'background-color: ' + (colors ? colors[i % colors.length] : '#0088cc') + 
                             '; width: 80%; height: ' + (barHeight > 0 ? barHeight : 1) + 'px;' 
                });
                
                var label = E('div', { 'style': 'font-size: 10px; margin-top: 5px; white-space: nowrap;' }, 
                             labels ? labels[i] : '');
                
                barContainer.appendChild(valueLabel);
                barContainer.appendChild(bar);
                barContainer.appendChild(label);
                chartData.appendChild(barContainer);
            }
        } else {
            chartData.appendChild(E('div', { 'style': 'width: 100%; text-align: center; padding-top: 70px;' }, 
                                 _('No data available')));
        }
        
        container.appendChild(chartData);
        return container;
    },

    // Process CAKE statistics
    processCakeStats: function(data) {
        if (!data || (!data.cake_egress && !data.cake_ingress)) {
            return { tables: [], charts: [] };
        }
        
        var result = { tables: [], charts: [] };
        var self = this;
        
        // Helper function to get tin name based on diffserv mode
        function getTinName(tinIndex, diffservMode) {
            if (diffservMode === 'diffserv3') {
                return ['Bulk', 'Best Effort', 'Voice'][tinIndex] || 'Unknown';
            } else if (diffservMode === 'diffserv4') {
                return ['Bulk', 'Best Effort', 'Video', 'Voice'][tinIndex] || 'Unknown';
            } else if (diffservMode === 'diffserv8') {
                return ['Tin 0', 'Tin 1', 'Tin 2', 'Tin 3', 'Tin 4', 'Tin 5', 'Tin 6', 'Tin 7'][tinIndex] || 'Unknown';
            } else {
                return 'Tin ' + tinIndex;
            }
        }
        
        // Process CAKE egress statistics
        if (data.cake_egress) {
            var egressRows = [];
            var diffservMode = data.cake_egress.options ? data.cake_egress.options.diffserv : 'diffserv4';
            
            if (data.cake_egress.tins) {
                data.cake_egress.tins.forEach(function(tin, index) {
                    egressRows.push([
                        'Tin ' + index,
                        // Convert threshold_rate from Byte/s to Kbit/s
                        bytesToKbits(tin.threshold_rate) + ' Kbit/s',
                        formatTime(tin.target_us),
                        formatTime(tin.interval_us),
                        // Add delay metrics (µs)
                        formatTime(tin.peak_delay_us),
                        formatTime(tin.avg_delay_us),
                        formatTime(tin.base_delay_us),
                        formatSize(tin.sent_bytes),
                        tin.sent_packets,
                        tin.drops,
                        tin.ecn_mark
                    ]);
                });
            }
            
            // Create table for CAKE egress tins
            if (egressRows.length > 0) {
                result.tables.push(self.createStatsTable(
                    _('CAKE Egress Statistics - eth1'),
                    [_('Tin'), _('Threshold'), _('Target'), _('Interval'), _('Peak Delay'), _('Avg Delay'), _('Sparse Delay'), _('Bytes'), _('Packets'), _('Dropped'), _('ECN Marked')],
                    egressRows
                ));
                
                // Create charts for CAKE egress stats
                var tinLabels = egressRows.map(function(row, index) {
                    return getTinName(index, diffservMode);
                });
                
                var sentBytes = egressRows.map(function(row) { 
                    return parseSizeToBytes(row[7]);
                });
                
                var sentPackets = egressRows.map(function(row) { return parseInt(row[8]); });
                var droppedPackets = egressRows.map(function(row) { return parseInt(row[9]); });
                
                result.charts.push(self.createChart(
                    'cake-egress-bytes',
                    _('Egress Bytes Sent by Tin'),
                    sentBytes,
                    tinLabels,
                    chartColors
                ));
                
                result.charts.push(self.createChart(
                    'cake-egress-packets',
                    _('Egress Packets Sent by Tin'),
                    sentPackets,
                    tinLabels,
                    chartColors
                ));
                
                result.charts.push(self.createChart(
                    'cake-egress-dropped',
                    _('Egress Dropped Packets by Tin'),
                    droppedPackets,
                    tinLabels,
                    chartColors
                ));
            }
        }
        
        // Process CAKE ingress statistics
        if (data.cake_ingress) {
            var ingressRows = [];
            var diffservMode = data.cake_ingress.options ? data.cake_ingress.options.diffserv : 'diffserv4';
            
            if (data.cake_ingress.tins) {
                data.cake_ingress.tins.forEach(function(tin, index) {
                    ingressRows.push([
                        'Tin ' + index,
                        // Convert threshold_rate from Byte/s to Kbit/s
                        bytesToKbits(tin.threshold_rate) + ' Kbit/s',
                        formatTime(tin.target_us),
                        formatTime(tin.interval_us),
                        // Add delay metrics (µs)
                        formatTime(tin.peak_delay_us),
                        formatTime(tin.avg_delay_us),
                        formatTime(tin.base_delay_us),
                        formatSize(tin.sent_bytes),
                        tin.sent_packets,
                        tin.drops,
                        tin.ecn_mark
                    ]);
                });
            }
            
            // Create table for CAKE ingress tins
            if (ingressRows.length > 0) {
                result.tables.push(self.createStatsTable(
                    _('CAKE Ingress Statistics - eth1'),
                    [_('Tin'), _('Threshold'), _('Target'), _('Interval'), _('Peak Delay'), _('Avg Delay'), _('Sparse Delay'), _('Bytes'), _('Packets'), _('Dropped'), _('ECN Marked')],
                    ingressRows
                ));
                
                // Create charts for CAKE ingress stats
                var tinLabels = ingressRows.map(function(row, index) {
                    return getTinName(index, diffservMode);
                });
                
                var sentBytes = ingressRows.map(function(row) { 
                    return parseSizeToBytes(row[7]);
                });
                
                var sentPackets = ingressRows.map(function(row) { return parseInt(row[8]); });
                var droppedPackets = ingressRows.map(function(row) { return parseInt(row[9]); });
                
                result.charts.push(self.createChart(
                    'cake-ingress-bytes',
                    _('Ingress Bytes Sent by Tin'),
                    sentBytes,
                    tinLabels,
                    chartColors
                ));
                
                result.charts.push(self.createChart(
                    'cake-ingress-packets',
                    _('Ingress Packets Sent by Tin'),
                    sentPackets,
                    tinLabels,
                    chartColors
                ));
                
                result.charts.push(self.createChart(
                    'cake-ingress-dropped',
                    _('Ingress Dropped Packets by Tin'),
                    droppedPackets,
                    tinLabels,
                    chartColors
                ));
            }
        }
        
        return result;
    },

    // Process HFSC statistics
    processHfscStats: function(data) {
        if (!data || (!data.egress_leaf_qdiscs && !data.ingress_leaf_qdiscs)) {
            return { tables: [], charts: [] };
        }
        
        var result = { tables: [], charts: [] };
        var self = this;
        
        // Process egress leaf qdiscs
        if (data.egress_leaf_qdiscs && data.egress_leaf_qdiscs.length > 0) {
            var egressRows = [];
            
            // Process all qdiscs first and collect data
            var classData = {};
            
            data.egress_leaf_qdiscs.forEach(function(qdisc) {
                if (!qdisc.parent) return;
                
                var classId = qdisc.parent;
                var classDesc = '';
                var sortOrder = 999; // Default high value for unknown classes
                
                // Determine class description based on ID and skip those that don't match
                if (classId.includes('1:11')) {
                    classDesc = _('High Priority (Realtime)');
                    sortOrder = 5;
                }
                else if (classId.includes('1:12')) {
                    classDesc = _('Fast Non-Realtime');
                    sortOrder = 4;
                }
                else if (classId.includes('1:13')) {
                    classDesc = _('Normal');
                    sortOrder = 3;
                }
                else if (classId.includes('1:14')) {
                    classDesc = _('Low Priority');
                    sortOrder = 2;
                }
                else if (classId.includes('1:15')) {
                    classDesc = _('Bulk');
                    sortOrder = 1;
                }
                else return; // Skip this qdisc if it doesn't match any of the expected classes
                
                classData[classId] = {
                    classId: classId,
                    classDesc: classDesc,
                    sortOrder: sortOrder,
                    bytes: qdisc.bytes || 0,
                    packets: qdisc.packets || 0,
                    drops: qdisc.drops || 0,
                    overlimits: qdisc.overlimits || 0
                };
            });
            
            // Convert to array and sort based on sortOrder
            var sortedClassData = Object.values(classData).sort(function(a, b) {
                return a.sortOrder - b.sortOrder;
            });
            
            // Create rows from sorted data
            sortedClassData.forEach(function(item) {
                egressRows.push([
                    item.classId,
                    item.classDesc,
                    formatSize(item.bytes),
                    item.packets,
                    item.drops,
                    item.overlimits
                ]);
            });
            
            // Create table for HFSC egress classes
            result.tables.push(self.createStatsTable(
                _('HFSC Egress Class Statistics'),
                [_('Class ID'), _('Description'), _('Bytes'), _('Packets'), _('Drops'), _('Overlimits')],
                egressRows
            ));
            
            // Create charts for HFSC egress classes
            var classLabels = sortedClassData.map(function(item) { return item.classDesc; });
            var sentBytes = sortedClassData.map(function(item) { 
                return parseSizeToBytes(formatSize(item.bytes));
            });
            var sentPackets = sortedClassData.map(function(item) { return item.packets; });
            var droppedPackets = sortedClassData.map(function(item) { return item.drops; });
            
            result.charts.push(self.createChart(
                'hfsc-egress-bytes',
                _('Egress Bytes Sent by Class'),
                sentBytes,
                classLabels,
                chartColors
            ));
            
            result.charts.push(self.createChart(
                'hfsc-egress-packets',
                _('Egress Packets Sent by Class'),
                sentPackets,
                classLabels,
                chartColors
            ));
            
            result.charts.push(self.createChart(
                'hfsc-egress-dropped',
                _('Egress Dropped Packets by Class'),
                droppedPackets,
                classLabels,
                chartColors
            ));
        }
        
        // Process ingress leaf qdiscs
        if (data.ingress_leaf_qdiscs && data.ingress_leaf_qdiscs.length > 0) {
            var ingressRows = [];
            
            // Process all qdiscs first and collect data
            var classData = {};
            
            data.ingress_leaf_qdiscs.forEach(function(qdisc) {
                if (!qdisc.parent) return;
                
                var classId = qdisc.parent;
                var classDesc = '';
                var sortOrder = 999; // Default high value for unknown classes
                
                // Determine class description based on ID and skip those that don't match
                if (classId.includes('1:11')) {
                    classDesc = _('High Priority (Realtime)');
                    sortOrder = 5;
                }
                else if (classId.includes('1:12')) {
                    classDesc = _('Fast Non-Realtime');
                    sortOrder = 4;
                }
                else if (classId.includes('1:13')) {
                    classDesc = _('Normal');
                    sortOrder = 3;
                }
                else if (classId.includes('1:14')) {
                    classDesc = _('Low Priority');
                    sortOrder = 2;
                }
                else if (classId.includes('1:15')) {
                    classDesc = _('Bulk');
                    sortOrder = 1;
                }
                else return; // Skip this qdisc if it doesn't match any of the expected classes
                
                classData[classId] = {
                    classId: classId,
                    classDesc: classDesc,
                    sortOrder: sortOrder,
                    bytes: qdisc.bytes || 0,
                    packets: qdisc.packets || 0,
                    drops: qdisc.drops || 0,
                    overlimits: qdisc.overlimits || 0
                };
            });
            
            // Convert to array and sort based on sortOrder
            var sortedClassData = Object.values(classData).sort(function(a, b) {
                return a.sortOrder - b.sortOrder;
            });
            
            // Create rows from sorted data
            sortedClassData.forEach(function(item) {
                ingressRows.push([
                    item.classId,
                    item.classDesc,
                    formatSize(item.bytes),
                    item.packets,
                    item.drops,
                    item.overlimits
                ]);
            });
            
            // Create table for HFSC ingress classes
            result.tables.push(self.createStatsTable(
                _('HFSC Ingress Class Statistics'),
                [_('Class ID'), _('Description'), _('Bytes'), _('Packets'), _('Drops'), _('Overlimits')],
                ingressRows
            ));
            
            // Create charts for HFSC ingress classes
            var classLabels = sortedClassData.map(function(item) { return item.classDesc; });
            var sentBytes = sortedClassData.map(function(item) { 
                return parseSizeToBytes(formatSize(item.bytes));
            });
            var sentPackets = sortedClassData.map(function(item) { return item.packets; });
            var droppedPackets = sortedClassData.map(function(item) { return item.drops; });
            
            result.charts.push(self.createChart(
                'hfsc-ingress-bytes',
                _('Ingress Bytes Sent by Class'),
                sentBytes,
                classLabels,
                chartColors
            ));
            
            result.charts.push(self.createChart(
                'hfsc-ingress-packets',
                _('Ingress Packets Sent by Class'),
                sentPackets,
                classLabels,
                chartColors
            ));
            
            result.charts.push(self.createChart(
                'hfsc-ingress-dropped',
                _('Ingress Dropped Packets by Class'),
                droppedPackets,
                classLabels,
                chartColors
            ));
        }
        
        return result;
    },

    // Process Hybrid statistics (HFSC + CAKE)
    processHybridStats: function(data) {
        if (!data || (!data.egress_leaf_qdiscs && !data.ingress_leaf_qdiscs)) {
            return { tables: [], charts: [] };
        }
        
        var result = { tables: [], charts: [] };
        var self = this;
        
        // Process egress hybrid statistics
        if (data.egress_leaf_qdiscs && data.egress_leaf_qdiscs.length > 0) {
            var egressRows = [];
            
            // Process all qdiscs first and collect data (hybrid only has 1:11, 1:13, 1:15)
            var classData = {};
            
            data.egress_leaf_qdiscs.forEach(function(qdisc) {
                if (!qdisc.parent) return;
                
                var classId = qdisc.parent;
                var classDesc = '';
                var queueType = '';
                var sortOrder = 999;
                
                // Hybrid class mapping based on setup_hybrid() function
                if (classId.includes('1:11')) {
                    classDesc = _('Realtime Gaming');
                    queueType = data.gameqdisc || 'pfifo';
                    sortOrder = 3;
                }
                else if (classId.includes('1:13')) {
                    classDesc = _('Default (CAKE)');
                    queueType = 'cake';
                    sortOrder = 2;
                }
                else if (classId.includes('1:15')) {
                    classDesc = _('Bulk');
                    queueType = 'fq_codel';
                    sortOrder = 1;
                }
                else return; // Skip unknown classes
                
                classData[classId] = {
                    classId: classId,
                    classDesc: classDesc,
                    queueType: queueType,
                    sortOrder: sortOrder,
                    bytes: qdisc.bytes || 0,
                    packets: qdisc.packets || 0,
                    drops: qdisc.drops || 0,
                    overlimits: qdisc.overlimits || 0
                };
            });
            
            // Convert to array and sort
            var sortedClassData = Object.values(classData).sort(function(a, b) {
                return b.sortOrder - a.sortOrder; // Higher priority first
            });
            
            // Create rows from sorted data
            sortedClassData.forEach(function(item) {
                egressRows.push([
                    item.classId,
                    item.classDesc,
                    item.queueType,
                    formatSize(item.bytes),
                    item.packets,
                    item.drops,
                    item.overlimits
                ]);
            });
            
            // Create table for Hybrid egress classes
            result.tables.push(self.createStatsTable(
                _('Hybrid Egress Class Statistics'),
                [_('Class ID'), _('Description'), _('Queue Type'), _('Bytes'), _('Packets'), _('Drops'), _('Overlimits')],
                egressRows
            ));
            
            // Create charts
            var classLabels = sortedClassData.map(function(item) { return item.classDesc; });
            var sentBytes = sortedClassData.map(function(item) { 
                return parseSizeToBytes(formatSize(item.bytes));
            });
            var sentPackets = sortedClassData.map(function(item) { return item.packets; });
            var droppedPackets = sortedClassData.map(function(item) { return item.drops; });
            
            result.charts.push(self.createChart(
                'hybrid-egress-bytes',
                _('Egress Bytes Sent by Class'),
                sentBytes,
                classLabels,
                chartColors
            ));
            
            result.charts.push(self.createChart(
                'hybrid-egress-packets',
                _('Egress Packets Sent by Class'),
                sentPackets,
                classLabels,
                chartColors
            ));
            
            result.charts.push(self.createChart(
                'hybrid-egress-dropped',
                _('Egress Dropped Packets by Class'),
                droppedPackets,
                classLabels,
                chartColors
            ));
        }
        
        // Process ingress hybrid statistics
        if (data.ingress_leaf_qdiscs && data.ingress_leaf_qdiscs.length > 0) {
            var ingressRows = [];
            
            var classData = {};
            
            data.ingress_leaf_qdiscs.forEach(function(qdisc) {
                if (!qdisc.parent) return;
                
                var classId = qdisc.parent;
                var classDesc = '';
                var queueType = '';
                var sortOrder = 999;
                
                // Hybrid class mapping
                if (classId.includes('1:11')) {
                    classDesc = _('Realtime Gaming');
                    queueType = data.gameqdisc || 'pfifo';
                    sortOrder = 3;
                }
                else if (classId.includes('1:13')) {
                    classDesc = _('Default (CAKE)');
                    queueType = 'cake';
                    sortOrder = 2;
                }
                else if (classId.includes('1:15')) {
                    classDesc = _('Bulk');
                    queueType = 'fq_codel';
                    sortOrder = 1;
                }
                else return;
                
                classData[classId] = {
                    classId: classId,
                    classDesc: classDesc,
                    queueType: queueType,
                    sortOrder: sortOrder,
                    bytes: qdisc.bytes || 0,
                    packets: qdisc.packets || 0,
                    drops: qdisc.drops || 0,
                    overlimits: qdisc.overlimits || 0
                };
            });
            
            var sortedClassData = Object.values(classData).sort(function(a, b) {
                return b.sortOrder - a.sortOrder;
            });
            
            sortedClassData.forEach(function(item) {
                ingressRows.push([
                    item.classId,
                    item.classDesc,
                    item.queueType,
                    formatSize(item.bytes),
                    item.packets,
                    item.drops,
                    item.overlimits
                ]);
            });
            
            result.tables.push(self.createStatsTable(
                _('Hybrid Ingress Class Statistics'),
                [_('Class ID'), _('Description'), _('Queue Type'), _('Bytes'), _('Packets'), _('Drops'), _('Overlimits')],
                ingressRows
            ));
            
            var classLabels = sortedClassData.map(function(item) { return item.classDesc; });
            var sentBytes = sortedClassData.map(function(item) { 
                return parseSizeToBytes(formatSize(item.bytes));
            });
            var sentPackets = sortedClassData.map(function(item) { return item.packets; });
            var droppedPackets = sortedClassData.map(function(item) { return item.drops; });
            
            result.charts.push(self.createChart(
                'hybrid-ingress-bytes',
                _('Ingress Bytes Sent by Class'),
                sentBytes,
                classLabels,
                chartColors
            ));
            
            result.charts.push(self.createChart(
                'hybrid-ingress-packets',
                _('Ingress Packets Sent by Class'),
                sentPackets,
                classLabels,
                chartColors
            ));
            
            result.charts.push(self.createChart(
                'hybrid-ingress-dropped',
                _('Ingress Dropped Packets by Class'),
                droppedPackets,
                classLabels,
                chartColors
            ));
        }
        
        // Add CAKE details for the 1:13 class if available
        if (data.hybrid_cake_egress && Object.keys(data.hybrid_cake_egress).length > 0) {
            var cakeEgressData = data.hybrid_cake_egress;
            if (cakeEgressData.tins && cakeEgressData.tins.length > 0) {
                var cakeEgressRows = [];
                                 cakeEgressData.tins.forEach(function(tin, index) {
                     cakeEgressRows.push([
                         'Tin ' + index,
                         bytesToKbits(tin.threshold_rate) + ' Kbit/s',
                         formatTime(tin.target_us),
                         formatTime(tin.interval_us),
                         formatTime(tin.peak_delay_us),
                         formatTime(tin.avg_delay_us),
                         formatTime(tin.base_delay_us),
                         formatSize(tin.sent_bytes),
                         tin.sent_packets,
                         tin.drops,
                         tin.ecn_mark
                     ]);
                 });
                 
                 result.tables.push(self.createStatsTable(
                     _('CAKE Statistics for Default Class (Egress)'),
                     [_('Tin'), _('Threshold'), _('Target'), _('Interval'), _('Peak Delay'), _('Avg Delay'), _('Sparse Delay'), _('Bytes'), _('Packets'), _('Dropped'), _('ECN Marked')],
                     cakeEgressRows
                 ));
            }
        }
        
        if (data.hybrid_cake_ingress && Object.keys(data.hybrid_cake_ingress).length > 0) {
            var cakeIngressData = data.hybrid_cake_ingress;
            if (cakeIngressData.tins && cakeIngressData.tins.length > 0) {
                var cakeIngressRows = [];
                                 cakeIngressData.tins.forEach(function(tin, index) {
                     cakeIngressRows.push([
                         'Tin ' + index,
                         bytesToKbits(tin.threshold_rate) + ' Kbit/s',
                         formatTime(tin.target_us),
                         formatTime(tin.interval_us),
                         formatTime(tin.peak_delay_us),
                         formatTime(tin.avg_delay_us),
                         formatTime(tin.base_delay_us),
                         formatSize(tin.sent_bytes),
                         tin.sent_packets,
                         tin.drops,
                         tin.ecn_mark
                     ]);
                 });
                 
                 result.tables.push(self.createStatsTable(
                     _('CAKE Statistics for Default Class (Ingress)'),
                     [_('Tin'), _('Threshold'), _('Target'), _('Interval'), _('Peak Delay'), _('Avg Delay'), _('Sparse Delay'), _('Bytes'), _('Packets'), _('Dropped'), _('ECN Marked')],
                     cakeIngressRows
                 ));
            }
        }
        
        return result;
    },

    // Process HTB statistics
    processHtbStats: function(data) {
        if (!data || (!data.egress_leaf_qdiscs && !data.ingress_leaf_qdiscs)) {
            return { tables: [], charts: [] };
        }
        
        var result = { tables: [], charts: [] };
        var self = this;
        
        // Process egress HTB statistics
        if (data.egress_leaf_qdiscs && data.egress_leaf_qdiscs.length > 0) {
            var egressRows = [];
            
            // Process all qdiscs first and collect data
            var classData = {};
            
            data.egress_leaf_qdiscs.forEach(function(qdisc) {
                if (!qdisc.parent) return;
                
                var classId = qdisc.parent;
                var classDesc = '';
                var sortOrder = 999; // Default high value for unknown classes
                
                // Determine class description based on ID and skip those that don't match
                if (classId.includes('1:11')) {
                    classDesc = _('Priority');
                    sortOrder = 3;
                }
                else if (classId.includes('1:13')) {
                    classDesc = _('Best Effort');
                    sortOrder = 2;
                }
                else if (classId.includes('1:15')) {
                    classDesc = _('Background');
                    sortOrder = 1;
                }
                else return; // Skip this qdisc if it doesn't match any of the expected classes
                
                classData[classId] = {
                    classId: classId,
                    classDesc: classDesc,
                    sortOrder: sortOrder,
                    bytes: qdisc.bytes || 0,
                    packets: qdisc.packets || 0,
                    drops: qdisc.drops || 0,
                    overlimits: qdisc.overlimits || 0
                };
            });
            
            // Convert to array and sort based on sortOrder
            var sortedClassData = Object.values(classData).sort(function(a, b) {
                return b.sortOrder - a.sortOrder; // Higher priority first
            });
            
            // Create rows from sorted data
            sortedClassData.forEach(function(item) {
                egressRows.push([
                    item.classId,
                    item.classDesc,
                    formatSize(item.bytes),
                    item.packets,
                    item.drops,
                    item.overlimits
                ]);
            });
            
            // Create table for HTB egress classes
            result.tables.push(self.createStatsTable(
                _('HTB Egress Class Statistics'),
                [_('Class ID'), _('Description'), _('Bytes'), _('Packets'), _('Drops'), _('Overlimits')],
                egressRows
            ));
            
            // Create charts for HTB egress classes
            var classLabels = sortedClassData.map(function(item) { return item.classDesc; });
            var sentBytes = sortedClassData.map(function(item) { 
                return parseSizeToBytes(formatSize(item.bytes));
            });
            var sentPackets = sortedClassData.map(function(item) { return item.packets; });
            var droppedPackets = sortedClassData.map(function(item) { return item.drops; });
            
            result.charts.push(self.createChart(
                'htb-egress-bytes',
                _('Egress Bytes Sent by Class'),
                sentBytes,
                classLabels,
                chartColors
            ));
            
            result.charts.push(self.createChart(
                'htb-egress-packets',
                _('Egress Packets Sent by Class'),
                sentPackets,
                classLabels,
                chartColors
            ));
            
            result.charts.push(self.createChart(
                'htb-egress-dropped',
                _('Egress Dropped Packets by Class'),
                droppedPackets,
                classLabels,
                chartColors
            ));
        }
        
        // Process ingress HTB statistics
        if (data.ingress_leaf_qdiscs && data.ingress_leaf_qdiscs.length > 0) {
            var ingressRows = [];
            
            var classData = {};
            
            data.ingress_leaf_qdiscs.forEach(function(qdisc) {
                if (!qdisc.parent) return;
                
                var classId = qdisc.parent;
                var classDesc = '';
                var sortOrder = 999;
                
                if (classId.includes('1:11')) {
                    classDesc = _('Priority');
                    sortOrder = 3;
                }
                else if (classId.includes('1:13')) {
                    classDesc = _('Best Effort');
                    sortOrder = 2;
                }
                else if (classId.includes('1:15')) {
                    classDesc = _('Background');
                    sortOrder = 1;
                }
                else return;
                
                classData[classId] = {
                    classId: classId,
                    classDesc: classDesc,
                    sortOrder: sortOrder,
                    bytes: qdisc.bytes || 0,
                    packets: qdisc.packets || 0,
                    drops: qdisc.drops || 0,
                    overlimits: qdisc.overlimits || 0
                };
            });
            
            var sortedClassData = Object.values(classData).sort(function(a, b) {
                return b.sortOrder - a.sortOrder;
            });
            
            sortedClassData.forEach(function(item) {
                ingressRows.push([
                    item.classId,
                    item.classDesc,
                    formatSize(item.bytes),
                    item.packets,
                    item.drops,
                    item.overlimits
                ]);
            });
            
            result.tables.push(self.createStatsTable(
                _('HTB Ingress Class Statistics'),
                [_('Class ID'), _('Description'), _('Bytes'), _('Packets'), _('Drops'), _('Overlimits')],
                ingressRows
            ));
            
            var classLabels = sortedClassData.map(function(item) { return item.classDesc; });
            var sentBytes = sortedClassData.map(function(item) { 
                return parseSizeToBytes(formatSize(item.bytes));
            });
            var sentPackets = sortedClassData.map(function(item) { return item.packets; });
            var droppedPackets = sortedClassData.map(function(item) { return item.drops; });
            
            result.charts.push(self.createChart(
                'htb-ingress-bytes',
                _('Ingress Bytes Sent by Class'),
                sentBytes,
                classLabels,
                chartColors
            ));
            
            result.charts.push(self.createChart(
                'htb-ingress-packets',
                _('Ingress Packets Sent by Class'),
                sentPackets,
                classLabels,
                chartColors
            ));
            
            result.charts.push(self.createChart(
                'htb-ingress-dropped',
                _('Ingress Dropped Packets by Class'),
                droppedPackets,
                classLabels,
                chartColors
            ));
        }
        
        return result;
    },

    render: function(data) {
        var view = this;
        var qosStats = data[0];
        var historicalStats = data[1];
        var rrdData = data[2];
        var autorateStats = data[3];
        
        view.lastData = qosStats;
        if (autorateStats && autorateStats.autorate_enabled) view.autorateData = autorateStats;
        
        // Create a separate container for settings to prevent it from being refreshed
        var mainContainer;
        var existingContainer = document.querySelector('.cbi-map-statistics');
        var existingSettings = document.querySelector('.qosmate-settings-section');
        
        if (!existingContainer) {
            // First time render, create the full layout
            mainContainer = E('div', { 'class': 'cbi-map cbi-map-statistics' });
            
            // Create settings section that will remain stable across refreshes
            var settingsSection = E('div', { 'class': 'cbi-section qosmate-settings-section', 'style': 'margin-bottom: 5px;' });
            
            // Create header for settings
            var settingsHeader = E('h3', {}, _('QoSmate Settings'));
            settingsSection.appendChild(settingsHeader);
            
            // Create completely custom styling independent of themes
            var refreshRow = E('div', { 'style': 'margin-top: 0.5em; margin-left: 0.25em;' });
            
            // Directly inline elements without any theme classes
            refreshRow.appendChild(E('span', {}, _('Refresh Interval')));
            refreshRow.appendChild(document.createTextNode(' '));
            
            // Clean select with no special styling
            var pollSelect = E('select', { 
                'id': 'poll-interval',
                'change': function(ev) {
                    var newInterval = parseInt(ev.target.value, 10);
                    
                    if (view.pollHandler) {
                        poll.remove(view.pollHandler);
                    }
                    
                    view.pollInterval = newInterval;
                    view.pollHandler = view.createPollFunction();
                    poll.add(view.pollHandler, view.pollInterval);
                }
            });
            
            [2, 5, 10, 15, 30, 60].forEach(function(seconds) {
                var option = E('option', { 'value': seconds }, seconds + ' ' + _('seconds'));
                if (parseInt(view.pollInterval, 10) === seconds) {
                    option.selected = true;
                }
                pollSelect.appendChild(option);
            });
            
            refreshRow.appendChild(pollSelect);
            settingsSection.appendChild(refreshRow);
            
            mainContainer.appendChild(settingsSection);
            
            // Create content container that will be refreshed
            var contentContainer = E('div', { 'class': 'qosmate-content-container' });
            mainContainer.appendChild(contentContainer);
            
            // Create persistent autorate container (survives poll rebuilds)
            var autorateContainer = E('div', { 'class': 'qosmate-autorate-container', 'style': 'display: none;' });
            
            // Status panel
            autorateContainer.appendChild(E('div', { 'class': 'cbi-section autorate-status-panel', 'style': 'margin-bottom: 5px;' }));
            
            // Time range selector
            var timeRangeRow = E('div', { 'style': 'margin: 0.5em 0 0.8em 0.25em;' });
            timeRangeRow.appendChild(E('span', {}, _('Time Range') + ' '));
            var flashEnabled = uci.get('qosmate', 'autorate', 'flash_history') === '1';
            var rangeSelect = E('select', {
                'class': 'autorate-time-range',
                'disabled': !flashEnabled ? '' : null,
                'change': function(ev) {
                    view.autorateTimeRange = ev.target.value;
                    if (view.autorateData) view.updateAutorateUI(view.autorateData);
                }
            });
            [['60m', '60 ' + _('minutes')]].concat(flashEnabled ? [
                ['6h', '6 ' + _('hours')], ['24h', '24 ' + _('hours')],
                ['7d', '7 ' + _('days')], ['30d', '30 ' + _('days')]
            ] : []).forEach(function(opt) {
                var o = E('option', { 'value': opt[0] }, opt[1]);
                if (opt[0] === view.autorateTimeRange) o.selected = true;
                rangeSelect.appendChild(o);
            });
            timeRangeRow.appendChild(rangeSelect);
            
            // Flash history toggle
            var flashCb = E('input', {
                'type': 'checkbox',
                'id': 'autorate-flash-history',
                'checked': flashEnabled ? '' : null,
                'style': 'position: relative; top: -0.15rem; margin-right: 4px;',
                'change': function(ev) {
                    var enabled = ev.target.checked;
                    var val = enabled ? '1' : '0';
                    // Apply UCI change immediately (same pattern as connections.js)
                    uci.load('qosmate').then(function() {
                        uci.set('qosmate', 'autorate', 'flash_history', val);
                        return uci.save();
                    }).then(function() {
                        return uci.apply();
                    }).then(function() {
                        uci.unload('qosmate');
                        return uci.load('qosmate');
                    });
                    // Update dropdown immediately without waiting for apply
                    var sel = document.querySelector('.autorate-time-range');
                    if (sel) {
                        view.autorateTimeRange = '60m';
                        sel.value = '60m';
                        while (sel.options.length > 1) sel.remove(1);
                        if (enabled) {
                            [['6h', '6 ' + _('hours')], ['24h', '24 ' + _('hours')],
                             ['7d', '7 ' + _('days')], ['30d', '30 ' + _('days')]].forEach(function(opt) {
                                sel.appendChild(E('option', { 'value': opt[0] }, opt[1]));
                            });
                            sel.disabled = false;
                        } else {
                            sel.disabled = true;
                        }
                    }
                }
            });
            var flashLabel = E('label', {
                'for': 'autorate-flash-history',
                'style': 'margin-left: 1.5em; font-size: 12px; cursor: pointer;'
            }, [ flashCb, ' ' + _('Enable long-term history') ]);
            timeRangeRow.appendChild(flashLabel);
            
            autorateContainer.appendChild(timeRangeRow);
            
            // Data availability info hint (hidden by default)
            autorateContainer.appendChild(E('div', {
                'class': 'autorate-data-info',
                'style': 'display: none; margin: 0 0.25em 0.5em; padding: 0.4em 0.6em; font-size: 12px; color: #888; font-style: italic;'
            }));
            
            // Chart sections
            var chartSection = E('div', { 'class': 'cbi-section', 'style': 'padding: 5px 0;' });
            
            var latencyWrap = E('div', { 'style': 'margin-bottom: 15px;' });
            latencyWrap.appendChild(E('h3', { 'style': 'margin-bottom: 0.3em;' }, _('Latency')));
            latencyWrap.appendChild(E('div', { 'class': 'autorate-latency-legend', 'style': 'margin-bottom: 0.4em; font-size: 11px;' }));
            latencyWrap.appendChild(E('canvas', { 'class': 'autorate-latency-canvas', 'style': 'width: 100%; height: 220px; display: block;' }));
            chartSection.appendChild(latencyWrap);
            
            var ulWrap = E('div', { 'style': 'margin-bottom: 15px;' });
            ulWrap.appendChild(E('h3', { 'style': 'margin-bottom: 0.3em;' }, _('Upload Bandwidth')));
            ulWrap.appendChild(E('div', { 'class': 'autorate-ul-legend', 'style': 'margin-bottom: 0.4em; font-size: 11px;' }));
            ulWrap.appendChild(E('canvas', { 'class': 'autorate-ul-canvas', 'style': 'width: 100%; height: 220px; display: block;' }));
            chartSection.appendChild(ulWrap);
            
            var dlWrap = E('div', { 'style': 'margin-bottom: 15px;' });
            dlWrap.appendChild(E('h3', { 'style': 'margin-bottom: 0.3em;' }, _('Download Bandwidth')));
            dlWrap.appendChild(E('div', { 'class': 'autorate-dl-legend', 'style': 'margin-bottom: 0.4em; font-size: 11px;' }));
            dlWrap.appendChild(E('canvas', { 'class': 'autorate-dl-canvas', 'style': 'width: 100%; height: 220px; display: block;' }));
            chartSection.appendChild(dlWrap);
            
            autorateContainer.appendChild(chartSection);
            mainContainer.appendChild(autorateContainer);
            
            // Setup initial polling using LuCI poll API
            if (!view.pollHandler) {
                view.pollHandler = view.createPollFunction();
                poll.add(view.pollHandler, view.pollInterval);
            }
        } else {
            // Re-use the existing container during subsequent renders
            mainContainer = existingContainer;
        }
        
        return mainContainer;
    },
    
    // New method to update only the content part of the page
    updateContent: function(data) {
        var view = this;
        var qosStats = data[0];
        var historicalStats = data[1];
        var rrdData = data[2];
        var autorateStats = data[3];
        
        // Update autorate charts (persistent container, not rebuilt)
        var autorateEnabled = autorateStats && autorateStats.autorate_enabled;
        if (autorateEnabled) {
            view.autorateData = autorateStats;
            view.updateAutorateUI(autorateStats);
        } else {
            // Hide autorate container if autorate was disabled
            var arContainer = document.querySelector('.qosmate-autorate-container');
            if (arContainer) arContainer.style.display = 'none';
        }
        
        // Save the active tab index before refreshing content
        var activeTab = document.querySelector('.cbi-tab.cbi-tab-active');
        if (activeTab) {
            view.activeTabIndex = parseInt(activeTab.getAttribute('data-tab-index') || 0, 10);
        }
        
        // Get the content container
        var contentContainer = document.querySelector('.qosmate-content-container');
        if (!contentContainer) return;
        
        // Clear the current content
        dom.content(contentContainer, '');
        
        // Add general info section
        if (qosStats) {
            // Create a standard section
            var generalInfo = E('div', { 'class': 'cbi-section', 'style': 'margin-bottom: 5px;' });
            
            // Create header for general info
            var headerSection = E('h3', { 'style': 'margin-bottom: 0.5em;' }, _('General Information'));
            generalInfo.appendChild(headerSection);
            
            // Create completely custom container for info using flexbox for horizontal layout
            var infoContainer = E('div', { 'style': 'display: flex; flex-wrap: wrap; margin-left: 0.25em;' });
            
            // Create simple layout items that will display horizontally
            if (qosStats.root_qdisc) {
                var row = E('div', { 'style': 'margin-right: 1.5em; margin-bottom: 0.3em;' });
                row.appendChild(E('span', { 'style': 'font-weight: bold;' }, _('Root Queueing Discipline:')));
                row.appendChild(document.createTextNode(' '));
                row.appendChild(E('span', {}, qosStats.root_qdisc || '-'));
                infoContainer.appendChild(row);
            }
            
            if (qosStats.wan_interface) {
                var row = E('div', { 'style': 'margin-right: 1.5em; margin-bottom: 0.3em;' });
                row.appendChild(E('span', { 'style': 'font-weight: bold;' }, _('WAN Interface:')));
                row.appendChild(document.createTextNode(' '));
                row.appendChild(E('span', {}, qosStats.wan_interface || '-'));
                infoContainer.appendChild(row);
            }
            
            // Add CAKE-specific or HFSC-specific info
            if (qosStats.root_qdisc === 'cake') {
                if (qosStats.priority_queue_ingress) {
                    var row = E('div', { 'style': 'margin-right: 1.5em; margin-bottom: 0.3em;' });
                    row.appendChild(E('span', { 'style': 'font-weight: bold;' }, _('Priority Queue Type (Ingress):')));
                    row.appendChild(document.createTextNode(' '));
                    row.appendChild(E('span', {}, qosStats.priority_queue_ingress || '-'));
                    infoContainer.appendChild(row);
                }
                
                if (qosStats.priority_queue_egress) {
                    var row = E('div', { 'style': 'margin-right: 1.5em; margin-bottom: 0.3em;' });
                    row.appendChild(E('span', { 'style': 'font-weight: bold;' }, _('Priority Queue Type (Egress):')));
                    row.appendChild(document.createTextNode(' '));
                    row.appendChild(E('span', {}, qosStats.priority_queue_egress || '-'));
                    infoContainer.appendChild(row);
                }
            } else if (qosStats.root_qdisc === 'hfsc' || qosStats.root_qdisc === 'hybrid') {
                if (qosStats.gameqdisc) {
                    var row = E('div', { 'style': 'margin-right: 1.5em; margin-bottom: 0.3em;' });
                    row.appendChild(E('span', { 'style': 'font-weight: bold;' }, _('Game Queue Discipline:')));
                    row.appendChild(document.createTextNode(' '));
                    row.appendChild(E('span', {}, qosStats.gameqdisc || '-'));
                    infoContainer.appendChild(row);
                }
            }
            
            generalInfo.appendChild(infoContainer);
            contentContainer.appendChild(generalInfo);
            
            // Create tabbed interface
            var tabsContainer = E('div', { 'class': 'cbi-section', 'style': 'padding: 0; margin-bottom: 5px;' });
            var tabNames = [_('Egress (Upload)'), _('Ingress (Download)')];
            var autorateTabIndex = -1;
            if (autorateEnabled) {
                autorateTabIndex = tabNames.length;
                tabNames.push(_('Autorate'));
            }
            // Reset to first tab if saved index is out of range (e.g. autorate was disabled)
            if (view.activeTabIndex >= tabNames.length) view.activeTabIndex = 0;
            var tabContents = [
                E('div', { 'style': 'padding: 5px 0;' }), 
                E('div', { 'style': 'padding: 5px 0; display: none;' })
            ];
            
            // Reference to persistent autorate container
            var autorateContainer = document.querySelector('.qosmate-autorate-container');
            
            // Add tab buttons container
            var tabButtons = E('ul', { 'class': 'cbi-tabmenu', 'style': 'margin-left: 0; padding-left: 1px;' });
            
            tabNames.forEach(function(name, index) {
                var isActive = index === view.activeTabIndex;
                var button = E('li', { 'class': isActive ? 'cbi-tab' : 'cbi-tab-disabled' }, [
                    E('a', {
                        'href': '#',
                        'data-tab-index': index,
                        'click': function(ev) {
                            ev.preventDefault();
                            
                            // Store the active tab index
                            view.activeTabIndex = parseInt(ev.target.getAttribute('data-tab-index') || ev.target.parentNode.getAttribute('data-tab-index'));
                            
                            // Update tab button styles
                            tabButtons.querySelectorAll('li').forEach(function(tab, i) {
                                if (i === view.activeTabIndex) {
                                    tab.className = 'cbi-tab';
                                } else {
                                    tab.className = 'cbi-tab-disabled';
                                }
                            });
                            
                            // Show corresponding tab content and hide others
                            var isAutorate = autorateTabIndex >= 0 && view.activeTabIndex === autorateTabIndex;
                            tabContents.forEach(function(content, i) {
                                content.style.display = (!isAutorate && i === view.activeTabIndex) ? 'block' : 'none';
                            });
                            if (autorateContainer) {
                                autorateContainer.style.display = isAutorate ? 'block' : 'none';
                                if (isAutorate && view.autorateData) view.updateAutorateUI(view.autorateData);
                            }
                        }
                    }, name)
                ]);
                
                tabButtons.appendChild(button);
            });
            
            // Set initial display state based on the active tab index
            var isAutorateActive = autorateTabIndex >= 0 && view.activeTabIndex === autorateTabIndex;
            tabContents.forEach(function(content, i) {
                content.style.display = (!isAutorateActive && i === view.activeTabIndex) ? 'block' : 'none';
            });
            if (autorateContainer) {
                autorateContainer.style.display = isAutorateActive ? 'block' : 'none';
            }
            
            tabsContainer.appendChild(tabButtons);
            
            // Process and display statistics based on root qdisc
            if (qosStats.root_qdisc === 'cake') {
                var cakeResults = this.processCakeStats(qosStats);
                
                // Process and display tables in appropriate tabs
                if (cakeResults.tables.length > 0) {
                    // Find correct indices for egress and ingress tables
                    var egressTable = null;
                    var ingressTable = null;
                    
                    // Find the egress and ingress tables by looking at their titles
                    for (var i = 0; i < cakeResults.tables.length; i++) {
                        var titleElement = cakeResults.tables[i].querySelector('h3, .table-title');
                        if (titleElement) {
                            var title = titleElement.textContent || titleElement.innerText;
                            if (title.includes('Egress')) {
                                egressTable = cakeResults.tables[i];
                            } else if (title.includes('Ingress')) {
                                ingressTable = cakeResults.tables[i];
                            }
                        }
                    }
                    
                    // Egress table section
                    if (egressTable) {
                        tabContents[0].appendChild(egressTable);
                    }
                    
                    // Ingress table section
                    if (ingressTable) {
                        tabContents[1].appendChild(ingressTable);
                    }
                    
                    // Process charts
                    if (cakeResults.charts.length > 0) {
                        var egressCharts = [];
                        var ingressCharts = [];
                        
                        // Categorize charts as egress or ingress based on their titles
                        for (var i = 0; i < cakeResults.charts.length; i++) {
                            var chartTitle = cakeResults.charts[i].querySelector('h3');
                            var titleText = chartTitle ? (chartTitle.textContent || chartTitle.innerText) : '';
                            
                            if (titleText.includes('Egress')) {
                                egressCharts.push(cakeResults.charts[i]);
                            } else if (titleText.includes('Ingress')) {
                                ingressCharts.push(cakeResults.charts[i]);
                            }
                        }
                        
                        // Create egress charts section
                        if (egressCharts.length > 0) {
                            var egressChartsContainer = E('div', { 'class': 'cbi-section-node' });
                            var egressGrid = E('div', { 
                                'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;' 
                            });
                            
                            egressCharts.forEach(function(chart) {
                                egressGrid.appendChild(chart);
                            });
                            
                            egressChartsContainer.appendChild(egressGrid);
                            tabContents[0].appendChild(egressChartsContainer);
                        }
                        
                        // Create ingress charts section
                        if (ingressCharts.length > 0) {
                            var ingressChartsContainer = E('div', { 'class': 'cbi-section-node' });
                            var ingressGrid = E('div', { 
                                'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;' 
                            });
                            
                            ingressCharts.forEach(function(chart) {
                                ingressGrid.appendChild(chart);
                            });
                            
                            ingressChartsContainer.appendChild(ingressGrid);
                            tabContents[1].appendChild(ingressChartsContainer);
                        }
                    }
                }
            } else if (qosStats.root_qdisc === 'hfsc') {
                var hfscResults = this.processHfscStats(qosStats);
                
                // Process and display tables in appropriate tabs
                if (hfscResults.tables.length > 0) {
                    // Find correct indices for egress and ingress tables
                    var egressTable = null;
                    var ingressTable = null;
                    
                    // Find the egress and ingress tables by looking at their titles
                    for (var i = 0; i < hfscResults.tables.length; i++) {
                        var titleElement = hfscResults.tables[i].querySelector('h3, .table-title');
                        if (titleElement) {
                            var title = titleElement.textContent || titleElement.innerText;
                            if (title.includes('Egress')) {
                                egressTable = hfscResults.tables[i];
                            } else if (title.includes('Ingress')) {
                                ingressTable = hfscResults.tables[i];
                            }
                        }
                    }
                    
                    // Egress table section
                    if (egressTable) {
                        tabContents[0].appendChild(egressTable);
                    }
                    
                    // Ingress table section
                    if (ingressTable) {
                        tabContents[1].appendChild(ingressTable);
                    }
                    
                    // Process charts
                    if (hfscResults.charts.length > 0) {
                        var egressCharts = [];
                        var ingressCharts = [];
                        
                        // Categorize charts as egress or ingress based on their titles
                        for (var i = 0; i < hfscResults.charts.length; i++) {
                            var chartTitle = hfscResults.charts[i].querySelector('h3');
                            var titleText = chartTitle ? (chartTitle.textContent || chartTitle.innerText) : '';
                            
                            if (titleText.includes('Egress')) {
                                egressCharts.push(hfscResults.charts[i]);
                            } else if (titleText.includes('Ingress')) {
                                ingressCharts.push(hfscResults.charts[i]);
                            }
                        }
                        
                        // Create egress charts section
                        if (egressCharts.length > 0) {
                            var egressChartsContainer = E('div', { 'class': 'cbi-section-node' });
                            var egressGrid = E('div', { 
                                'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;' 
                            });
                            
                            egressCharts.forEach(function(chart) {
                                egressGrid.appendChild(chart);
                            });
                            
                            egressChartsContainer.appendChild(egressGrid);
                            tabContents[0].appendChild(egressChartsContainer);
                        }
                        
                        // Create ingress charts section
                        if (ingressCharts.length > 0) {
                            var ingressChartsContainer = E('div', { 'class': 'cbi-section-node' });
                            var ingressGrid = E('div', { 
                                'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;' 
                            });
                            
                            ingressCharts.forEach(function(chart) {
                                ingressGrid.appendChild(chart);
                            });
                            
                            ingressChartsContainer.appendChild(ingressGrid);
                            tabContents[1].appendChild(ingressChartsContainer);
                        }
                    }
                }
            } else if (qosStats.root_qdisc === 'hybrid') {
                var hybridResults = this.processHybridStats(qosStats);
                
                // Process and display tables in appropriate tabs
                if (hybridResults.tables.length > 0) {
                    // Separate tables by type
                    var egressClassTable = null;
                    var ingressClassTable = null;
                    var cakeEgressTable = null;
                    var cakeIngressTable = null;
                    
                    // Categorize tables by their titles
                    for (var i = 0; i < hybridResults.tables.length; i++) {
                        var titleElement = hybridResults.tables[i].querySelector('h3, .table-title');
                        if (titleElement) {
                            var title = titleElement.textContent || titleElement.innerText;
                            if (title.includes('Hybrid Egress Class')) {
                                egressClassTable = hybridResults.tables[i];
                            } else if (title.includes('Hybrid Ingress Class')) {
                                ingressClassTable = hybridResults.tables[i];
                            } else if (title.includes('CAKE') && title.includes('Egress')) {
                                cakeEgressTable = hybridResults.tables[i];
                            } else if (title.includes('CAKE') && title.includes('Ingress')) {
                                cakeIngressTable = hybridResults.tables[i];
                            }
                        }
                    }
                    
                    // Add tables to appropriate tabs
                    if (egressClassTable) {
                        tabContents[0].appendChild(egressClassTable);
                    }
                    if (cakeEgressTable) {
                        tabContents[0].appendChild(cakeEgressTable);
                    }
                    
                    if (ingressClassTable) {
                        tabContents[1].appendChild(ingressClassTable);
                    }
                    if (cakeIngressTable) {
                        tabContents[1].appendChild(cakeIngressTable);
                    }
                    
                    // Process charts
                    if (hybridResults.charts.length > 0) {
                        var egressCharts = [];
                        var ingressCharts = [];
                        
                        // Categorize charts as egress or ingress based on their titles
                        for (var i = 0; i < hybridResults.charts.length; i++) {
                            var chartTitle = hybridResults.charts[i].querySelector('h3');
                            var titleText = chartTitle ? (chartTitle.textContent || chartTitle.innerText) : '';
                            
                            if (titleText.includes('Egress')) {
                                egressCharts.push(hybridResults.charts[i]);
                            } else if (titleText.includes('Ingress')) {
                                ingressCharts.push(hybridResults.charts[i]);
                            }
                        }
                        
                        // Create egress charts section
                        if (egressCharts.length > 0) {
                            var egressChartsContainer = E('div', { 'class': 'cbi-section-node' });
                            var egressGrid = E('div', { 
                                'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;' 
                            });
                            
                            egressCharts.forEach(function(chart) {
                                egressGrid.appendChild(chart);
                            });
                            
                            egressChartsContainer.appendChild(egressGrid);
                            tabContents[0].appendChild(egressChartsContainer);
                        }
                        
                        // Create ingress charts section
                        if (ingressCharts.length > 0) {
                            var ingressChartsContainer = E('div', { 'class': 'cbi-section-node' });
                            var ingressGrid = E('div', { 
                                'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;' 
                            });
                            
                            ingressCharts.forEach(function(chart) {
                                ingressGrid.appendChild(chart);
                            });
                            
                            ingressChartsContainer.appendChild(ingressGrid);
                            tabContents[1].appendChild(ingressChartsContainer);
                        }
                    }
                }
            } else if (qosStats.root_qdisc === 'htb') {
                var htbResults = this.processHtbStats(qosStats);
                
                // Process and display tables in appropriate tabs
                if (htbResults.tables.length > 0) {
                    // Separate tables by type
                    var egressClassTable = null;
                    var ingressClassTable = null;
                    
                    // Categorize tables by their titles
                    for (var i = 0; i < htbResults.tables.length; i++) {
                        var titleElement = htbResults.tables[i].querySelector('h3, .table-title');
                        if (titleElement) {
                            var title = titleElement.textContent || titleElement.innerText;
                            if (title.includes('HTB Egress Class')) {
                                egressClassTable = htbResults.tables[i];
                            } else if (title.includes('HTB Ingress Class')) {
                                ingressClassTable = htbResults.tables[i];
                            }
                        }
                    }
                    
                    // Add tables to appropriate tabs
                    if (egressClassTable) {
                        tabContents[0].appendChild(egressClassTable);
                    }
                    if (ingressClassTable) {
                        tabContents[1].appendChild(ingressClassTable);
                    }
                    
                    // Process charts
                    if (htbResults.charts.length > 0) {
                        var egressCharts = [];
                        var ingressCharts = [];
                        
                        // Categorize charts as egress or ingress based on their titles
                        for (var i = 0; i < htbResults.charts.length; i++) {
                            var chartTitle = htbResults.charts[i].querySelector('h3');
                            var titleText = chartTitle ? (chartTitle.textContent || chartTitle.innerText) : '';
                            
                            if (titleText.includes('Egress')) {
                                egressCharts.push(htbResults.charts[i]);
                            } else if (titleText.includes('Ingress')) {
                                ingressCharts.push(htbResults.charts[i]);
                            }
                        }
                        
                        // Create egress charts section
                        if (egressCharts.length > 0) {
                            var egressChartsContainer = E('div', { 'class': 'cbi-section-node' });
                            var egressGrid = E('div', { 
                                'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;' 
                            });
                            
                            egressCharts.forEach(function(chart) {
                                egressGrid.appendChild(chart);
                            });
                            
                            egressChartsContainer.appendChild(egressGrid);
                            tabContents[0].appendChild(egressChartsContainer);
                        }
                        
                        // Create ingress charts section
                        if (ingressCharts.length > 0) {
                            var ingressChartsContainer = E('div', { 'class': 'cbi-section-node' });
                            var ingressGrid = E('div', { 
                                'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;' 
                            });
                            
                            ingressCharts.forEach(function(chart) {
                                ingressGrid.appendChild(chart);
                            });
                            
                            ingressChartsContainer.appendChild(ingressGrid);
                            tabContents[1].appendChild(ingressChartsContainer);
                        }
                    }
                }
            }
            
            // Append tab contents to container
            tabContents.forEach(function(content) {
                tabsContainer.appendChild(content);
            });
            
            contentContainer.appendChild(tabsContainer);
        } else {
            contentContainer.appendChild(E('div', { 'class': 'cbi-section' }, [
                E('p', {}, _('No QoS statistics available. Make sure QoSmate is running.'))
            ]));
        }
    },
    
    // Build a DOM legend element from items array [{label, color, dashed}]
    buildChartLegend: function(container, items) {
        dom.content(container, '');
        items.forEach(function(item, i) {
            if (i > 0) container.appendChild(document.createTextNode('  '));
            var lineStyle = 'display: inline-block; width: 18px; height: 0; vertical-align: middle;'
                + ' border-top: 2px ' + (item.dashed ? 'dashed' : 'solid') + ' ' + item.color + ';'
                + ' margin-right: 4px;';
            container.appendChild(E('span', { 'style': 'white-space: nowrap; margin-right: 12px;' }, [
                E('span', { 'style': lineStyle }),
                E('span', {}, item.label)
            ]));
        });
    },

    // Update autorate status panel and charts with current data
    updateAutorateUI: function(ar) {
        var cur = ar.current || {};
        var cfg = ar.config || {};
        var range = this.autorateTimeRange || '60m';
        
        // Choose data source: RAM (60m) or flash (longer ranges)
        // RAM format: [ts, ul, dl, a_ul, a_dl, lat, bl, ulp, dlp] (9 fields)
        // Flash format: [ts, avg_ul, avg_dl, avg_a_ul, avg_a_dl, avg_lat, max_lat, avg_bl, avg_ulp, avg_dlp] (10 fields)
        var isFlash = range !== '60m';
        var rangeSec = { '60m': 3600, '6h': 21600, '24h': 86400, '7d': 604800, '30d': 2592000 };
        var maxAge = rangeSec[range] || 3600;
        var rawHistory = isFlash ? (ar.flash_history || []) : (ar.history || []);
        
        // For flash views, replace overlapping flash data with full-resolution RAM data
        // This gives the full 60min of RAM detail and avoids visual artifacts at the boundary
        if (isFlash && ar.history && ar.history.length > 0) {
            var oldestRamTs = ar.history[0][0];
            // Keep only flash entries older than the RAM window
            rawHistory = rawHistory.filter(function(h) { return h[0] < oldestRamTs; });
            // Bridge: extend last flash value to RAM start for seamless visual transition
            if (rawHistory.length > 0) {
                var last = rawHistory[rawHistory.length - 1];
                // Use a timestamp just before RAM start to avoid duplicate-x artifacts
                var bridgeTs = oldestRamTs > last[0] ? (oldestRamTs - 1) : oldestRamTs;
                rawHistory.push([bridgeTs, last[1], last[2], last[3], last[4],
                                 last[5], last[6], last[7], last[8], last[9]]);
            }
            // Convert RAM [ts,ul,dl,a_ul,a_dl,lat,bl,ulp,dlp] to flash format
            // by duplicating lat as max_lat: [ts,ul,dl,a_ul,a_dl,lat,lat,bl,ulp,dlp]
            rawHistory = rawHistory.concat(ar.history.map(function(h) {
                return [h[0], h[1], h[2], h[3], h[4], h[5], h[5], h[6], h[7], h[8]];
            }));
        }
        
        // Ensure chronological order and collapse duplicate timestamps.
        // Duplicate timestamps can produce crossing/looping visual artifacts in canvas line rendering.
        if (rawHistory.length > 1) {
            rawHistory.sort(function(a, b) { return (+a[0]) - (+b[0]); });
            var normalized = [rawHistory[0]];
            for (var ri = 1; ri < rawHistory.length; ri++) {
                var prev = normalized[normalized.length - 1];
                var curH = rawHistory[ri];
                if ((+prev[0]) === (+curH[0])) normalized[normalized.length - 1] = curH;
                else normalized.push(curH);
            }
            rawHistory = normalized;
        }
        
        // Filter data by requested time range
        if (rawHistory.length > 0) {
            var latestTs = rawHistory[rawHistory.length - 1][0];
            var cutoff = latestTs - maxAge;
            rawHistory = rawHistory.filter(function(h) { return h[0] >= cutoff; });
        }
        
        // Show info hint for long-range aggregation and incomplete history
        var infoEl = document.querySelector('.autorate-data-info');
        if (infoEl) {
            var rangeNote = '';
            var availabilityNote = '';
            
            if (isFlash) {
                rangeNote = _('For ranges above 60 minutes, recent data (last 60 min) is high-resolution, while older points are aggregated and less precise. "Latency (max)" highlights spikes that average latency may hide.');
            }
            
            if (isFlash && rawHistory.length < 2) {
                availabilityNote = _('No hourly history available yet. Data is consolidated once per hour.');
            } else if (isFlash && rawHistory.length > 0) {
                var dataSpanHours = Math.round((rawHistory[rawHistory.length - 1][0] - rawHistory[0][0]) / 3600);
                var requestedHours = Math.round(maxAge / 3600);
                if (dataSpanHours < requestedHours * 0.9) {
                    availabilityNote = _('Showing %s of data (requested %s). History grows over time.')
                        .format(dataSpanHours <= 24 ? dataSpanHours + 'h' : Math.round(dataSpanHours / 24) + 'd',
                                requestedHours <= 24 ? requestedHours + 'h' : Math.round(requestedHours / 24) + 'd');
                }
            }
            
            if (availabilityNote && rangeNote)
                infoEl.textContent = availabilityNote + ' ' + rangeNote;
            else
                infoEl.textContent = availabilityNote || rangeNote;
            
            if (infoEl.textContent)
                infoEl.style.display = '';
            else
                infoEl.style.display = 'none';
        }
        
        // Update status panel
        var panel = document.querySelector('.autorate-status-panel');
        if (panel) {
            var latMs = (cur.latency / 10).toFixed(1);
            var blMs = (cur.baseline / 10).toFixed(1);
            var ulMbps = (cur.ul_rate / 1000).toFixed(1);
            var dlMbps = (cur.dl_rate / 1000).toFixed(1);
            var baseUlMbps = (cfg.base_ul / 1000).toFixed(1);
            var baseDlMbps = (cfg.base_dl / 1000).toFixed(1);
            
            dom.content(panel, [
                E('h3', { 'style': 'margin-bottom: 0.5em;' }, _('Autorate Status')),
                E('div', { 'style': 'display: flex; flex-wrap: wrap; gap: 1.5em; margin-left: 0.25em;' }, [
                    E('div', {}, [
                        E('span', { 'style': 'font-weight: bold;' }, _('Latency: ')),
                        E('span', {}, latMs + ' ms'),
                        E('span', { 'style': 'color: #888;' }, ' (' + _('Baseline') + ': ' + blMs + ' ms)')
                    ]),
                    E('div', {}, [
                        E('span', { 'style': 'font-weight: bold;' }, _('Upload: ')),
                        E('span', {}, ulMbps + ' / ' + baseUlMbps + ' Mbit/s'),
                        E('span', { 'style': 'color: #888;' }, ' (' + (cur.ul_load_pct || 0) + '% ' + _('load') + ')')
                    ]),
                    E('div', {}, [
                        E('span', { 'style': 'font-weight: bold;' }, _('Download: ')),
                        E('span', {}, dlMbps + ' / ' + baseDlMbps + ' Mbit/s'),
                        E('span', { 'style': 'color: #888;' }, ' (' + (cur.dl_load_pct || 0) + '% ' + _('load') + ')')
                    ])
                ])
            ]);
        }
        
        if (rawHistory.length < 2) return;
        
        // Extract time-series from history
        // RAM: [ts, ul, dl, a_ul, a_dl, lat, bl, ulp, dlp]
        // Flash: [ts, avg_ul, avg_dl, avg_a_ul, avg_a_dl, avg_lat, max_lat, avg_bl, avg_ulp, avg_dlp]
        var latData = [], maxLatData = [], blData = [];
        var ulRateData = [], ulAchData = [], dlRateData = [], dlAchData = [];
        
        for (var i = 0; i < rawHistory.length; i++) {
            var h = rawHistory[i];
            var t = h[0];
            if (isFlash) {
                latData.push([t, h[5] / 10]);     // avg latency
                maxLatData.push([t, h[6] / 10]);   // max latency (spikes)
                blData.push([t, h[7] / 10]);       // baseline at index 7 in flash
                ulRateData.push([t, h[1]]);
                ulAchData.push([t, h[3]]);
                dlRateData.push([t, h[2]]);
                dlAchData.push([t, h[4]]);
            } else {
                latData.push([t, h[5] / 10]);   // tenths ms -> ms
                blData.push([t, h[6] / 10]);
                ulRateData.push([t, h[1]]);
                ulAchData.push([t, h[3]]);
                dlRateData.push([t, h[2]]);
                dlAchData.push([t, h[4]]);
            }
        }
        
        var decThrMs = cfg.decrease_threshold / 10;
        var incThrMs = cfg.increase_threshold / 10;
        var lastBl = blData.length > 0 ? blData[blData.length - 1][1] : 0;
        
        // Latency legend items (add max latency entry for flash data)
        var latLegendItems = [
            { label: _('Latency'), color: '#2196F3' },
            { label: _('Baseline'), color: '#4CAF50', dashed: true },
            { label: _('Dec. Threshold'), color: '#F44336', dashed: true },
            { label: _('Inc. Threshold'), color: '#FF9800', dashed: true }
        ];
        if (isFlash) latLegendItems.splice(1, 0, { label: _('Latency (max)'), color: 'rgba(244, 67, 54, 0.5)' });
        // Bandwidth legend items (shared for UL and DL)
        var bwLegendItems = [
            { label: _('Rate Limit'), color: '#2196F3' },
            { label: _('Throughput'), color: '#4CAF50' },
            { label: _('Base Rate'), color: '#9E9E9E', dashed: true },
            { label: _('Max'), color: '#F44336', dashed: true },
            { label: _('Min'), color: '#FF9800', dashed: true }
        ];
        
        // Populate DOM legends
        var latLegend = document.querySelector('.autorate-latency-legend');
        if (latLegend) this.buildChartLegend(latLegend, latLegendItems);
        var ulLegend = document.querySelector('.autorate-ul-legend');
        if (ulLegend) this.buildChartLegend(ulLegend, bwLegendItems);
        var dlLegend = document.querySelector('.autorate-dl-legend');
        if (dlLegend) this.buildChartLegend(dlLegend, bwLegendItems);
        
        // Draw latency chart (include max_lat spike series for flash data)
        var latCanvas = document.querySelector('.autorate-latency-canvas');
        if (latCanvas && latCanvas.clientWidth > 0) {
            var latSeries = [
                { data: latData, color: '#2196F3', width: 1.5 },
                { data: blData, color: '#4CAF50', dashed: true, width: 1 }
            ];
            if (isFlash && maxLatData.length > 0)
                latSeries.splice(0, 0, { data: maxLatData, color: 'rgba(244, 67, 54, 0.5)', width: 1, fill: 'rgba(244, 67, 54, 0.08)' });
            TimeSeriesChart.draw(latCanvas, {
                series: latSeries,
                hLines: [
                    { value: lastBl + decThrMs, color: '#F44336', dashed: true, width: 1 },
                    { value: lastBl + incThrMs, color: '#FF9800', dashed: true, width: 1 }
                ],
                yFmt: function(v) { return v.toFixed(1) + ' ms'; }
            });
        }
        
        // Draw upload bandwidth chart
        var ulCanvas = document.querySelector('.autorate-ul-canvas');
        if (ulCanvas && ulCanvas.clientWidth > 0) {
            TimeSeriesChart.draw(ulCanvas, {
                series: [
                    { data: ulAchData, color: '#4CAF50', fill: 'rgba(76, 175, 80, 0.15)', width: 1 },
                    { data: ulRateData, color: '#2196F3', width: 2 }
                ],
                hLines: [
                    { value: cfg.base_ul, color: '#9E9E9E', dashed: true, width: 1 },
                    { value: cfg.max_ul, color: '#F44336', dashed: true, width: 0.5 },
                    { value: cfg.min_ul, color: '#FF9800', dashed: true, width: 0.5 }
                ],
                yFmt: function(v) { return v >= 1000 ? (v / 1000).toFixed(1) + ' Mbit/s' : v + ' kbit/s'; }
            });
        }
        
        // Draw download bandwidth chart
        var dlCanvas = document.querySelector('.autorate-dl-canvas');
        if (dlCanvas && dlCanvas.clientWidth > 0) {
            TimeSeriesChart.draw(dlCanvas, {
                series: [
                    { data: dlAchData, color: '#4CAF50', fill: 'rgba(76, 175, 80, 0.15)', width: 1 },
                    { data: dlRateData, color: '#2196F3', width: 2 }
                ],
                hLines: [
                    { value: cfg.base_dl, color: '#9E9E9E', dashed: true, width: 1 },
                    { value: cfg.max_dl, color: '#F44336', dashed: true, width: 0.5 },
                    { value: cfg.min_dl, color: '#FF9800', dashed: true, width: 0.5 }
                ],
                yFmt: function(v) { return v >= 1000 ? (v / 1000).toFixed(1) + ' Mbit/s' : v + ' kbit/s'; }
            });
        }
    },
    
    handleSaveApply: null,
    handleSave: null,
    handleReset: null
});
