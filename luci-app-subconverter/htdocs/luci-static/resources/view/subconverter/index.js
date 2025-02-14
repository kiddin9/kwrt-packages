// SPDX-License-Identifier: Apache-2.0

'use strict';
'require form';
'require poll';
'require rpc';
'require uci';
'require validation';
'require view';
'require fs';
'require ui';

const callServiceList = rpc.declare({
    object: 'service',
    method: 'list',
    params: ['name'],
    expect: { '': {} }
});

const callServiceRestart = rpc.declare({
    object: 'service',
    method: 'restart',
    params: ['name']
});

const callFileRead = rpc.declare({
    object: 'file',
    method: 'read',
    params: ['path']
});

const callFileWrite = rpc.declare({
    object: 'file',
    method: 'write',
    params: ['path', 'data']
});

function getServiceStatus() {
    return L.resolveDefault(callServiceList('subconverter'), {}).then(function (res) {
        var isRunning = false;
        try {
            isRunning = res['subconverter']['instances']['instance1']['running'];
        } catch (e) { }
        return isRunning;
    });
}

function restartService() {
    return callServiceRestart('subconverter').then(function(result) {
        if (result != 0) {
            ui.addNotification(null, E('p', _('Failed to restart subconverter service')), 'error');
        } else {
            ui.addNotification(null, E('p', _('Subconverter service restarted successfully')), 'info');
        }
    }).catch(function(e) {
        ui.addNotification(null, E('p', _('Failed to restart subconverter service: %s').format(e.message)), 'error');
    });
}

function renderStatus(isRunning, port) {
    var spanTemp = '<span style="color:%s"><strong>%s %s</strong></span>';
    var renderHTML;
    if (isRunning) {
        var button = String.format('&#160;<a class="btn cbi-button" href="http://%s:%s" target="_blank" rel="noreferrer noopener">%s</a>',
            window.location.hostname, "sub-web", _('Open Web Interface'));
        renderHTML = spanTemp.format('green', _('subconverter'), _('RUNNING')) + button;
    } else {
        renderHTML = spanTemp.format('red', _('subconverter'), _('NOT RUNNING'));
    }

    return renderHTML;
}

var stubValidator = {
    factory: validation,
    apply: function(type, value, args) {
        if (value != null)
            this.value = value;

        return validation.types[type].apply(this, args);
    },
    assert: function(condition) {
        return !!condition;
    }
};

return view.extend({
    load: function() {
        return Promise.all([
            uci.load('subconverter'),
            L.resolveDefault(callFileRead('/etc/subconverter/pref.example.ini'), '')
        ]);
    },

    render: function(data) {
        let m, s, o;
        var webport = uci.get(data[0], 'config', 'port') || '9000';
        var prefContent = data[1] || '';

        m = new form.Map('subconverter', _('subconverter'),
            _('A modern UI for subconverter management.'));

        // 状态标签页
        s = m.section(form.TypedSection, null, _('Status'));
        s.anonymous = true;
        s.render = function () {
            poll.add(function () {
                return L.resolveDefault(getServiceStatus()).then(function (res) {
                    var view = document.getElementById('service_status');
                    view.innerHTML = renderStatus(res, webport);
                });
            });

            return E('div', { class: 'cbi-section', id: 'status_bar' }, [
                E('p', { id: 'service_status' }, _('Collecting data...'))
            ]);
        }

        // 基本设置标签页
        s = m.section(form.NamedSection, 'config', 'subconverter', _('Basic Settings'));
        s.anonymous = true;
        s.addremove = false;

        o = s.option(form.Flag, 'enabled', _('Enable'));
        o.default = o.disabled;
        o.rmempty = false;

        o = s.option(form.Value, 'listen_addr', _('Listen address'));
        o.placeholder = '0.0.0.0';
        o.validate = function(section_id, value) {
            if (section_id && value) {
                var m4 = value.match(/^([^\[\]:]+)$/),
                    m6 = value.match(/^\[(.+)\]$/);

                if ((!m4 && !m6) || !stubValidator.apply('ipaddr', m4 ? m4[1] : m6[1]))
                    return _('Expecting: %s').format(_('valid IP address'));
            }
            return true;
        }

        o = s.option(form.Value, 'port', _('Listen port'));
        o.datatype = 'port';
        o.placeholder = '25500';

        // 配置文件编辑标签页
        s = m.section(form.NamedSection, '_pref', 'config', _('Configuration File'));
        s.anonymous = true;
        s.addremove = false;

        o = s.option(form.TextValue, '_pref', _('Edit Configuration File'));
        o.rows = 25;
        o.wrap = 'off';
        o.cfgvalue = function() {
            return prefContent;
        };
        o.write = function(section_id, formvalue) {
            return callFileWrite('/etc/subconverter/pref.example.ini', formvalue)
                .then(function(rc) {
                    if (rc != 0) {
                        ui.addNotification(null, E('p', _('Failed to save the configuration file')), 'error');
                        return;
                    }
                    ui.addNotification(null, E('p', _('Configuration has been saved')), 'info');
                    // 保存成功后重启服务
                    return restartService();
                })
                .catch(function(e) {
                    ui.addNotification(null, E('p', _('Failed to save the configuration file: %s').format(e.message)), 'error');
                });
        };

        return m.render();
    }
});
