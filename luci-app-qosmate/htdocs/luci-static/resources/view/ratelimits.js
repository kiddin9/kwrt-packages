'use strict';
'require view';
'require form';
'require ui';
'require uci';
'require fs';
'require rpc';

var callInitAction = rpc.declare({
    object: 'luci',
    method: 'setInitAction',
    params: ['name', 'action'],
    expect: { result: false }
});

// Validation helper for IP/IPv6 targets
function validateTargetField(section_id, value) {
    if (!value || value.length === 0) return true;
    
    var values = Array.isArray(value) ? value : value.split(/\s+/);
    var ipv4Regex = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)(?:\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)){3})(?:\/(?:[0-9]|[1-2]\d|3[0-2]))?$/;
    var ipv6Regex = /^(?:[A-Fa-f0-9]{1,4}:){7}[A-Fa-f0-9]{1,4}$|^(?:[A-Fa-f0-9]{1,4}:){1,7}:$|^(?:[A-Fa-f0-9]{1,4}:){1,6}:[A-Fa-f0-9]{1,4}$|^(?:[A-Fa-f0-9]{1,4}:){1,5}(?::[A-Fa-f0-9]{1,4}){1,2}$|^(?:[A-Fa-f0-9]{1,4}:){1,4}(?::[A-Fa-f0-9]{1,4}){1,3}$|^(?:[A-Fa-f0-9]{1,4}:){1,3}(?::[A-Fa-f0-9]{1,4}){1,4}$|^(?:[A-Fa-f0-9]{1,4}:){1,2}(?::[A-Fa-f0-9]{1,4}){1,5}$|^[A-Fa-f0-9]{1,4}:(?::[A-Fa-f0-9]{1,4}){1,6}$|^:(?::[A-Fa-f0-9]{1,4}){1,7}$|^(?:[A-Fa-f0-9]{1,4}:){7}:$|^::$/;
    var ipv6CidrRegex = /^(?:[A-Fa-f0-9]{1,4}:){1,7}[A-Fa-f0-9]{0,4}\/(?:[0-9]|[1-9]\d|1[01]\d|12[0-8])$/;
    
    for (var i = 0; i < values.length; i++) {
        var v = values[i];
        
        // Check for set reference
        if (v.startsWith('@') || v.startsWith('!=@')) {
            var setName = v.replace(/^(!=)?@/, '');
            if (!/^[a-zA-Z0-9_]+$/.test(setName)) {
                return _('Invalid set name format: ') + v;
            }
            continue;
        }
        
        // Strip != prefix for validation
        var isNegated = v.startsWith('!=');
        var valueToValidate = isNegated ? v.substring(2) : v;
        
        // Block MAC addresses explicitly 
        var macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
        if (macRegex.test(valueToValidate)) {
            return _('MAC addresses not supported: ') + v + _(' (use IP addresses instead)');
        }
        
        // Validate IP/CIDR/IPv6
        if (!ipv4Regex.test(valueToValidate) && 
            !ipv6Regex.test(valueToValidate) && 
            !ipv6CidrRegex.test(valueToValidate)) {
            return _('Invalid target format: ') + v + _(' (expected IP, IPv6, CIDR, or @setname)');
        }
    }
    
    return true;
}

