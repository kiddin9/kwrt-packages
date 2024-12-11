'use strict';
'require view';
'require form';
'require rpc';

/**
 * Shows/Hides element
 */
function toggleElement(show, query, node = document, originalDisplayStyle = 'block') {
  if (show) {
    node
      .querySelector(query)
      .style
      .display = originalDisplayStyle;
  } else {
    node
      .querySelector(query)
      .style
      .display = 'none';
  }
}

var monitorIpv4 = '0';
var monitorIpv6 = '0';
var ipv4ScriptContent = '';
var ipv6ScriptContent = '';
var history = {};
var currentPublicIpv4 = _('N/A');
var currentPublicIpv6 = _('N/A');

function processTabVisibility(data, node = document) {
  toggleElement(data.monitorIpv4 == '1', "li[data-tab='ipv4']", node);
  toggleElement(data.monitorIpv6 == '1', "li[data-tab='ipv6']", node);
}

function parseHistory(historyArray) {
  let rs = []

  if (!historyArray) {
    return rs;
  }

  for (let i = 0; i < historyArray.length; i++) {
    let historyData = historyArray[i];
    rs.push([
      historyData["change_timestamp"] || _('N/A'),
      historyData["from"] || _('N/A'),
      historyData["to"] || _('N/A'),
    ]);
  }
  return rs;
}

function processPostRendering(data, node = document) {
  for (const e of node.querySelectorAll('div.cbi-map-tabbed div.cbi-section h3')) {
    e.parentNode.removeChild(e);
  }

  processTabVisibility(data, node);

  var ipv4HistoryTbl = E('table', { 'class': 'table' }, [
    E('tr', { 'class': 'tr table-titles' }, [
      E('th', { 'class': 'th', 'style': 'width:36%;' }, [ _('Timestamp') ]),
      E('th', { 'class': 'th', 'style': 'width:32%;' }, [ _('From') ]),
      E('th', { 'class': 'th', 'style': 'width:32%;' }, [ _('To') ])
    ])
  ]);

  var ipv6HistoryTbl = E('table', { 'class': 'table' }, [
    E('tr', { 'class': 'tr table-titles' }, [
      E('th', { 'class': 'th', 'style': 'width:36%;' }, [ _('Timestamp') ]),
      E('th', { 'class': 'th', 'style': 'width:32%;' }, [ _('From') ]),
      E('th', { 'class': 'th', 'style': 'width:32%;' }, [ _('To') ])
    ])
  ]);

  cbi_update_table(ipv4HistoryTbl, parseHistory(history["history_ipv4"]),
    E('em', _('No entries available'))
  );

  cbi_update_table(ipv6HistoryTbl, parseHistory(history["history_ipv6"]),
    E('em', _('No entries available'))
  );

  var info_nodes = [
    E('div', { 'class': 'cbi-section' }, [
      E('div', { 'class': 'cbi-value' }, [
        E('label', { 'class': 'cbi-value-title' }, _('Public IPv4: ')),
        E('div', { 'class': 'cbi-value-field' }, [
          E('div', [
            E('input', { 'style': 'border: 0px; pointer-events: none;', 'value': data.monitorIpv4 == '1' ? data.currentPublicIpv4 || _('N/A') : _('Not monitored'), 'readonly': 'true' })
          ])
        ]),
        E('label', { 'class': 'cbi-value-title' }, _('Public IPv6: ')),
        E('div', { 'class': 'cbi-value-field' }, [
          E('div', [
            E('input', { 'style': 'border: 0px; pointer-events: none;', 'value': data.monitorIpv6 == '1' ? data.currentPublicIpv6 || _('N/A') : _('Not monitored'), 'readonly': 'true' })
          ])
        ]),
      ])
    ])
  ];

  if (data.monitorIpv4 == '1') {
    info_nodes.push(
      E('div', { 'class': 'cbi-section'}, [
        E('h3', _('Public IPv4 Change History')),
        ipv4HistoryTbl
      ])
    );
  }

  if (data.monitorIpv6 == '1') {
    info_nodes.push(
      E('div', { 'class': 'cbi-section'}, [
        E('h3', _('Public IPv6 Change History')),
        ipv6HistoryTbl
      ])
    );
  }

  node
    .querySelector('div.cbi-section-node#cbi-public_ip_monitor-info')
    .appendChild(E('p', {}, info_nodes));

  node
    .querySelector('div.cbi-section-node#cbi-public_ip_monitor-ipv4')
    .appendChild(E('p', {}, [
      E('h3', _('IPv4 Script')),
      E('p', { 'class': 'cbi-section-descr', 'style' : 'margin-bottom: 16px;' } , _('Script to run when the public IPv4 changes, use $1 to retrieve the new IPv4 inside the script.')),
      E('textarea', { 'id': 'ipv4_script', 'style': 'width:100%; margin-bottom: 16px;', 'rows': 25, 'resize': 'none' }, [ data.ipv4ScriptContent == undefined ? '' : data.ipv4ScriptContent ])
    ]));

  node
    .querySelector('div.cbi-section-node#cbi-public_ip_monitor-ipv6')
    .appendChild(E('p', {}, [
      E('h3', _('IPv6 Script')),
      E('p', { 'class': 'cbi-section-descr', 'style' : 'margin-bottom: 16px;' } , _('Script to run when the public IPv6 changes, use $1 to retrieve the new IPv6 inside the script.')),
      E('textarea', { 'id': 'ipv6_script', 'style': 'width:100%; margin-bottom: 16px;', 'rows': 25, 'resize': 'none' }, [ data.ipv6ScriptContent == undefined ? '' : data.ipv6ScriptContent ])
    ]));
}

