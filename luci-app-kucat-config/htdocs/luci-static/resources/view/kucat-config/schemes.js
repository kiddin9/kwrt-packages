'use strict';
'require form';
'require fs';
'require rpc';
'require uci';
'require ui';
'require view';


var opacity_sets = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20];
var ts_sets =  [0, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 1];

function validateRgbInput(value) {
    if (!value || typeof value !== 'string') return '0,0,0';
    
    if (value.includes(',')) {
        return value.replace(/\s*,\s*/g, ',');
    }
    
    if (value.includes(' ') || /^\d+\s+\d+\s+\d+$/.test(value)) {
        return value.trim().split(/\s+/).slice(0, 3).join(',');
    }
    
    return value;
}

function createColorPickerForInput(inputElement) {
    if (!inputElement || inputElement.dataset.hasColorPicker === 'true') {
        return;
    }
    var colorPicker = document.createElement('input');
    colorPicker.type = 'color';
    colorPicker.className = 'color-picker';
    function rgbToHex(rgbStr) {
        if (!rgbStr || typeof rgbStr !== 'string') return '#000000';
        var parts = rgbStr.trim().replace(/,/g, ' ').split(/\s+/);
        var r = parseInt(parts[0] || 0);
        var g = parseInt(parts[1] || 0);
        var b = parseInt(parts[2] || 0);
        
        r = Math.min(255, Math.max(0, isNaN(r) ? 0 : r));
        g = Math.min(255, Math.max(0, isNaN(g) ? 0 : g));
        b = Math.min(255, Math.max(0, isNaN(b) ? 0 : b));
        
        return '#' + 
            (r < 16 ? '0' : '') + r.toString(16) +
            (g < 16 ? '0' : '') + g.toString(16) +
            (b < 16 ? '0' : '') + b.toString(16);
    }
    function hexToRgb(hex) {
        hex = hex.replace('#', '');
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        
        var r = parseInt(hex.substring(0, 2), 16);
        var g = parseInt(hex.substring(2, 4), 16);
        var b = parseInt(hex.substring(4, 6), 16);
        
        return r + ',' + g + ',' + b;
    }
    
    // 设置初始值
    var initialValue = inputElement.value || '0,0,0';
    inputElement.value = validateRgbInput(initialValue);
    colorPicker.value = rgbToHex(inputElement.value);
    inputElement.dataset.hasColorPicker = 'true';
    
    var wrapper = document.createElement('div');
    wrapper.style.display = 'inline-flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.gap = '8px';
    var parent = inputElement.parentNode;
    parent.insertBefore(wrapper, inputElement);
    
    wrapper.appendChild(inputElement);
    wrapper.appendChild(colorPicker);
    
    inputElement.style.width = '120px';
    inputElement.style.marginRight = '5px';
    
    colorPicker.style.width = '30px';
    colorPicker.style.height = '30px';
    colorPicker.style.padding = '0';
    colorPicker.style.margin = '0';
    colorPicker.style.border = '1px solid #ccc';
    colorPicker.style.borderRadius = '4px';
    colorPicker.style.cursor = 'pointer';
    colorPicker.style.flexShrink = '0';
    
    colorPicker.addEventListener('change', function() {
        inputElement.value = hexToRgb(this.value);
        var event = new Event('input', { bubbles: true });
        inputElement.dispatchEvent(event);
    });
    
    inputElement.addEventListener('input', function() {
        try {
            var hexValue = rgbToHex(this.value);
            if (/^#[0-9A-F]{6}$/i.test(hexValue)) {
                colorPicker.value = hexValue;
            }
        } catch (e) {
        }
    });
    
    inputElement.addEventListener('blur', function() {
        this.value = validateRgbInput(this.value);
        colorPicker.value = rgbToHex(this.value);
    });
}

