'use strict';
'require view';
'require ui';
'require uci';
'require form';
'require rpc';
'require fs';
'require poll';
'require tools.widgets as widgets';

var callInitAction = rpc.declare({
    object: 'luci',
    method: 'setInitAction',
    params: ['name', 'action'],
    expect: { result: false }
});

var callRuleCounters = rpc.declare({
    object: 'luci.qosmate_stats',
    method: 'getRuleCounters',
    expect: { rule_counters: [] }
});

// IPv6 suffix matching validation helpers
function isIPv6SuffixFormat(value) {
    // Format: ::suffix/::mask - allow empty suffix/mask with * instead of +
    return /^::([0-9a-fA-F:]*)\/::([0-9a-fA-F:]*)$/.test(value);
}

function validateIPv6Part(part) {
    // Special case: empty part is valid (for ::/::mask)
    if (part === '') return true;
    
    // Check for multiple consecutive colons (:: can only appear once)
    if (/:{3,}/.test(part)) return false;
    if (/[^0-9a-fA-F:]/.test(part)) return false; // Only hex and colons allowed
    
    // Check if :: appears more than once
    var doubleColonCount = (part.match(/::/g) || []).length;
    if (doubleColonCount > 1) return false;
    
    // For suffix matching, we already have :: at the start, so no more :: allowed
    if (doubleColonCount > 0) return false;
    
    // Split by colons and check each segment
    var segments = part.split(':');
    
    // Can't have more than 8 segments (for a full IPv6) 
    if (segments.length > 8) return false;
    
    for (var i = 0; i < segments.length; i++) {
        var seg = segments[i];
        // Each segment must be 0-4 hex digits
        if (!/^[0-9a-fA-F]{0,4}$/.test(seg)) {
            return false;
        }
    }
    
    return true;
}

function parseIPv6Suffix(value) {
    const match = value.match(/^::([0-9a-fA-F:]*)\/::([0-9a-fA-F:]*)$/);
    if (!match) return null;
    
    // Validate both parts
    if (!validateIPv6Part(match[1]) || !validateIPv6Part(match[2])) {
        return null;
    }
    
    return {
        suffix: match[1],
        mask: match[2],
        isSuffixMatch: true
    };
}

// Common IP validation function for src_ip and dest_ip fields
function validateIPField(section_id, value) {
    if (!value || value.length === 0) {
        return true;
    }
    
    var values = Array.isArray(value) ? value : value.split(/\s+/);
    var ipCidrRegex = /^(?:(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)(?:\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)){3})(?:\/(?:[0-9]|[1-2]\d|3[0-2]))?|(?:(?:[A-Fa-f0-9]{1,4}:){7}[A-Fa-f0-9]{1,4}|(?:[A-Fa-f0-9]{1,4}:){1,7}:|(?:[A-Fa-f0-9]{1,4}:){1,6}:[A-Fa-f0-9]{1,4}|(?:[A-Fa-f0-9]{1,4}:){1,5}(?::[A-Fa-f0-9]{1,4}){1,2}|(?:[A-Fa-f0-9]{1,4}:){1,4}(?::[A-Fa-f0-9]{1,4}){1,3}|(?:[A-Fa-f0-9]{1,4}:){1,3}(?::[A-Fa-f0-9]{1,4}){1,4}|(?:[A-Fa-f0-9]{1,4}:){1,2}(?::[A-Fa-f0-9]{1,4}){1,5}|[A-Fa-f0-9]{1,4}:(?:(?::[A-Fa-f0-9]{1,4}){1,6})|:(?:(?::[A-Fa-f0-9]{1,4}){1,7}|:))(?:\/(?:[0-9]|[1-9]\d|1[0-1]\d|12[0-8]))?)$/;
    
    // Check for mixed IPv4/IPv6 within this field
    var hasIPv4 = false;
    var hasIPv6 = false;
    
    for (var i = 0; i < values.length; i++) {
        var v = values[i].replace(/^!(?!=)/, '!=');
        
        // Check for set reference
        if (v.startsWith('@') || v.startsWith('!=@')) {
            var setName = v.replace(/^(!=)?@/, '');
            if (!/^[a-zA-Z0-9_]+$/.test(setName)) {
                return _('Invalid set name format. Must start with @ followed by letters, numbers, or underscore');
            }
            continue; // Don't check IP version for sets
        } 
        
        // Strip != prefix for validation
        var isNegated = v.startsWith('!=');
        var valueToValidate = isNegated ? v.substring(2) : v;
        
        // Check for IPv6 suffix format
        if (isIPv6SuffixFormat(valueToValidate)) {
            var suffixData = parseIPv6Suffix(valueToValidate);
            if (!suffixData) {
                return _('Invalid IPv6 suffix format. Use ::suffix/::mask with valid IPv6 segments (e.g. ::1234:5678/::ffff:ffff)');
            }
            hasIPv6 = true;
        }
        else {
            if (!ipCidrRegex.test(valueToValidate)) {
                return _('Invalid IP address or CIDR format: ') + v;
            }
            // Detect IP version
            if (valueToValidate.indexOf(':') !== -1) {
                hasIPv6 = true;
            } else {
                hasIPv4 = true;
            }
        }
    }
    
    return true;
}