/**
 * wrapper function to run tasks as promise and handle ui issues on post processesed ui,
 * running {@link processPostRendering} just before running Promise tasks
 * and then using then function to run again {@link processPostRendering}
 * to prevent reverting post processing of ui form.
 * 
 * @param {*} tasks 
 * @returns 
 */
function runTasks(tasks) {
  processPostRendering({ monitorIpv4, monitorIpv6, ipv4ScriptContent, ipv6ScriptContent, history, currentPublicIpv4, currentPublicIpv6});
  return Promise.all(tasks).then(() => {
    processPostRendering({ monitorIpv4, monitorIpv6, ipv4ScriptContent, ipv6ScriptContent, history, currentPublicIpv4, currentPublicIpv6});
  });
}

const load_ipv4_script_content = rpc.declare({
	object: 'luci.public_ip_monitor',
	method: 'get_ipv4_script_content'
});

const save_ipv4_script_content = rpc.declare({
	object: 'luci.public_ip_monitor',
	method: 'save_ipv4_script_content',
  params: ["content"]
});

const load_ipv6_script_content = rpc.declare({
	object: 'luci.public_ip_monitor',
	method: 'get_ipv6_script_content'
});

const save_ipv6_script_content = rpc.declare({
	object: 'luci.public_ip_monitor',
	method: 'save_ipv6_script_content',
  params: ["content"]
});

const get_history = rpc.declare({
	object: 'luci.public_ip_monitor',
	method: 'get_history'
});

const get_current_public_ipv4 = rpc.declare({
	object: 'luci.public_ip_monitor',
	method: 'get_current_public_ipv4'
});

const get_current_public_ipv6 = rpc.declare({
	object: 'luci.public_ip_monitor',
	method: 'get_current_public_ipv6'
});

