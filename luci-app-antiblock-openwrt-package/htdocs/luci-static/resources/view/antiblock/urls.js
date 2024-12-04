'use strict';
"require ui";
'require form';
'require rpc';
'require view';

var read_urls = rpc.declare({
    object: 'luci.antiblock',
    method: 'read_urls'
});

var write_urls = rpc.declare({
    object: 'luci.antiblock',
    method: 'write_urls',
    params: ["urls"]
});

return view.extend({
    generic_failure: function (message) {
        return E('div', {
            'class': 'error'
        }, ['RPC call failure: ', message])
    },
    load: function () {
        return Promise.all([
            read_urls()
        ]);
    },
    render: function (data) {
        var main_div = E("div");

        var header = E("h2", {}, "AntiBlock");

        var section_descr_div = E(
            "div",
            {
                class: "cbi-section-descr",
            },
            "Blocked URLs"
        );

        var section_div = E(
            "div",
            {
                class: "cbi-section",
            }
        );

        main_div.appendChild(header);
        main_div.appendChild(section_div);
        section_div.appendChild(section_descr_div);

        if (typeof data[0].urls !== 'undefined') {
            var urls_textarea = E(
                "textarea",
                {
                    class: "cbi-input-textarea",
                },
            );

            urls_textarea.value = "";
            data[0].urls.forEach((element) => urls_textarea.value += element + "\n");

            var btn_write_urls = E(
                "button",
                {
                    class: "btn cbi-button cbi-button-apply",
                    click: function (ev) {
                        ui.showModal(null, [
                            E(
                                "p",
                                { class: "spinning" },
                                "Write URLs"
                            ),
                        ]);
                        var lines = urls_textarea.value.replace(/\r\n/g, "\n").split("\n");
                        var filtered = lines.filter(elm => elm);
                        var myJsonString = JSON.stringify(filtered);
                        var myArray = JSON.parse(myJsonString);
                        var write_urls_res = Promise.all([write_urls(myArray)]);
                        write_urls_res.then(
                            function (value) { location.reload(); },
                            function (error) { /* code if some error */ }
                        );
                    },
                },
                "Write URLs"
            );

            section_div.appendChild(urls_textarea);
            section_div.appendChild(btn_write_urls);
        } else {
            var error_div = E(
                "div",
                {
                },
                "The File argument was not specified."
            );

            section_div.appendChild(error_div);
        }

        return main_div;
    },
    handleSave: null,
    handleSaveApply: null,
    handleReset: null
})
