'use strict';
'require view';
'require poll';
'require rpc';
'require ui';
'require form';
'require uci';

var callQoSmateConntrackDSCP = rpc.declare({
    object: 'luci.qosmate',
    method: 'getConntrackDSCP',
    expect: { }
});

var dscpToString = function(mark) {
    var dscp = mark & 0x3F;
    var dscpMap = {
        0: 'CS0',
        8: 'CS1',
        10: 'AF11',
        12: 'AF12',
        14: 'AF13',
        16: 'CS2',
        18: 'AF21',
        20: 'AF22',
        22: 'AF23',
        24: 'CS3',
        26: 'AF31',
        28: 'AF32',
        30: 'AF33',
        32: 'CS4',
        34: 'AF41',
        36: 'AF42',
        38: 'AF43',
        40: 'CS5',
        46: 'EF',
        48: 'CS6',
        56: 'CS7'
    };
    return dscpMap[dscp] || dscp.toString();
};

var formatSize = function(bytes) {
    var sizes = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];
    if (bytes == 0) return '0 B';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

var convertToKbps = function(bytesPerSecond) {
    return (bytesPerSecond * 8 / 1000).toFixed(2) + ' Kbit/s';
};

return view.extend({
    pollInterval: 1,
    lastData: {},
    filter: '',
    sortColumn: 'bytes',
    sortDescending: true,
    connectionHistory: {},
    historyLength: 10,
    lastUpdateTime: 0,
    autoRefresh: true,
    refreshTimeout: null,
    hasPolledOnce: false,

    load: function() {
        return Promise.all([
            L.resolveDefault(callQoSmateConntrackDSCP(), { connections: {} }),
            uci.load('qosmate')
        ]);
    },

    render: function(data) {
        var view = this;
        var connections = [];
        var max_connections = 0;
        
        if (data[0] && data[0].connections) {
            connections = Object.values(data[0].connections);
            max_connections = data[0].max_connections || 0;
        }
        
        // Get current UCI value for dropdown
        var current_uci_limit = uci.get('qosmate', 'advanced', 'MAX_CONNECTIONS') || '0';

        var filterInput = E('input', {
            'type': 'text',
            'placeholder': _('Filter by: IP IP:Port Port Protocol DSCP'),
            'style': 'margin-bottom: 10px; width: 300px;',
            'value': view.filter
        });

        filterInput.addEventListener('input', function(ev) {
            view.filter = ev.target.value.toLowerCase();
            view.updateTable(connections);
        });

        // Create connection limit dropdown
        var limitSelect = E('select', {
            'id': 'connection_limit_select',
            'style': 'margin-left: 10px;',
            'change': function(ev) {
                var newLimit = parseInt(ev.target.value);
                
                applyConnectionLimit(newLimit);
            }
        }, [
            E('option', { 'value': '0' }, _('Unlimited')),
            E('option', { 'value': '10' }, _('10')),
            E('option', { 'value': '50' }, _('50')),
            E('option', { 'value': '100' }, _('100')),
            E('option', { 'value': '500' }, _('500')),
            E('option', { 'value': '1000' }, _('1000')),
            E('option', { 'value': '2000' }, _('2000')),
            E('option', { 'value': '5000' }, _('5000'))
        ]);

        // Set current value from UCI
        limitSelect.value = current_uci_limit;

        // Function to apply connection limit directly
        function applyConnectionLimit(newLimit) {
            return uci.load('qosmate').then(function() {
                uci.set('qosmate', 'advanced', 'MAX_CONNECTIONS', newLimit.toString());
                return uci.save();
            }).then(function() {
                return uci.apply();
            }).then(function() {
                uci.unload('qosmate');
                return uci.load('qosmate');
            }).then(function() {
                setTimeout(function() {
                    view.load().then(function(newData) {
                        var newConnections = [];
                        var newMaxConnections = 0;
                        if (newData[0] && newData[0].connections) {
                            newConnections = Object.values(newData[0].connections);
                            newMaxConnections = newData[0].max_connections || 0;
                        }
                        view.updateTable(newConnections);
                        view.updateLimitWarning(newMaxConnections, newConnections.length);
                        
                        // Update dropdown to reflect current value
                        limitSelect.value = newMaxConnections.toString();
                    });
                }, 1000);
            }).catch(function(error) {
                console.error('Error applying UCI changes:', error);
                // Show error but don't persist notification
                ui.addNotification(null, E('p', _('Failed to apply connection limit: %s').format(error.message || error)), 'error');
            });
        }

        // Create limit warning (initially hidden)
        var limitWarning = E('div', {
            'id': 'limit_warning',
            'style': 'background-color: #fff3cd; color: #856404; padding: 10px; margin: 10px 0; border-radius: 5px; display: none;'
        });

        view.updateLimitWarning = function(maxConnections, currentCount) {
            if (maxConnections > 0) {
                limitWarning.innerHTML = '⚠️ ' + _('Limited to %d connections. Some connections may not be shown.').format(maxConnections);
                limitWarning.style.display = 'block';
            } else {
                limitWarning.style.display = 'none';
            }
        };

        var table = E('table', { 'class': 'table cbi-section-table', 'id': 'qosmate_connections' }, [
            E('tr', { 'class': 'tr table-titles' }, [
                E('th', { 'class': 'th' }, E('a', { 'href': '#', 'click': this.sortTable.bind(this, 'protocol') }, [ _('Protocol'), this.createSortIndicator('protocol') ])),
                E('th', { 'class': 'th' }, E('a', { 'href': '#', 'click': this.sortTable.bind(this, 'src') }, [ _('Source'), this.createSortIndicator('src') ])),
                E('th', { 'class': 'th' }, E('a', { 'href': '#', 'click': this.sortTable.bind(this, 'dst') }, [ _('Destination'), this.createSortIndicator('dst') ])),
                E('th', { 'class': 'th' }, E('a', { 'href': '#', 'click': this.sortTable.bind(this, 'dscp') }, [ _('DSCP'), this.createSortIndicator('dscp') ])),
                E('th', { 'class': 'th' }, E('a', { 'href': '#', 'click': this.sortTable.bind(this, 'bytes') }, [ _('Bytes'), this.createSortIndicator('bytes') ])),
                E('th', { 'class': 'th' }, E('a', { 'href': '#', 'click': this.sortTable.bind(this, 'packets') }, [ _('Packets'), this.createSortIndicator('packets') ])),
                E('th', { 'class': 'th' }, E('a', { 'href': '#', 'click': this.sortTable.bind(this, 'avgPps') }, [ _('Avg PPS'), this.createSortIndicator('avgPps') ])),
                E('th', { 'class': 'th' }, E('a', { 'href': '#', 'click': this.sortTable.bind(this, 'maxPps') }, [ _('Max PPS'), this.createSortIndicator('maxPps') ])),
                E('th', { 'class': 'th' }, E('a', { 'href': '#', 'click': this.sortTable.bind(this, 'avgBps') }, [ _('Avg BPS'), this.createSortIndicator('avgBps') ]))
            ])
        ]);

        view.showErrorMessage = function(message) {
            // Clear table and show error message
            while (table.rows.length > 1) {
                table.deleteRow(1);
            }
            table.appendChild(E('tr', { 'class': 'tr' }, [
                E('td', { 'class': 'td', 'colspan': '9', 'style': 'text-align: center; color: red; padding: 20px;' }, 
                    message)
            ]));
        };

        view.updateTable = function(connections) {
            try {
                // Remove all rows except the header
                while (table.rows.length > 1) {
                    table.deleteRow(1);
                }
            
                var currentTime = Date.now() / 1000;
                var timeDiff = currentTime - view.lastUpdateTime;
                view.lastUpdateTime = currentTime;
            
                connections.forEach(function(conn) {
                    var key = conn.layer3 + conn.protocol + conn.src + conn.sport + conn.dst + conn.dport;
                    var lastConn = view.lastData[key];
                    
                    if (!view.connectionHistory[key]) {
                        view.connectionHistory[key] = {
                            inPpsHistory: [],
                            outPpsHistory: [],
                            inBpsHistory: [],
                            outBpsHistory: [],
                            lastInPackets: conn.in_packets,
                            lastOutPackets: conn.out_packets,
                            lastInBytes: conn.in_bytes,
                            lastOutBytes: conn.out_bytes,
                            lastTimestamp: currentTime
                        };
                    }
            
                    var history = view.connectionHistory[key];
                    var instantInPps = 0, instantOutPps = 0, instantInBps = 0, instantOutBps = 0;
            
                    if (lastConn && timeDiff > 0) {
                        var inPacketDiff = Math.max(0, conn.in_packets - history.lastInPackets);
                        var outPacketDiff = Math.max(0, conn.out_packets - history.lastOutPackets);
                        var inBytesDiff = Math.max(0, conn.in_bytes - history.lastInBytes);
                        var outBytesDiff = Math.max(0, conn.out_bytes - history.lastOutBytes);
                        
                        instantInPps = Math.round(inPacketDiff / timeDiff);
                        instantOutPps = Math.round(outPacketDiff / timeDiff);
                        instantInBps = Math.round(inBytesDiff / timeDiff);
                        instantOutBps = Math.round(outBytesDiff / timeDiff);
            
                        history.inPpsHistory.push(instantInPps);
                        history.outPpsHistory.push(instantOutPps);
                        history.inBpsHistory.push(instantInBps);
                        history.outBpsHistory.push(instantOutBps);
            
                        if (history.inPpsHistory.length > view.historyLength) {
                            history.inPpsHistory.shift();
                            history.outPpsHistory.shift();
                            history.inBpsHistory.shift();
                            history.outBpsHistory.shift();
                        }
                    }
            
                    history.lastInPackets = conn.in_packets;
                    history.lastOutPackets = conn.out_packets;
                    history.lastInBytes = conn.in_bytes;
                    history.lastOutBytes = conn.out_bytes;
                    history.lastTimestamp = currentTime;
            
                    var avgInPps = Math.round(history.inPpsHistory.reduce((a, b) => a + b, 0) / history.inPpsHistory.length) || 0;
                    var avgOutPps = Math.round(history.outPpsHistory.reduce((a, b) => a + b, 0) / history.outPpsHistory.length) || 0;
                    var avgInBps = Math.round(history.inBpsHistory.reduce((a, b) => a + b, 0) / history.inBpsHistory.length) || 0;
                    var avgOutBps = Math.round(history.outBpsHistory.reduce((a, b) => a + b, 0) / history.outBpsHistory.length) || 0;
                    var maxInPps = Math.max(...history.inPpsHistory, 0);
                    var maxOutPps = Math.max(...history.outPpsHistory, 0);
            
                    conn.avgInPps = avgInPps;
                    conn.avgOutPps = avgOutPps;
                    conn.maxInPps = maxInPps;
                    conn.maxOutPps = maxOutPps;
                    conn.avgInBps = avgInBps;
                    conn.avgOutBps = avgOutBps;
                    view.lastData[key] = conn;
                });
            
                connections.sort(view.sortFunction.bind(view));
            
                connections.forEach(function(conn) {
                    if (view.filter) {
                        // Split the filter string by whitespace to get individual tokens
                        var tokens = view.filter.split(/\s+/).map(function(token) {
                            return token.trim().toLowerCase();
                        });

                        // Collect the relevant fields for matching
                        var dscpString = dscpToString(conn.dscp);
                        var srcFull = conn.src + (conn.sport !== "-" ? ':' + conn.sport : '');
                        var dstFull = conn.dst + (conn.dport !== "-" ? ':' + conn.dport : '');
                        var fields = [
                            conn.protocol.toLowerCase(),
                            srcFull.toLowerCase(),
                            dstFull.toLowerCase(),
                            dscpString.toLowerCase()
                        ];

                        // Each token must match at least one field (AND logic across tokens, OR logic across fields)
                        var pass = tokens.every(function(t) {
                            return fields.some(function(field) {
                                return field.includes(t);
                            });
                        });
                        if (!pass) {
                            return;
                        }
                    }
                    var srcFull = conn.src + ':' + (conn.sport || '-');
                    var dstFull = conn.dst + ':' + (conn.dport || '-');
                    var dscpString = dscpToString(conn.dscp);
                    
                    table.appendChild(E('tr', { 'class': 'tr' }, [
                        E('td', { 'class': 'td' }, conn.protocol.toUpperCase()),
                        E('td', { 'class': 'td' }, srcFull),
                        E('td', { 'class': 'td' }, dstFull),
                        E('td', { 'class': 'td' }, dscpString),
                        E('td', { 'class': 'td' }, 
                            E('div', {}, [
                                E('span', {}, _('In: ') + formatSize(conn.in_bytes)),
                                E('br'),
                                E('span', {}, _('Out: ') + formatSize(conn.out_bytes))
                            ])
                        ),
                        E('td', { 'class': 'td' }, 
                            E('div', {}, [
                                E('span', {}, _('In: ') + conn.in_packets),
                                E('br'),
                                E('span', {}, _('Out: ') + conn.out_packets)
                            ])
                        ),
                        E('td', { 'class': 'td' }, 
                            E('div', {}, [
                                E('span', {}, _('In: ') + conn.avgInPps),
                                E('br'),
                                E('span', {}, _('Out: ') + conn.avgOutPps)
                            ])
                        ),
                        E('td', { 'class': 'td' }, 
                            E('div', {}, [
                                E('span', {}, _('In: ') + conn.maxInPps),
                                E('br'),
                                E('span', {}, _('Out: ') + conn.maxOutPps)
                            ])
                        ),
                        E('td', { 'class': 'td' }, 
                            E('div', {}, [
                                E('span', {}, _('In: ') + convertToKbps(conn.avgInBps)),
                                E('br'),
                                E('span', {}, _('Out: ') + convertToKbps(conn.avgOutBps))
                            ])
                        )
                    ]));
                });
                view.updateSortIndicators();
                
                // Update connection count display
                var connectionCountDisplay = document.getElementById('connection_count_display');
                if (connectionCountDisplay) {
                    connectionCountDisplay.textContent = _('Connections: ') + connections.length;
                }
            } catch (e) {
                console.error('Error updating table:', e);
                // Show error message instead of crashing
                while (table.rows.length > 1) {
                    table.deleteRow(1);
                }
                table.appendChild(E('tr', { 'class': 'tr' }, [
                    E('td', { 'class': 'td', 'colspan': '9', 'style': 'text-align: center; color: red;' }, 
                        _('Error displaying connections. System may be overloaded.'))
                ]));
                
                // Update connection count display for error case
                var connectionCountDisplay = document.getElementById('connection_count_display');
                if (connectionCountDisplay) {
                    connectionCountDisplay.textContent = _('Connections: Error');
                }
            }
        };

        view.updateTable(connections);
        view.updateLimitWarning(max_connections, connections.length);
        this.updateSortIndicators();

        // Trigger the adaptive polling:
        adaptivePoll(view);

        var style = E('style', {}, `
            .sort-indicator {
                display: inline-block;
                width: 0;
                height: 0;
                margin-left: 5px;
                vertical-align: middle;
            }
            .table-wrapper {
                overflow-x: auto;
                max-width: 100%;
            }
            .cbi-section-table {
                min-width: 100%;
                font-size: 0.8rem;
            }
            .cbi-section-table td, .cbi-section-table th {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 150px;
                padding: 0.3rem;
            }
            @media screen and (max-width: 600px) {
                .cbi-section-table td:nth-child(5),
                .cbi-section-table th:nth-child(5),
                .cbi-section-table td:nth-child(6),
                .cbi-section-table th:nth-child(6) {
                    display: none;
                }
            }
            /* Styles for different zoom levels */
            .cbi-section-table.zoom-100 { font-size: 1rem !important; }
            .cbi-section-table.zoom-90 { font-size: 0.9rem !important; }
            .cbi-section-table.zoom-80 { font-size: 0.8rem !important; }
            .cbi-section-table.zoom-70 { font-size: 0.7rem !important; }
            .cbi-section-table.zoom-60 { font-size: 0.6rem !important; }
            .cbi-section-table.zoom-50 { font-size: 0.5rem !important; }            

            /* Adjust padding for zoomed states */
            .cbi-section-table[class*="zoom-"] td,
            .cbi-section-table[class*="zoom-"] th {
                padding: 0.2rem !important;
            }

            /* Style for the zoom select */
            .zoom-select {
                margin-left: 10px;
                padding: 2px 5px;
            }
        `);

        // Create zoom select
        var zoomSelect = E('select', {
            'class': 'zoom-select',
            'change': function(ev) {
                var table = document.getElementById('qosmate_connections');
                // Remove all zoom classes
                table.classList.remove('zoom-100', 'zoom-90', 'zoom-80', 'zoom-70', 'zoom-60', 'zoom-50');
                // Add selected zoom class
                table.classList.add(ev.target.value);
            }
        }, [
            E('option', { 'value': 'zoom-100' }, _('100%')),
            E('option', { 'value': 'zoom-90' }, _('90%')),
            E('option', { 'value': 'zoom-80' }, _('80%')),
            E('option', { 'value': 'zoom-70' }, _('70%')),
            E('option', { 'value': 'zoom-60' }, _('60%')),
            E('option', { 'value': 'zoom-50' }, _('50%'))            
        ]);        
        
        // Display the current polling interval.
        var pollIntervalDisplay = E('span', {
            'id': 'poll_interval_display',
            'style': 'margin-left: 10px;'
        }, _('Polling Interval: ') + this.pollInterval + ' s');
        
        // Display connection count
        var connectionCountDisplay = E('span', {
            'id': 'connection_count_display',
            'style': 'float: right; margin-left: 10px; font-weight: bold; line-height: 2.5em;'
        }, _('Connections: 0'));

        // Include limit elements in the top container
        return E('div', { 'class': 'cbi-map' }, [
            style,
            E('h2', _('QoSmate Connections')),
            limitWarning,
            E('div', { 'style': 'margin-bottom: 10px;' }, [
                filterInput,
                ' ',
                E('span', _('Max Connections:')),
                limitSelect,
                ' ',
                E('span', _('Zoom:')),
                zoomSelect,
                pollIntervalDisplay,
                connectionCountDisplay,
                ' ',
                E('button', {
                    'type': 'button',
                    'style': 'margin-left: 10px;',
                    'click': function(ev) {
                        if (view.autoRefresh) {
                            clearTimeout(view.refreshTimeout);
                            view.autoRefresh = false;
                            this.textContent = _('Resume');
                        } else {
                            view.autoRefresh = true;
                            this.textContent = _('Pause');
                            adaptivePoll(view);
                        }
                    }
                }, _('Pause'))
            ]),
            E('div', { 'class': 'cbi-section' }, [
                E('div', { 'class': 'cbi-section-node' }, [
                    table
                ])
            ])
        ]);
    },

    sortTable: function(column, ev) {
        ev.preventDefault();
        if (this.sortColumn === column) {
            this.sortDescending = !this.sortDescending;
        } else {
            this.sortColumn = column;
            this.sortDescending = true;
        }

        // Defer sorting + table update to reduce blocking in click event handler
        var view = this;
        setTimeout(function() {
            var connections = Object.values(view.lastData);
            view.updateTable(connections);
            view.updateSortIndicators();
        }, 0);
    },

    sortFunction: function(a, b) {
        var aValue, bValue;
        
        switch(this.sortColumn) {
            case 'bytes':
                aValue = (a.in_bytes || 0) + (a.out_bytes || 0);
                bValue = (b.in_bytes || 0) + (b.out_bytes || 0);
                break;
            case 'packets':
                aValue = (a.in_packets || 0) + (a.out_packets || 0);
                bValue = (b.in_packets || 0) + (b.out_packets || 0);
                break;
            case 'avgPps':
                aValue = (a.avgInPps || 0) + (a.avgOutPps || 0);
                bValue = (b.avgInPps || 0) + (b.avgOutPps || 0);
                break;
            case 'maxPps':
                aValue = Math.max(a.maxInPps || 0, a.maxOutPps || 0);
                bValue = Math.max(b.maxInPps || 0, b.maxOutPps || 0);
                break;
            case 'avgBps':
                aValue = (a.avgInBps || 0) + (a.avgOutBps || 0);
                bValue = (b.avgInBps || 0) + (b.avgOutBps || 0);
                break;
            default:
                aValue = a[this.sortColumn];
                bValue = b[this.sortColumn];
        }
        
        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();
    
        if (aValue < bValue) return this.sortDescending ? 1 : -1;
        if (aValue > bValue) return this.sortDescending ? -1 : 1;
        return 0;
    },

    createSortIndicator: function(column) {
        return E('span', { 'class': 'sort-indicator', 'data-column': column }, '');
    },

    updateSortIndicators: function() {
        var indicators = document.querySelectorAll('.sort-indicator');
        indicators.forEach(function(indicator) {
            if (indicator.dataset.column === this.sortColumn) {
                indicator.textContent = this.sortDescending ? ' ▼' : ' ▲';
            } else {
                indicator.textContent = '';
            }
        }.bind(this));
    },

    handleSaveApply: null,
    handleSave: null,
    handleReset: null
});