return view.extend({
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
        return Promise.all([
            uci.load('qosmate')
        ]).then(() => {
            var m, s, o;

            m = new form.Map('qosmate', _('QoSmate Rate Limits'),
                _('Configure per-device bandwidth limits using nftables meters. Limits are applied based on the source IP of devices, making it easy to control traffic for specific devices or subnets.'));

            s = m.section(form.GridSection, 'ratelimit', _('Rate Limits'));
            s.addremove = true;
            s.anonymous = true;
            s.sortable = true;

            s.tab('general', _('General'));
            s.tab('limits', _('Limits'));

            // General tab
            o = s.taboption('general', form.Value, 'name', _('Name'));
            o.rmempty = false;
            o.placeholder = _('e.g., Guest Network Limit');

            o = s.taboption('general', form.DynamicList, 'target', _('Target Devices'));
            o.datatype = 'string';
            o.placeholder = _('192.168.1.100, !=192.168.1.77, 2001:db8::1');
            o.rmempty = false;
            o.validate = validateTargetField;
            o.write = function(section_id, formvalue) {
                // Ensure != prefix is properly formatted
                var values = formvalue.map(function(v) {
                    return v.replace(/^!(?!=)/, '!=');
                });
                return this.super('write', [section_id, values]);
            };
            var superRenderWidgetTarget = o.renderWidget;
            o.renderWidget = function(section_id, option_index, cfgvalue) {
                var widget = superRenderWidgetTarget.call(this, section_id, option_index, cfgvalue);
                var descr = E('div', { 'class': 'cbi-value-description' }, 
                    'IP/IPv6/CIDR addresses and subnets only. Exclusions: !=192.168.1.77, IP Sets: @vip_guests');
                return E('div', {}, [widget, descr]);
            };

            o = s.taboption('general', form.Flag, 'enabled', _('Enabled'));
            o.default = '1';
            o.rmempty = false;
            o.editable = true;

            // Limits tab
            o = s.taboption('limits', form.Value, 'download_limit', _('Download Limit (Kbit/s)'));
            o.datatype = 'uinteger';
            o.placeholder = _('10000');
            o.default = '10000';
            o.validate = function(section_id, value) {
                if (!value) return true;
                var intVal = parseInt(value);
                if (intVal < 0 || intVal > 100000000) {
                    return _('Must be between 0 and 100000000 Kbit/s');
                }
                return true;
            };
            var superRenderWidgetDownload = o.renderWidget;
            o.renderWidget = function(section_id, option_index, cfgvalue) {
                var widget = superRenderWidgetDownload.call(this, section_id, option_index, cfgvalue);
                var descr = E('div', { 'class': 'cbi-value-description' }, _('Traffic TO device. 0 = unlimited'));
                return E('div', {}, [widget, descr]);
            };

            o = s.taboption('limits', form.Value, 'upload_limit', _('Upload Limit (Kbit/s)'));
            o.datatype = 'uinteger';
            o.placeholder = _('10000');
            o.default = '10000';
            o.validate = function(section_id, value) {
                if (!value) return true;
                var intVal = parseInt(value);
                if (intVal < 0 || intVal > 100000000) {
                    return _('Must be between 0 and 100000000 Kbit/s');
                }
                return true;
            };
            var superRenderWidgetUpload = o.renderWidget;
            o.renderWidget = function(section_id, option_index, cfgvalue) {
                var widget = superRenderWidgetUpload.call(this, section_id, option_index, cfgvalue);
                var descr = E('div', { 'class': 'cbi-value-description' }, _('Traffic FROM device. 0 = unlimited'));
                return E('div', {}, [widget, descr]);
            };

            o = s.taboption('limits', form.Value, 'burst_factor', _('Burst Factor'));
            o.placeholder = _('1.0');
            o.default = '1.0';
            o.validate = function(section_id, value) {
                if (!value || value === '') return true;
                
                // Only allow digits, comma, and period
                if (!/^[0-9,\.]+$/.test(value)) {
                    return _('Only digits and decimal separators allowed');
                }
                
                // Accept both comma and period as decimal separator
                var normalizedValue = value.replace(',', '.');
                
                // Validate decimal format
                if (!/^\d*\.?\d*$/.test(normalizedValue)) {
                    return _('Invalid decimal format');
                }
                
                var floatVal = parseFloat(normalizedValue);
                if (isNaN(floatVal) || floatVal < 0.0 || floatVal > 10.0) {
                    return _('Must be between 0.0 and 10.0 (0 = no burst)');
                }
                return true;
            };
            o.write = function(section_id, formvalue) {
                // Normalize comma to period before saving
                if (formvalue) {
                    formvalue = formvalue.replace(',', '.');
                }
                return this.super('write', [section_id, formvalue]);
            };
            var superRenderWidgetBurst = o.renderWidget;
            o.renderWidget = function(section_id, option_index, cfgvalue) {
                var widget = superRenderWidgetBurst.call(this, section_id, option_index, cfgvalue);
                var descr = E('div', { 'class': 'cbi-value-description' }, _('0 = no burst (strict), 1.0 = rate as burst, higher = more burst'));
                return E('div', {}, [widget, descr]);
            };

            // Custom modal title
            s.modaltitle = function(section_id) {
                var name = uci.get('qosmate', section_id, 'name');
                if (name) {
                    return _('Edit Rate Limit: %s').format(name);
                }
                return _('Add Rate Limit');
            };

            return m.render();
        });
    }
});
