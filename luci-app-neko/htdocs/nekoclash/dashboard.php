<?php
/**
 * MIT License
 *
 * Copyright (c) 2024 Nosignal <https://github.com/nosignals>
 * 
 * Contributors:
 * - bobbyunknown <https://github.com/bobbyunknown>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

include './cfg.php';

$core_mode = exec("uci -q get neko.cfg.core_mode");
$selected_config = exec("uci -q get neko.cfg.selected_config");

function get_dashboard_config($core_mode, $selected_config) {
    if ($core_mode == 'mihomo') {
        $port = exec("uci -q get neko.cfg.port") ?: '9090';
        
        if (file_exists($selected_config)) {
            $yaml = file_get_contents($selected_config);
            if (preg_match('/secret:\s*(.+)/', $yaml, $matches)) {
                $secret = trim($matches[1]);
            }
        }
        
        return [
            'port' => $port,
            'secret' => $secret ?? ''
        ];
    } elseif ($core_mode == 'singbox') {
        global $neko_dir;
        $config_file = "$neko_dir/config/singbox.json";
        if (file_exists($config_file)) {
            $config = json_decode(file_get_contents($config_file), true);
            $clash_api = $config['experimental']['clash_api'] ?? [];
            
            $controller = $clash_api['external_controller'] ?? '0.0.0.0:9090';
            $port = explode(':', $controller)[1];
            
            return [
                'port' => $port,
                'secret' => $clash_api['secret'] ?? ''
            ];
        }
    }
    return ['port' => '9090', 'secret' => ''];
}

$config = get_dashboard_config($core_mode, $selected_config);
$port = $config['port'];
$secret = $config['secret'];

$yacd_link = $_SERVER['HTTP_HOST'] . ":" . $port . "/ui/meta/?hostname=" . $_SERVER['HTTP_HOST'] . "&port=" . $port . "&secret=" . $secret;
$metacubexd_link = $_SERVER['HTTP_HOST'] . ":" . $port . "/ui/metacubexd/?hostname=" . $_SERVER['HTTP_HOST'] . "&port=" . $port . "&secret=" . $secret;

?>
<?php 
    include './header.php'; 
    include './navbar.php';
    ?>
    <div class="container p-3">
        <div class="card">
            <div class="card-header d-flex align-items-center">
                <i data-feather="monitor" class="feather-sm me-2"></i>
                <h5 class="card-title mb-0">Dashboard</h5>
            </div>
            <div class="card-body">
                <!-- Buttons -->
                <div class="mb-4">
                    <div class="d-grid gap-2 d-flex justify-content-center">
                        <?php if ($core_mode == 'mihomo'): ?>
                            <a class="btn btn-outline-primary" target="_blank" href="http://<?=$yacd_link ?>">
                                <i data-feather="external-link" class="feather-sm me-2"></i>
                                META - YACD
                            </a>
                            <a class="btn btn-outline-primary" target="_blank" href="http://<?=$metacubexd_link ?>">
                                <i data-feather="external-link" class="feather-sm me-2"></i>
                                METACUBEXD
                            </a>
                        <?php else: ?>
                            <a class="btn btn-outline-primary" target="_blank" href="http://<?=$yacd_link ?>">
                                <i data-feather="external-link" class="feather-sm me-2"></i>
                                SINGBOX - YACD
                            </a>
                        <?php endif; ?>
                    </div>
                </div>

                <!-- Iframe -->
                <div class="mb-3">
                    <iframe 
                        class="border rounded w-100" 
                        height="700" 
                        src="http://<?=$yacd_link ?>" 
                        title="yacd" 
                        allowfullscreen>
                    </iframe>
                </div>
            </div>
        </div>
    </div>
<?php include './footer.php'; ?>
