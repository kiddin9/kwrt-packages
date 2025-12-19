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
include './devinfo.php';
$str_cfg=substr($selected_config, strlen("$neko_dir/config")+1);
$core_mode = exec("uci -q get neko.cfg.core_mode");

if(isset($_POST['neko'])){
    $dt = $_POST['neko'];
    if ($core_mode == 'mihomo') {
        if ($dt == 'start') shell_exec("$neko_dir/core/neko -s");
        if ($dt == 'disable') shell_exec("$neko_dir/core/neko -k");
        if ($dt == 'restart') shell_exec("$neko_dir/core/neko -r");
        if ($dt == 'clear') {
            shell_exec("echo 'Log cleared...' > $neko_dir/tmp/log.txt");
            shell_exec("echo 'Log cleared...' > $neko_dir/tmp/neko_log.txt");
        }
    } elseif ($core_mode == 'singbox') {
        if ($dt == 'start') shell_exec("$neko_dir/core/singbox -s");
        if ($dt == 'disable') shell_exec("$neko_dir/core/singbox -k");
        if ($dt == 'restart') shell_exec("$neko_dir/core/singbox -r");
        if ($dt == 'clear') {
            shell_exec("echo 'Log cleared...' > $neko_dir/tmp/log.txt");
            shell_exec("echo 'Log cleared...' > $neko_dir/tmp/singbox_log.txt");
        }
    }
}
$neko_status=exec("uci -q get neko.cfg.enabled");

if ($core_mode == 'mihomo') {
    $binary_log = "$neko_dir/tmp/mihomo_log.txt";
} elseif ($core_mode == 'singbox') {
    $binary_log = "$neko_dir/tmp/singbox_log.txt";
}

