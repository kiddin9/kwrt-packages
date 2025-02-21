'use strict';
'require view';
'require rpc';
'require ui';
'require uci';
'require form';
'require fs';
'require tools.widgets as widgets';

var callInitAction = rpc.declare({
    object: 'luci',
    method: 'setInitAction',
    params: ['name', 'action'],
    expect: { result: false }
});

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
        var m, s, o;

        m = new form.Map('qosmate', _('QoSmate IP Sets'),
            _('Define groups of IP addresses that can be referenced in QoS rules using @setname'));

        s = m.section(form.GridSection, 'ipset', _('IP Sets'));
        s.addremove = true;
        s.anonymous = true;
        s.sortable = true;

        o = s.option(form.Value, 'name', _('Set Name'));
        o.rmempty = false;
        o.validate = function(section_id, value) {
            if (!value) {
                return _('Set name is required');
            }
            if (!/^[a-zA-Z0-9_]+$/.test(value)) {
                return _('Set name must contain only letters, numbers, and underscore');
            }
            return true;
        };

        o = s.option(form.ListValue, 'mode', _('Set Mode'));
        o.value('static', _('Static'));
        o.value('dynamic', _('Dynamic'));
        o.default = 'static';
        o.rmempty = false;

        o = s.option(form.ListValue, 'family', _('Family'));
        o.value('ipv4', _('IPv4'));
        o.value('ipv6', _('IPv6'));
        o.default = 'ipv4';
        o.rmempty = false;

        o = s.option(form.DynamicList, 'ip4', _('IPv4 Addresses'));
        o.datatype = 'ip4addr';
        o.rmempty = true;
        o.placeholder = _('Add IPv4 address or subnet');
        o.depends({ mode: 'static', family: 'ipv4' });

        o = s.option(form.DynamicList, 'ip6', _('IPv6 Addresses'));
        o.datatype = 'ip6addr';
        o.rmempty = true;
        o.placeholder = _('Add IPv6 address or subnet');
        o.depends({ mode: 'static', family: 'ipv6' });

        o = s.option(form.Value, 'timeout', _('Timeout'));
        o.placeholder = _('e.g., 1h');
        o.depends('mode', 'dynamic');
        o.validate = function(section_id, value) {
            if (!value)
                return true; // Allow empty value if applicable
            // Validate that the timeout is in a valid format (e.g., combination of numbers and allowed time units: h, m, s)
            if (!/^(\d+[hms])+$/.test(value)) {
                return _('Timeout must be in a valid format (e.g., "10s", "1h", "2h12m10s")');
            }
            return true;
        };

        o = s.option(form.Flag, 'enabled', _('Enabled'));
        o.default = '1';
        o.rmempty = false;

        return m.render();
    }
});