return view.extend({
  handleSave: function(ev) {
    var tasks = [];
    document.getElementById('maincontent').querySelectorAll('.cbi-map').forEach(function(map) {
        tasks.push(DOM.callClassMethod(map, 'save'));
    });

    let ipv4ScriptCurrentContent = (document.querySelector("textarea#ipv4_script").value || '').trim().replace(/\r\n/g, '\n') + '\n';
    if (ipv4ScriptCurrentContent != ipv4ScriptContent) {
      tasks.push(save_ipv4_script_content(ipv4ScriptCurrentContent));
      // set global variable to prevent refreshing
      ipv4ScriptContent = ipv4ScriptCurrentContent;
    }

    let ipv6ScriptCurrentContent = (document.querySelector("textarea#ipv6_script").value || '').trim().replace(/\r\n/g, '\n') + '\n';
    if (ipv6ScriptCurrentContent != ipv6ScriptContent) {
      tasks.push(save_ipv6_script_content(ipv6ScriptCurrentContent));
      // set global variable to prevent refreshing
      ipv6ScriptContent = ipv6ScriptCurrentContent;
    }

    return runTasks(tasks);
  },
  handleSaveApply: function(ev, mode) {
    return this.handleSave(ev).then(() => {
        classes.ui.changes.apply(mode == '0');
    });
  },
  handleReset: function(ev) {
    var tasks = [];
    document.getElementById('maincontent').querySelectorAll('.cbi-map').forEach((map) => {
        tasks.push(DOM.callClassMethod(map, 'reset'));
    });

    return runTasks(tasks);
  },
  load: function() {
		return Promise.all([
      load_ipv4_script_content(),
      load_ipv6_script_content(),
      get_history(),
      get_current_public_ipv4(),
      get_current_public_ipv6()
    ]);
	},
  render: function (data) {
    var m, s, o;

    ipv4ScriptContent = (data[0] || {'content' : ''}).content;
    ipv6ScriptContent = (data[1] || {'content' : ''}).content;
    history = data[2] || {};
    currentPublicIpv4 = (data[3] || {'content' : ''}).content;
    currentPublicIpv6 = (data[4] || {'content' : ''}).content;

    m = new form.Map(
      'public_ip_monitor',
      _('Public IP Monitor'),
			_('This monitors changes on the internet-facing public IP and trigger tasks when a change occurs.')
    );
    m.tabbed = true;

    s = m.section(form.TypedSection, 'info', _('Overview'));
    s.anonymous = true;

    // Setting up General Tab
		s = m.section(form.TypedSection, 'general', _('General Settings'));
    s.anonymous = true;

		o = s.option(form.Flag, 'monitor_ipv4', _('Monitor IPv4'), _('Monitor if there your public ipv4 address.'));
    o.onchange = L.bind((a, b, c, newVal) => {
      monitorIpv4 = newVal;
      processTabVisibility({ monitorIpv4, monitorIpv6 });
    }, o, s);

    o = s.option(form.Value, 'ipv4_ip_service', _('IPv4 Service'), _('The service that we can retrieve the public IPv4.'));
    o.optional = false;
    o.datatype = 'hostname';
    o.retain = true;
    o.depends('monitor_ipv4', '1');

    o = s.option(form.Value, 'ipv4_check_interval', _('IPv4 Check Interval'), _('The interval in seconds which we will retrieve data from the service.'));
    o.optional = false;
    o.datatype = 'integer';
    o.retain = true;
    o.depends('monitor_ipv4', '1');

    o = s.option(form.Value, 'ipv4_script_location', _('IPv4 Script Location'), _('The location of the IPv4 on change script to be triggered, use $1 to get the new IPv4 as input.'));
    o.optional = false;
    o.datatype = 'string';
    o.retain = true;
    o.depends('monitor_ipv4', '1');

    o = s.option(form.Flag, 'monitor_ipv6', _('Monitor IPv6'), _('Monitor if there your public ipv6 address.'));
    o.onchange = L.bind((a, b, c, newVal) => {
      monitorIpv6 = newVal;
      processTabVisibility({ monitorIpv4, monitorIpv6 });
    }, o, s);

    o = s.option(form.Value, 'ipv6_ip_service', _('IPv6 Service'), _('The service that we can retrieve the public IPv6.'));
    o.optional = false;
    o.datatype = 'hostname';
    o.retain = true;
    o.depends('monitor_ipv6', '1');

    o = s.option(form.Value, 'ipv6_check_interval', _('IPv6 Check Interval'), _('The interval in seconds which we will retrieve data from the service.'));
    o.optional = false;
    o.datatype = 'integer';
    o.retain = true;
    o.depends('monitor_ipv6', '1');

    o = s.option(form.Value, 'ipv6_script_location', _('IPv6 Script Location'), _('The location of the IPv6 on change script to be triggered, use $1 to get the new IPv6 as input.'));
    o.optional = false;
    o.datatype = 'string';
    o.retain = true;
    o.depends('monitor_ipv6', '1');

    o = s.option(form.Value, 'history_location', _('History Location'), _('The location the IPv4 and IPv6 history is stored.'));
    o.optional = false;
    o.datatype = 'string';
    o.retain = true;
    // make history depend on either ipv4 and ipv6 monitor on
    o.depends('monitor_ipv4', '1');
    o.depends('monitor_ipv6', '1');

    // Setting up IPv4 Tab
    s = m.section(form.TypedSection, 'ipv4', _('IPv4'));
    s.anonymous = true;

    // Setting up IPv6 Tab
    s = m.section(form.TypedSection, 'ipv6', _('IPv6'));
    s.anonymous = true;

    return m.render().then((map) => {
      m
        .data
        .loaded
        .public_ip_monitor
        .then((data) => {
          // update global variables
          monitorIpv4 = data.general.monitor_ipv4
          monitorIpv6 = data.general.monitor_ipv6

          setTimeout(() => processPostRendering({monitorIpv4, monitorIpv6, ipv4ScriptContent, ipv6ScriptContent, history, currentPublicIpv4, currentPublicIpv6}), 0);
        });

      return map;
    });
  }
});