if ($core_mode == 'mihomo') {
} elseif ($core_mode == 'singbox') {
}
?>
<?php 
    include './header.php'; 
    include './navbar.php';
    ?>
    <div class="container p-3">
        <div class="card">
            <div class="card-header d-flex align-items-center">
                <i data-feather="home" class="feather-sm me-2"></i>
                <h5 class="card-title mb-0">Neko Home</h5>
            </div>
            <div class="card-body">
            <!-- core mode -->
            <div class="card mb-4">

                <div class="card-body p-3">
                    <div class="d-flex align-items-center justify-content-center">
                        <?php if($core_mode == 'mihomo'): ?>
                            <i data-feather="box" class="feather-lg text-primary me-3" style="width: 32px; height: 32px;"></i>
                        <?php else: ?>
                            <i data-feather="cpu" class="feather-lg text-success me-3" style="width: 32px; height: 32px;"></i>
                        <?php endif; ?>
                        <div class="text-center">
                            <div class="small text-muted mb-1">Active Core</div>
                            <h5 class="mb-0 fw-bold <?php echo ($core_mode == 'mihomo') ? 'text-primary' : 'text-success'; ?>">
                                <?php echo strtoupper($core_mode); ?>
                            </h5>
                        </div>
                    </div>
                </div>
            </div>
                <!-- System Information Card -->
                <div class="card mb-4">
                    <div class="card-header d-flex align-items-center">
                        <i data-feather="server" class="feather-sm me-2"></i>
                        <h5 class="card-title mb-0">System Information</h5>
                    </div>
                    <div class="card-body p-0">
                        <div class="list-group list-group-flush">
                            <?php
                                $show_ip = exec("uci -q get neko.cfg.show_ip");
                                $show_isp = exec("uci -q get neko.cfg.show_isp");
                                
                                if($show_ip == '1') {
                            ?>
                            <div class="list-group-item d-flex justify-content-between align-items-center border-bottom">
                                <div class="d-flex align-items-center">
                                    <i data-feather="globe" class="feather-sm me-2"></i>
                                    <span>IP Address</span>
                                </div>
                                <span id="ip-address">Loading...</span>
                            </div>
                            <?php
                                }
                                if($show_isp == '1') {
                            ?>
                            <div class="list-group-item d-flex justify-content-between align-items-center border-bottom">
                                <div class="d-flex align-items-center">
                                    <i data-feather="wifi" class="feather-sm me-2"></i>
                                    <span>ISP</span>
                                </div>
                                <span id="isp-info">Loading...</span>
                            </div>
                            <?php
                                }
                            ?>
                            <div class="list-group-item d-flex justify-content-between align-items-center border-bottom">
                                <div class="d-flex align-items-center">
                                    <i data-feather="smartphone" class="feather-sm me-2"></i>
                                    <span>Devices</span>
                                </div>
                                <span><?php echo $devices ?></span>
                            </div>
                            <div class="list-group-item d-flex justify-content-between align-items-center border-bottom">
                                <div class="d-flex align-items-center">
                                    <i data-feather="cpu" class="feather-sm me-2"></i>
                                    <span>RAM</span>
                                </div>
                                <span><?php echo "$ramUsage/$ramTotal MB" ?></span>
                            </div>
                            <div class="list-group-item d-flex justify-content-between align-items-center border-bottom">
                                <div class="d-flex align-items-center">
                                    <i data-feather="hard-drive" class="feather-sm me-2"></i>
                                    <span>OS Version</span>
                                </div>
                                <span><?php echo $OSVer ?></span>
                            </div>
                            <div class="list-group-item d-flex justify-content-between align-items-center border-bottom">
                                <div class="d-flex align-items-center">
                                    <i data-feather="code" class="feather-sm me-2"></i>
                                    <span>Kernel Version</span>
                                </div>
                                <span><?php echo $kernelv ?></span>
                            </div>
                            <div class="list-group-item d-flex justify-content-between align-items-center border-bottom">
                                <div class="d-flex align-items-center">
                                    <i data-feather="clock" class="feather-sm me-2"></i>
                                    <span>Uptime</span>
                                </div>
                                <span><?php echo "$hours h $minutes m $seconds s"?></span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Neko Status Card -->
                <div class="card mb-4">
                    <div class="card-header d-flex align-items-center">
                        <i data-feather="box" class="feather-sm me-2"></i>
                        <h5 class="card-title mb-0">Neko</h5>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <div class="d-flex align-items-center mb-2">
                                <i data-feather="activity" class="feather-sm me-2"></i>
                                <span>Status</span>
                            </div>
                            <div class="d-grid">
                                <div class="btn-group col" role="group">            
                                    <?php
                                        if($neko_status==1) echo "<button type=\"button\" class=\"btn btn-success\">RUNNING</button>\n";
                                        else echo "<button type=\"button\" class=\"btn btn-outline-primary\">DISABLED</button>\n";
                                        echo "<button type=\"button\" class=\"btn btn-warning\">$str_cfg</button>\n";
                                    ?>
                                </div>
                            </div>
                        </div>

                        <div class="mb-3">
                            <div class="d-flex align-items-center mb-2">
                                <i data-feather="toggle-right" class="feather-sm me-2"></i>
                                <span>Control</span>
                            </div>
                            <form action="index.php" method="post">
                                <div class="d-grid">
                                    <div class="btn-group col" role="group">
                                        <?php
                                            if ($core_mode == 'mihomo') {
                                                echo '<button type="submit" name="neko" value="start" class="btn btn' . ($neko_status == 1 ? '-outline' : '') . '-success ' . ($neko_status == 1 ? 'disabled' : '') . '">
                                                        <i data-feather="play" class="feather-sm"></i> Enable Mihomo
                                                      </button>';
                                                echo '<button type="submit" name="neko" value="disable" class="btn btn' . ($neko_status == 0 ? '-outline' : '') . '-primary ' . ($neko_status == 0 ? 'disabled' : '') . '">
                                                        <i data-feather="stop-circle" class="feather-sm"></i> Disable Mihomo
                                                      </button>';
                                                echo '<button type="submit" name="neko" value="restart" class="btn btn' . ($neko_status == 0 ? '-outline' : '') . '-warning ' . ($neko_status == 0 ? 'disabled' : '') . '">
                                                        <i data-feather="refresh-cw" class="feather-sm"></i> Restart Mihomo
                                                      </button>';
                                            } elseif ($core_mode == 'singbox') {
                                                echo '<button type="submit" name="neko" value="start" class="btn btn' . ($neko_status == 1 ? '-outline' : '') . '-success ' . ($neko_status == 1 ? 'disabled' : '') . '">
                                                        <i data-feather="play" class="feather-sm"></i> Enable Singbox
                                                      </button>';
                                                echo '<button type="submit" name="neko" value="disable" class="btn btn' . ($neko_status == 0 ? '-outline' : '') . '-primary ' . ($neko_status == 0 ? 'disabled' : '') . '">
                                                        <i data-feather="stop-circle" class="feather-sm"></i> Disable Singbox
                                                      </button>';
                                                echo '<button type="submit" name="neko" value="restart" class="btn btn' . ($neko_status == 0 ? '-outline' : '') . '-warning ' . ($neko_status == 0 ? 'disabled' : '') . '">
                                                        <i data-feather="refresh-cw" class="feather-sm"></i> Restart Singbox
                                                      </button>';
                                            }
                                        ?>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div>
                            <div class="d-flex align-items-center mb-2">
                                <i data-feather="settings" class="feather-sm me-2"></i>
                                <span>Running Mode</span>
                            </div>
                            <input class="form-control text-center" name="mode" type="text" placeholder="<?php 
                                if ($core_mode == 'mihomo') {
                                    echo $neko_cfg['echanced']." | ".$neko_cfg['mode'];
                                } else if ($core_mode == 'singbox') {
                                    echo "SING-BOX | TUN";
                                }
                            ?>" disabled>
                        </div>
                    </div>
                </div>

                <!-- Statistics Card -->
                <div class="card mb-4">
                    <div class="card-header d-flex align-items-center">
                        <i data-feather="bar-chart-2" class="feather-sm me-2"></i>
                        <h5 class="card-title mb-0">Traffic Statistics</h5>
                    </div>
                    <div class="card-body">
                        <!-- Statistik di tengah -->
                        <div class="row justify-content-center text-center mb-4">
                            <div class="col-md-6 col-xl-4">
                                <h2 class="mb-2"><span id="downtotal">-</span></h2>
                                <div class="text-muted">Download</div>
                            </div>
                            <div class="col-md-6 col-xl-4">
                                <h2 class="mb-2"><span id="uptotal">-</span></h2>
                                <div class="text-muted">Upload</div>
                            </div>
                        </div>
                        <!-- Chart dengan ukuran yang lebih kecil -->
                        <div class="chart" style="height: 150px;">
                            <canvas id="trafficChart"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Logs Card -->
                <div class="accordion mb-4">
                    <div class="accordion-item">
                        <div class="accordion-header" id="logsHeader">
                            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#logsCollapse">
                                <h5 class="mb-0">Neko Log</h5>
                            </button>
                        </div>
                        <div id="logsCollapse" class="accordion-collapse collapse" data-bs-parent="#logsHeader">
                            <div class="accordion-body">
                                <textarea class="form-control mb-3" id="logs" rows="10" readonly></textarea>
                                
                                <h5 class="mb-3">Binary Log</h5>
                                <textarea class="form-control mb-3" id="bin_logs" rows="10" readonly></textarea>
                                
                                <form action="index.php" method="post">
                                    <button type="submit" name="neko" value="clear" class="btn btn-primary w-100">
                                        Clear Log
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
<script>
function formatBytes(bytes) {
    if (bytes < 1024000) return (bytes/1024).toFixed(1) + " KB";
    if (bytes < 1024000000) return (bytes/1024000).toFixed(1) + " MB";
    return (bytes/1024000000).toFixed(2) + " GB";
}


