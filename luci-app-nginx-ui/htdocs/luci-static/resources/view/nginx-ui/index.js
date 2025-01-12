'use strict';
'require form';
'require poll';
'require rpc';
'require uci';
'require view';

var callServiceList = rpc.declare({
    object: 'service',
    method: 'list',
    params: ['name'],
    expect: { '': {} }
});

function getServiceStatus() {
    return L.resolveDefault(callServiceList('nginx-ui'), {}).then(function(res) {
        var service = Array.isArray(res) ? res[0] : res;
        return service ? service.running : false;
    });
}

return view.extend({
    handleSaveApply: null,
    handleSave: null,
    handleReset: null,

    load: function() {
        return Promise.all([
            uci.load('nginx-ui')
        ]);
    },

    render: function(data) {
        var m, s, o;

        m = new form.Map('nginx-ui', _('Nginx UI'),
            _('A modern UI for Nginx web server management.'));

        s = m.section(form.TypedSection, 'nginx-ui', _('Global Settings'));
        s.anonymous = true;
        s.addremove = false;

        o = s.option(form.Flag, 'enabled', _('Enable'));
        o.rmempty = false;

        o = s.option(form.Value, 'port', _('Port'));
        o.datatype = 'port';
        o.default = '9000';
        o.rmempty = false;

        o = s.option(form.Value, 'username', _('Username'));
        o.rmempty = false;

        o = s.option(form.Value, 'password', _('Password'));
        o.password = true;
        o.rmempty = false;

        return m.render();
    }
});