return view.extend({
    load: function() {
        return Promise.all([
            uci.load('kucat')
        ]);
    },

    render: function() {
        var m, s, o;

        m = new form.Map('kucat', _('KuCat Theme Color Schemes List'), 
            _('Pre set 6 color schemes, enable wallpaper as desktop wallpaper, theme RGB values such as 255,0,0 (representing red), dark mode with wallpaper blur for better effect. No matter how many schemes are enabled, only the first scheme should be used'));
        var s = m.section(form.TableSection, 'theme', '');
        s.addremove = true;
        s.anonymous = true;
        s.sortable = false;

        o = s.option(form.Value, 'remarks', _('Remarks'),
            _('Give a descriptive name for this color scheme'));
        o.rmempty = false;

        o = s.option(form.Flag, 'use', _('Enable'),
            _('Enable this color scheme'));
        o.rmempty = false;
        o.default = '1';
        o = s.option(form.Flag, 'bkuse', _('Use wallpaper'),
            _('Use desktop wallpaper'));
        o.rmempty = false;
        o.default = '1';

        o = s.option(form.ListValue, 'mode', _('Light dark mode'),
            _('Select the theme appearance mode'));
        o.value('auto', _('Auto'));
        o.value('light', _('Light'));
        o.value('dark', _('Dark'));
        o.default = 'light';
        o.rmempty = false;

        o = s.option(form.Value, 'primary_rgbm', _('Main color(RGB)'),
            _("RGB values like '255,0,0' for red, or use preset names"));
        o.value('blue', _('RoyalBlue'));
        o.value('green', _('MediumSeaGreen'));
        o.value('orange', _('SandyBrown'));
        o.value('red', _('TomatoRed'));
        o.value('black', _('Black tea eye protection gray'));
        o.value('gray', _('Cool night time(gray and dark)'));
        o.value('bluets', _('Cool Ocean Heart (transparent and bright)'));
        o.rmempty = false;
        o.default = '74,161,133';

        
        o = s.option(form.ListValue, 'primary_rgbm_ts', _('Wallpaper transparency'),
            _('Wallpaper transparency level (0: Transparent, 1: Opaque)'));
        for (var i = 0; i < ts_sets.length; i++) {
            o.value(ts_sets[i].toString(), ts_sets[i].toString());
        }
        o.rmempty = false;
        o.default = '0.9';

        o = s.option(form.ListValue, 'primary_opacity', _('Wallpaper blur radius'),
            _('Wallpaper blur effect (0: no blur)'));
        for (var i = 0; i < opacity_sets.length; i++) {
            o.value(opacity_sets[i].toString(), opacity_sets[i].toString());
        }
        o.datatype = 'ufloat';
        o.rmempty = false;
        o.default = '0';
        o = s.option(form.Value, 'primary_rgbs', _('Fence Color(RGB)'),
			_("Fence background color in RGB (suggest dark values)"));
        o.default = '225,112,88';
        o.rmempty = false;
        o.render = function(section_id, option_index, cfgvalue) {
            var element = form.Value.prototype.render.call(this, section_id, option_index, cfgvalue);

            var uniqueId = 'color-input-' + section_id + '-' + option_index + '-rgbs';
            var wrapper = document.createElement('div');
            wrapper.innerHTML = element;
            var input = wrapper.querySelector('input[type="text"]');
            if (input) {
                input.id = uniqueId;
                element = wrapper.innerHTML;
                setTimeout(function() {
                    var inputElement = document.getElementById(uniqueId);
                    if (inputElement) {
                        createColorPickerForInput(inputElement);
                    }
                }, 100); 
            }
            
            return element;
        };
        
        o = s.option(form.ListValue, 'primary_rgbs_ts', _('Fence color transparency'),
            _('Fence background transparency (0: Transparent, 1: Opaque)'));
        for (var i = 0; i < ts_sets.length; i++) {
            o.value(ts_sets[i].toString(), ts_sets[i].toString());
        }
        o.datatype = 'ufloat';
        o.rmempty = false;
        o.default = '0.1';

        var result = m.render();
        setTimeout(function() {
            var inputs1 = document.querySelectorAll('input[name*="primary_rgbs"]');
            inputs1.forEach(function(input) {
                if (input.dataset.hasColorPicker !== 'true') {
                    createColorPickerForInput(input);
                }
            });
            var allTextInputs = document.querySelectorAll('input[type="text"]');
            allTextInputs.forEach(function(input) {
                var value = input.value || '';
                if ((value.includes(',') || /^\d+\s+\d+\s+\d+$/.test(value)) && 
                    input.dataset.hasColorPicker !== 'true') {
                    createColorPickerForInput(input);
                }
            });
        }, 300);
        
        return result;
    }
});