return view.extend({
    // Rule counter polling
    counterData: {},
    pollHandler: null,
    pollInterval: 8,
    
    load: function() {
        this.counterData = {};
        return this.super && this.super('load') || Promise.resolve();
    },
    
    // Create polling function for rule counter updates
    createPollFunction: function() {
        var view = this;
        return function() {

            return callRuleCounters().then(function(result) {

                if (result && Array.isArray(result)) {

                    view.updateCounterData(result);
                } else {

                }
                return result;
            }).catch(function(err) {

                return null;
            });
        };
    },
    
    // Start counter polling
    startCounterPolling: function() {
        if (this.pollHandler) {
            return; // Already polling
        }
        
        var view = this;
        var startPollingWhenReady = function() {
            var luciTable = document.querySelector('.cbi-section-table');

            
            if (luciTable) {

                view.pollHandler = view.createPollFunction();
                poll.add(view.pollHandler, view.pollInterval);
                view.pollHandler(); // Initial call
            } else {

                setTimeout(startPollingWhenReady, 1000); // Retry after 1 second
            }
        };
        
        startPollingWhenReady();
    },
    
    // Stop counter polling
    stopCounterPolling: function() {
        if (this.pollHandler) {
            poll.remove(this.pollHandler);
            this.pollHandler = null;

        }
    },
    
    // Update counter data and refresh UI
    updateCounterData: function(ruleCounters) {
        var view = this;
        view.counterData = {};
        
        if (Array.isArray(ruleCounters)) {
            ruleCounters.forEach(function(rule) {
                view.counterData[rule.rule_name] = {
                    packets: rule.total_packets || 0,
                    bytes: rule.total_bytes || 0,
                    ipv4_packets: rule.ipv4_packets || 0,
                    ipv6_packets: rule.ipv6_packets || 0
                };
            });
            view.updateActivityColumnInTable();
        }
    },
    
    // Update Activity column in LuCI table
    updateActivityColumnInTable: function() {
        var view = this;
        setTimeout(function() {
            // Find LuCI table and Activity column
            var table = document.querySelector('.cbi-section-table');
            if (!table) {

                return;
            }
            

            var headerRow = table.querySelector('tr');
            var activityColumnIndex = -1;
            
            if (headerRow) {
                var headers = headerRow.querySelectorAll('th');
                headers.forEach(function(th, index) {
                    if (th.textContent.includes('Activity')) {
                        activityColumnIndex = index;

                    }
                });
            }
            
            if (activityColumnIndex >= 0) {
                var dataRows = table.querySelectorAll('tr[data-sid]');

                
                dataRows.forEach(function(row) {
                    var sectionId = row.getAttribute('data-sid');
                    var cells = row.querySelectorAll('td');
                    if (cells[activityColumnIndex] && sectionId) {
                        var ruleName = uci.get('qosmate', sectionId, 'name');
                        var counterEnabled = uci.get('qosmate', sectionId, 'counter');
                        

                        
                        var activityCell = cells[activityColumnIndex];
                        var content = view.formatCounterDisplay(ruleName, counterEnabled);
                        activityCell.innerHTML = '';
                        activityCell.appendChild(content);
                    }
                });
            }
        }, 200); // Give LuCI time to render
    },
    
    // Format counter display
    formatCounterDisplay: function(ruleName, counterEnabled) {
        if (counterEnabled !== '1') {
            return E('span', {'style': 'color: #999; font-size: 0.9em;'}, '-');
        }
        
        var stats = this.counterData[ruleName];
        if (!stats || stats.packets === 0) {
            return E('span', {'style': 'color: #999; font-size: 0.9em;'}, _('no activity'));
        }
        
        var totalPackets = stats.packets;
        var displayText = '';
        
        // Format packet count for readability
        if (totalPackets >= 1000000) {
            displayText = (totalPackets / 1000000).toFixed(1) + 'M pkts';
        } else if (totalPackets >= 1000) {
            displayText = (totalPackets / 1000).toFixed(1) + 'K pkts';
        } else {
            displayText = totalPackets + ' pkts';
        }
        
        // Add IPv4/IPv6 breakdown if both are present
        var breakdown = '';
        if (stats.ipv4_packets > 0 && stats.ipv6_packets > 0) {
            breakdown = ` (v4:${stats.ipv4_packets}, v6:${stats.ipv6_packets})`;
        }
        
        return E('span', {
            'style': 'color: #0a84ff; font-size: 0.9em; font-weight: 500;',
            'title': `Total: ${totalPackets} packets, ${(stats.bytes / 1024).toFixed(1)} KB${breakdown}`
        }, displayText);
    },

    handleSaveApply: function(ev) {
        return this.handleSave(ev)
            .then(() => ui.changes.apply())
            .then(() => uci.load('qosmate'))
            .then(() => uci.get_first('qosmate', 'global', 'enabled'))
            .then(enabled => {
                if (enabled === '0') {
                    return fs.exec_direct('/etc/init.d/qosmate', ['stop']);
                } else {
                    return fs.exec_direct('/etc/init.d/qosmate', ['restart']);
                }
            })
            .then(() => {
                ui.hideModal();
                window.location.reload();
            })
            .catch(err => {
                ui.hideModal();
                ui.addNotification(null, E('p', _('Failed to save settings or update QoSmate service: ') + err.message));
            });
    },

    render: function() {
        var m, s, o;

        m = new form.Map('qosmate', _('QoSmate Rules'),
            _('Configure QoS rules for marking packets with DSCP values.'));

        s = m.section(form.GridSection, 'rule', _('Rules'));
        s.addremove = true;
        s.anonymous = true;
        s.sortable  = true;

        s.tab('general', _('General Settings'));
        s.tab('mapping', _('DSCP Mapping'));

        // Add mapping information to the description
        s.description = E('div', { 'class': 'cbi-section-descr' }, [
            E('h4', _('HFSC Mapping:')),
            E('table', { 'class': 'table' }, [
                E('tr', { 'class': 'tr' }, [
                    E('td', { 'class': 'td left', 'width': '25%' }, _('High Priority [Realtime] (1:11)')),
                    E('td', { 'class': 'td left' }, 'EF, CS5, CS6, CS7')
                ]),
                E('tr', { 'class': 'tr' }, [
                    E('td', { 'class': 'td left' }, _('Fast Non-Realtime (1:12)')),
                    E('td', { 'class': 'td left' }, 'CS4, AF41, AF42')
                ]),
                E('tr', { 'class': 'tr' }, [
                    E('td', { 'class': 'td left' }, _('Normal (1:13)')),
                    E('td', { 'class': 'td left' }, 'CS0')
                ]),
                E('tr', { 'class': 'tr' }, [
                    E('td', { 'class': 'td left' }, _('Low Priority (1:14)')),
                    E('td', { 'class': 'td left' }, 'CS2, AF11')
                ]),
                E('tr', { 'class': 'tr' }, [
                    E('td', { 'class': 'td left' }, _('Bulk (1:15)')),
                    E('td', { 'class': 'td left' }, 'CS1')
                ])
            ]),
            E('p', { 'style': 'font-size:0.9em; margin: -5px 0 15px 5px;' }, [
                E('strong', _('Hybrid Note:')), ' ', 
                _('Uses Realtime (1:11) & Bulk (1:15) classes with their dscp values from HFSC. All other traffic is handled by a single CAKE class (1:13).')
            ]),
            E('h4', _('CAKE Mapping (diffserv4):')),
            E('table', { 'class': 'table' }, [
                E('tr', { 'class': 'tr' }, [
                    E('td', { 'class': 'td left', 'width': '25%' }, _('Voice (Highest Priority)')),
                    E('td', { 'class': 'td left' }, 'CS7, CS6, EF, VA, CS5, CS4')
                ]),
                E('tr', { 'class': 'tr' }, [
                    E('td', { 'class': 'td left' }, _('Video')),
                    E('td', { 'class': 'td left' }, 'CS3, AF4x, AF3x, AF2x, CS2, TOS1')
                ]),
                E('tr', { 'class': 'tr' }, [
                    E('td', { 'class': 'td left' }, _('Best Effort')),
                    E('td', { 'class': 'td left' }, 'CS0, AF1x, TOS0')
                ]),
                E('tr', { 'class': 'tr' }, [
                    E('td', { 'class': 'td left' }, _('Bulk (Lowest Priority)')),
                    E('td', { 'class': 'td left' }, 'CS1, LE')
                ])
            ])
        ]);

        o = s.taboption('general', form.Value, 'name', _('Name'));
        o.rmempty = false;

        o = s.option(form.DummyValue, 'proto', _('Protocol'));
        o.cfgvalue = function(section_id) {
            var proto = uci.get('qosmate', section_id, 'proto');
            if (Array.isArray(proto)) {
                return proto.map(function(p) { 
                    if (p === 'ipv6-icmp') return 'ICMPv6';
                    return p.toUpperCase(); 
                }).join(', ');
            } else if (typeof proto === 'string') {
                if (proto === 'ipv6-icmp') return 'ICMPv6';
                return proto.toUpperCase();
            }
            return _('Any');
        };
              
        o = s.taboption('general', form.MultiValue, 'proto', _('Protocol'));
        o.value('tcp', _('TCP'));
        o.value('udp', _('UDP'));
        o.value('icmp', _('ICMP'));
        o.value('ipv6-icmp', _('ICMPv6'));
        o.rmempty = true;
        o.default = 'tcp udp';
        o.modalonly = true;
        
        o.cfgvalue = function(section_id) {
            var value = uci.get('qosmate', section_id, 'proto');
            if (Array.isArray(value)) {
                return value;
            } else if (typeof value === 'string') {
                return value.split(/\s+/);
            }
            return [];
        };
        
        o.write = function(section_id, value) {
            if (value && value.length) {
                uci.set('qosmate', section_id, 'proto', value.join(' '));
            } else {
                uci.unset('qosmate', section_id, 'proto');
            }
        };
        
        o.validate = function(section_id, value) {
            if (!value || value.length === 0) {
                return true;
            }
            
            var valid = ['tcp', 'udp', 'icmp', 'ipv6-icmp'];
            var toValidate = Array.isArray(value) ? value : value.split(/\s+/);
            
            for (var i = 0; i < toValidate.length; i++) {
                if (valid.indexOf(toValidate[i]) === -1) {
                    return _('Invalid protocol: %s').format(toValidate[i]);
                }
            }
            return true;
        };
        
        o.remove = function(section_id) {
            uci.unset('qosmate', section_id, 'proto');
        };

        o = s.taboption('general', form.DynamicList, 'src_ip', _('Source IP'));
        o.datatype = 'string';
        o.placeholder = _('IP address, @setname or ::suffix/::mask');
        o.rmempty = true;
        o.validate = function(section_id, value) {
            return validateIPField(section_id, value);
        };
        o.write = function(section_id, formvalue) {
            var values = formvalue.map(function(v) {
                return v.replace(/^!(?!=)/, '!=');
            });
            return this.super('write', [section_id, values]);
        };
        
        o = s.taboption('general', form.DynamicList, 'src_port', _('Source port'));
		o.datatype = 'list(neg(portrange))';
        o.placeholder = _('any');
        o.rmempty = true;
        o.write = function(section_id, formvalue) {
            var values;
            // Handle array and string inputs
            if (Array.isArray(formvalue)) {
                values = formvalue.map(function(v) {
                    // Also handle if individual values contain spaces
                    if (typeof v === 'string' && v.indexOf(' ') !== -1) {
                        return v.split(/\s+/).map(function(part) {
                            return part.replace(/^!(?!=)/, '!=');
                        }).join(' ');
                    }
                    return typeof v === 'string' ? v.replace(/^!(?!=)/, '!=') : v;
                });
            } else if (typeof formvalue === 'string') {
                // If it's a string, split by spaces and process each part
                values = formvalue.split(/\s+/).map(function(v) {
                    return v.replace(/^!(?!=)/, '!=');
                });
            } else {
                values = formvalue;
            }
            return this.super('write', [section_id, values]);
        };
        
        o = s.taboption('general', form.DynamicList, 'dest_ip', _('Destination IP'));
        o.datatype = 'string';
        o.placeholder = _('IP address, @setname or ::suffix/::mask');
        o.rmempty = true;
        o.validate = function(section_id, value) {
            return validateIPField(section_id, value);
        };
        o.write = function(section_id, formvalue) {
            var values = formvalue.map(function(v) {
                return v.replace(/^!(?!=)/, '!=');
            });
            return this.super('write', [section_id, values]);
        };
        
        o = s.taboption('general', form.DynamicList, 'dest_port', _('Destination port'));
		o.datatype = 'list(neg(portrange))';
        o.placeholder = _('any');
        o.rmempty = true;
        o.write = function(section_id, formvalue) {
            var values;
            // Handle array and string inputs
            if (Array.isArray(formvalue)) {
                values = formvalue.map(function(v) {
                    // Also handle if individual values contain spaces
                    if (typeof v === 'string' && v.indexOf(' ') !== -1) {
                        return v.split(/\s+/).map(function(part) {
                            return part.replace(/^!(?!=)/, '!=');
                        }).join(' ');
                    }
                    return typeof v === 'string' ? v.replace(/^!(?!=)/, '!=') : v;
                });
            } else if (typeof formvalue === 'string') {
                // If it's a string, split by spaces and process each part
                values = formvalue.split(/\s+/).map(function(v) {
                    return v.replace(/^!(?!=)/, '!=');
                });
            } else {
                values = formvalue;
            }
            return this.super('write', [section_id, values]);
        };

        o = s.taboption('general', form.ListValue, 'class', _('DSCP Class'));
        o.value('ef', _('EF - Expedited Forwarding (46)'));
        o.value('cs5', _('CS5 (40)'));
        o.value('cs6', _('CS6 (48)'));
        o.value('cs7', _('CS7 (56)'));
        o.value('cs4', _('CS4 (32)'));
        o.value('af41', _('AF41 (34)'));
        o.value('af42', _('AF42 (36)'));
        o.value('af11', _('AF11 (10)'));
        o.value('cs2', _('CS2 (16)'));
        o.value('cs1', _('CS1 (8)'));
        o.value('cs0', _('CS0 - Best Effort (0)'));
        o.rmempty = false;

        o = s.taboption('general', form.Flag, 'counter', _('Enable counter'));
        o.rmempty = false;

        o = s.taboption('general', form.Flag, 'trace', _('Enable trace'));
        o.rmempty = false;
        o.default = '0';  // Default to disabled
        o.description = _('Debug only');

        o = s.taboption('general', form.Flag, 'enabled', _('Enable'));
        o.rmempty = false;
        o.editable = true;
        o.default = '1';  // Set default value to enabled
        o.write = function(section_id, formvalue) {
            // Always write the value, whether it's '0' or '1'
            uci.set('qosmate', section_id, 'enabled', formvalue);
        };
        o.load = function(section_id) {
            var value = uci.get('qosmate', section_id, 'enabled');
            // If the value is undefined (not set in config), return '1' (enabled)
            return (value === undefined) ? '1' : value;
        };

        // Add counter activity column for live monitoring
        o = s.option(form.DummyValue, 'counter_activity', _('Activity'));
        o.cfgvalue = function(section_id) {
            var counterEnabled = uci.get('qosmate', section_id, 'counter');
            if (counterEnabled !== '1') {
                return '-';
            }
            return 'loading...';
        };
        o.textvalue = function(section_id) {
            var counterEnabled = uci.get('qosmate', section_id, 'counter');
            if (counterEnabled !== '1') return '-';
            return 'loading...';
        };

        var self = this;
        // Store reference to the map for grid updates
        this.gridMap = m;
        this.gridSection = s;
        
        return m.render().then(function(rendered) {
            // Store view instance globally for textvalue access
            document.qosmateRulesView = self;
            
            // Start counter polling
            if (!self.pollHandler) {
                self.startCounterPolling();
            }
            
            return rendered;
        });
    },
    
    // Handle view destruction - cleanup polling
    handleDestroy: function() {
        this.stopCounterPolling();
    },
    
    // Handle window unload - cleanup polling
    handleUnload: function() {
        this.stopCounterPolling();
    }
});