let labels = [];
let downloadData = [];
let uploadData = [];
let trafficChart;

function initChart() {
    const ctx = document.getElementById('trafficChart');
    if (!ctx) return;

    trafficChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Download',
                data: downloadData,
                borderColor: '#3B7DDD',
                borderWidth: 2,
                fill: false,
                tension: 0.3,
                pointRadius: 0
            }, {
                label: 'Upload',
                data: uploadData,
                borderColor: '#28A745',
                borderWidth: 2,
                fill: false,
                tension: 0.3,
                pointRadius: 0
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        borderDash: [2, 2]
                    }
                }
            }
        }
    });
}

function updateLogs() {
    const logsCollapse = document.getElementById('logsCollapse');
    if (!logsCollapse.classList.contains('show')) return;


    fetch('./lib/log.php?data=neko')
        .then(response => response.text())
        .then(data => {
            const logs = document.getElementById('logs');
            if (logs) {
                logs.value = data;
                logs.scrollTop = logs.scrollHeight;
            }
        });

    fetch('./lib/log.php?data=bin')
        .then(response => response.text())
        .then(data => {
            const binLogs = document.getElementById('bin_logs');
            if (binLogs) {
                binLogs.value = data;
                binLogs.scrollTop = binLogs.scrollHeight;
            }
        });
}

function updateStats() {
    fetch('./lib/up.php')
        .then(response => response.text())
        .then(upResult => {
            const uptotal = document.getElementById('uptotal');
            if (uptotal) uptotal.textContent = upResult;

            fetch('./lib/down.php')
                .then(response => response.text())
                .then(downResult => {
                    const downtotal = document.getElementById('downtotal');
                    if (downtotal) downtotal.textContent = downResult;

                    if (trafficChart) {
                        const now = new Date();
                        const timeStr = now.getHours() + ':' + 
                                      String(now.getMinutes()).padStart(2, '0') + ':' + 
                                      String(now.getSeconds()).padStart(2, '0');

                        labels.push(timeStr);
                        downloadData.push(parseFloat(downResult));
                        uploadData.push(parseFloat(upResult));

                        if (labels.length > 10) {
                            labels.shift();
                            downloadData.shift();
                            uploadData.shift();
                        }

                        trafficChart.update();
                    }
                });
        });
}

document.addEventListener('DOMContentLoaded', function() {
    initChart();
    
    setInterval(updateLogs, 1000);
    
    setInterval(updateStats, 1000);
    
    document.getElementById('logsCollapse').addEventListener('shown.bs.collapse', updateLogs);
});

document.addEventListener('DOMContentLoaded', function() {
    <?php if($show_ip == '1' || $show_isp == '1') { ?>
    fetch('http://ip-api.com/json/')
        .then(response => response.json())
        .then(data => {
            <?php if($show_ip == '1') { ?>
            document.getElementById('ip-address').textContent = data.query;
            <?php } ?>
            <?php if($show_isp == '1') { ?>
            document.getElementById('isp-info').textContent = data.isp;
            <?php } ?>
        })
        .catch(error => {
            <?php if($show_ip == '1') { ?>
            document.getElementById('ip-address').textContent = 'Failed to load';
            <?php } ?>
            <?php if($show_isp == '1') { ?>
            document.getElementById('isp-info').textContent = 'Failed to load';
            <?php } ?>
        });
    <?php } ?>
});
</script>
<?php include './footer.php'; ?>