// Adaptive polling function that measures response time and adjusts the polling interval.
function adaptivePoll(view) {
    if (!view.autoRefresh) {
        return; // Do not schedule a new poll if auto-refresh is paused
    }
    var startTime = Date.now();
    L.resolveDefault(callQoSmateConntrackDSCP(), { connections: {} }).then(function(result) {
        var responseTime = Date.now() - startTime;
        
        // Adjust the polling interval based on response time.        
        if (!view.hasPolledOnce) {
            view.pollInterval = 3;
            view.hasPolledOnce = true;
        } else if (responseTime > 2000) { // If response time exceeds 2000ms, increase interval.
            view.pollInterval = Math.min(view.pollInterval + 1, 10); // Max poll interval of 10 seconds.
        } else if (responseTime < 1000 && view.pollInterval > 1) { // If response time is less than 1000ms and poll interval is greater than 1 second, decrease interval.
            view.pollInterval = Math.max(view.pollInterval - 1, 1); // Min poll interval of 1 second.
        }
        // Update the polling interval display in the UI.
        var pollDisplay = document.getElementById('poll_interval_display');
        if (pollDisplay) {
            pollDisplay.textContent = _('Polling Interval: ') + view.pollInterval + ' s';
        }
        
        if (result && result.connections) {
            var connections = Object.values(result.connections);
            var max_connections = result.max_connections || 0;
            
            view.updateTable(connections);
            view.updateLimitWarning(max_connections, connections.length);
        } else {
            console.warn('Invalid data received:', result);
            // Show error message to user
            view.showErrorMessage('No connection data received');
        }
    }).catch(function(error) {
        console.error('Polling error:', error);
        // Show error message to user instead of keeping old data
        view.showErrorMessage('Connection error - check network');
    }).finally(function() {
        // Schedule the next poll only if auto-refresh is not paused
        if (view.autoRefresh) {
            view.refreshTimeout = setTimeout(function() {
                adaptivePoll(view);
            }, view.pollInterval * 1000);
        }
    });
}
