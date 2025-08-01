'use strict';
'require view';
'require poll';
'require rpc';
'require ui';
'require form';
'require dom';
'require fs';

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

// Standard chart colors
var chartColors = ['#4CAF50', '#2196F3', '#FFC107', '#F44336', '#9C27B0', '#795548', '#FF9800', '#607D8B'];

// Main view
return view.extend({
    pollInterval: 5,
    lastData: null,
    charts: {},
    pollHandler: null,
    activeTabIndex: 0, // Track the active tab

    load: function() {
        return Promise.all([
            callQoSmateStats(),
            callQoSmateHistoricalStats(),
            callQoSmateRrdData()
        ]);
    },

    // Helper function to create a poll handler with consistent behavior
    createPollFunction: function() {
        var view = this;
        return function() {
            return Promise.all([
                callQoSmateStats(),
                callQoSmateHistoricalStats(),
                callQoSmateRrdData()
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
        
        view.lastData = qosStats;
        
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
            var tabContents = [
                E('div', { 'style': 'padding: 5px 0;' }), 
                E('div', { 'style': 'padding: 5px 0; display: none;' })
            ];
            
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
                            tabContents.forEach(function(content, i) {
                                content.style.display = i === view.activeTabIndex ? 'block' : 'none';
                            });
                        }
                    }, name)
                ]);
                
                tabButtons.appendChild(button);
            });
            
            // Set initial display state based on the active tab index
            tabContents.forEach(function(content, i) {
                content.style.display = i === view.activeTabIndex ? 'block' : 'none';
            });
            
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
    
    handleSaveApply: null,
    handleSave: null,
    handleReset: null
});
