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
include './manager.php';

$dirPath = "$neko_dir/config";
$arrFiles = array();
$arrFiles = glob("$dirPath/*.yaml");

$ruleDirPath = "$neko_dir/rule_provider";
$tmpPath = "$neko_www/lib/tmprules.txt";
$rulePath = "";
$strRules = "";
$strNewRules = "";
$core_mode = exec("uci -q get neko.cfg.core_mode");

if(isset($_POST['config_content']) && isset($_POST['save_config'])){
    if ($core_mode == 'singbox') {
        $config_file = "$neko_dir/config/singbox.json";
        file_put_contents($config_file, $_POST['config_content']);
    } else {
        if(isset($selected_config) && file_exists($selected_config)) {
            file_put_contents($selected_config, $_POST['config_content']);
        }
    }
}

if(isset($_POST['action'])) {
    if($_POST['action'] == 'load_proxy') {
        $proxyPath = $_POST['proxycfg'];
        if(file_exists($proxyPath)) {
            echo file_get_contents($proxyPath);
            exit;
        }
    }
    
    if($_POST['action'] == 'save_proxy') {
        $proxyPath = $_POST['proxycfg'];
        $content = $_POST['content'];
        if(file_exists($proxyPath)) {
            file_put_contents($proxyPath, $content);
            echo "success";
            exit;
        }
    }
}

if(isset($_POST['action'])) {
    if($_POST['action'] == 'load_rules') {
        $rulesPath = $_POST['rulescfg'];
        if(file_exists($rulesPath)) {
            echo file_get_contents($rulesPath);
            exit;
        }
    }
    
    if($_POST['action'] == 'save_rules') {
        $rulesPath = $_POST['rulescfg'];
        $content = $_POST['content'];
        if(file_exists($rulesPath)) {
            file_put_contents($rulesPath, $content);
            echo "success";
            exit;
        }
    }
}

if(isset($_POST['clashconfig'])){
    $dt = $_POST['clashconfig'];
    shell_exec("uci set neko.cfg.selected_config='$dt' && uci commit neko");
    $selected_config = $dt;
}
if(isset($_POST['neko'])){
    $dt = $_POST['neko'];
    if ($dt == 'apply') shell_exec("$neko_dir/core/neko -r");
}

if(isset($_POST['rulescfg'])){
    $dt = $_POST['rulescfg'];
    $strRules = shell_exec("cat $dt");
    $rulePath = $dt;
    shell_exec("echo $dt > $tmpPath");
}
if(isset($_POST['newrulescfg'])){
    $dt = $_POST['newrulescfg'];
    $strNewRules = $dt;
    $tmpData = exec("cat $tmpPath");
    shell_exec("echo \"$strNewRules\" > $tmpData");
    shell_exec("rm $tmpPath");
}

if(isset($_POST["path_selector"])) {
    if ($_POST['path_selector'] == 'Option') {
        header('Content-Type: application/json');
        echo json_encode([
            'status' => 'error',
            'title' => 'Error!',
            'message' => 'Please select the correct directory',
            'icon' => 'error'
        ]);
        exit;
    } 
    
    if ($_POST['path_selector'] == 'BACKUP CONFIG') {
        backupConfig();
        exit;
    } 
    
    if ($_POST['path_selector'] == 'RESTORE CONFIG') {
        restoreConfig();
        exit;
    }
    
    up_controller($_POST['path_selector']);
    exit;
}

if(isset($_POST["file_action"])) {
    $action = explode("@", $_POST["file_action"]);
    $command = $action[0];
    
    if($command === 'down') {
        $result = action_controller($_POST["file_action"]);
        exit;
    }
    
    $result = action_controller($_POST["file_action"]);
    header('Content-Type: application/json');
    echo json_encode($result);
    exit;
}
?>

<?php include './header.php'; ?>
 <?php include './navbar.php'; ?>

<?php if ($core_mode == 'mihomo'): ?>
<div class="container p-3">
    <div class="card">
        <div class="card-header d-flex align-items-center">
            <i data-feather="settings" class="feather-sm me-2"></i>
            <h5 class="card-title mb-0">Config Editor</h5>
        </div>
        <div class="card-body">
            <form action="configs.php" method="post">
                <div class="mb-4">
                    <div class="col input-group">
                        <select class="form-select form-select-lg" name="clashconfig" aria-label="themex">
                            <option selected><?php echo $selected_config ?></option>
                            <?php foreach ($arrFiles as $file) echo "<option value=\"".$file.'">'.$file."</option>" ?>
                        </select>
                    </div>
                </div>
                <div class="d-grid">
                    <div class="btn-group col" role="group">
                        <button type="submit" class="btn btn-warning">
                            <i data-feather="save" class="feather-sm me-2"></i>
                            Change Configs
                        </button>
                        <button name="neko" type="submit" value="apply" class="btn btn-success">
                            <i data-feather="refresh-cw" class="feather-sm me-2"></i>
                            Apply
                        </button>
                    </div>
                </div>
            </form>
        </div>
    </div>
</div>
<?php endif; ?>

<!-- Menu config -->
<div class="container p-3">
    <div class="card">
        <div class="card-body">
            <?php if ($core_mode != 'singbox'): ?>
            <ul class="nav nav-pills justify-content-center gap-2">
                <li class="nav-item">
                    <a class="btn btn-outline-primary active px-4" data-bs-toggle="tab" href="#info">
                        <i data-feather="info" class="feather-sm me-2"></i>Info
                    </a>
                </li>
                <li class="nav-item">
                    <a class="btn btn-outline-primary px-4" data-bs-toggle="tab" href="#proxy">
                        <i data-feather="shield" class="feather-sm me-2"></i>Proxy
                    </a>
                </li>
                <li class="nav-item">
                    <a class="btn btn-outline-primary px-4" data-bs-toggle="tab" href="#rules">
                        <i data-feather="list" class="feather-sm me-2"></i>Rules
                    </a>
                </li>
                <li class="nav-item">
                    <a class="btn btn-outline-primary px-4" data-bs-toggle="tab" href="#converter">
                        <i data-feather="refresh-cw" class="feather-sm me-2"></i>Converter
                    </a>
                </li>
                <li class="nav-item">
                    <a class="btn btn-outline-primary px-4" data-bs-toggle="tab" href="#manager">
                        <i data-feather="folder" class="feather-sm me-2"></i>Manager
                    </a>
                </li>
            </ul>
            <?php endif; ?>
            <?php if ($core_mode == 'mihomo'): ?>
            <div class="tab-content">
                <div id="info" class="tab-pane fade show active">
                    <h2 class="text-center p-2">Config Information</h2>
                    <div class="container mb-5">
                        <!-- Desktop View -->
                        <div class="d-none d-md-block">
                            <div class="row g-3 mb-3">
                                <div class="col-md-4">
                                    <label class="form-label text-center w-100">
                                        <i data-feather="radio" class="feather-sm me-2"></i>PORT
                                    </label>
                                    <input class="form-control text-center" name="port" type="text" placeholder="<?php echo $neko_cfg['port'] ?>" disabled>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label text-center w-100">
                                        <i data-feather="repeat" class="feather-sm me-2"></i>REDIR
                                    </label>
                                    <input class="form-control text-center" name="redir" type="text" placeholder="<?php echo $neko_cfg['redir'] ?>" disabled>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label text-center w-100">
                                        <i data-feather="git-merge" class="feather-sm me-2"></i>SOCKS
                                    </label>
                                    <input class="form-control text-center" name="socks" type="text" placeholder="<?php echo $neko_cfg['socks'] ?>" disabled>
                                </div>
                            </div>
                            
                            <div class="row g-3 mb-3">
                                <div class="col-md-4">
                                    <label class="form-label text-center w-100">
                                        <i data-feather="shuffle" class="feather-sm me-2"></i>MIXED
                                    </label>
                                    <input class="form-control text-center" name="mixed" type="text" placeholder="<?php echo $neko_cfg['mixed'] ?>" disabled>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label text-center w-100">
                                        <i data-feather="filter" class="feather-sm me-2"></i>TPROXY
                                    </label>
                                    <input class="form-control text-center" name="tproxy" type="text" placeholder="<?php echo $neko_cfg['tproxy'] ?>" disabled>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label text-center w-100">
                                        <i data-feather="settings" class="feather-sm me-2"></i>MODE
                                    </label>
                                    <input class="form-control text-center" name="mode" type="text" placeholder="<?php echo $neko_cfg['mode'] ?>" disabled>
                                </div>
                            </div>

                            <div class="row g-3">
                                <div class="col-md-4">
                                    <label class="form-label text-center w-100">
                                        <i data-feather="shield" class="feather-sm me-2"></i>ENHANCED
                                    </label>
                                    <input class="form-control text-center" name="ech" type="text" placeholder="<?php echo $neko_cfg['echanced'] ?>" disabled>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label text-center w-100">
                                        <i data-feather="key" class="feather-sm me-2"></i>SECRET
                                    </label>
                                    <input class="form-control text-center" name="sec" type="text" placeholder="<?php echo $neko_cfg['secret'] ?>" disabled>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label text-center w-100">
                                        <i data-feather="terminal" class="feather-sm me-2"></i>CONTROLLER
                                    </label>
                                    <input class="form-control text-center" name="ext" type="text" placeholder="<?php echo $neko_cfg['ext_controller'] ?>" disabled>
                                </div>
                            </div>
                        </div>

                        <!-- Mobile View -->
                        <div class="d-md-none">
                            <div class="row g-2">
                                <div class="col-6">
                                    <label class="form-label text-center w-100">
                                        <i data-feather="radio" class="feather-sm me-1"></i>PORT
                                    </label>
                                    <input class="form-control form-control-sm text-center" name="port" type="text" placeholder="<?php echo $neko_cfg['port'] ?>" disabled>
                                </div>
                                <div class="col-6">
                                    <label class="form-label text-center w-100">
                                        <i data-feather="repeat" class="feather-sm me-1"></i>REDIR
                                    </label>
                                    <input class="form-control form-control-sm text-center" name="redir" type="text" placeholder="<?php echo $neko_cfg['redir'] ?>" disabled>
                                </div>
                                <div class="col-6">
                                    <label class="form-label text-center w-100">
                                        <i data-feather="git-merge" class="feather-sm me-1"></i>SOCKS
                                    </label>
                                    <input class="form-control form-control-sm text-center" name="socks" type="text" placeholder="<?php echo $neko_cfg['socks'] ?>" disabled>
                                </div>
                                <div class="col-6">
                                    <label class="form-label text-center w-100">
                                        <i data-feather="shuffle" class="feather-sm me-1"></i>MIXED
                                    </label>
                                    <input class="form-control form-control-sm text-center" name="mixed" type="text" placeholder="<?php echo $neko_cfg['mixed'] ?>" disabled>
                                </div>
                                <div class="col-6">
                                    <label class="form-label text-center w-100">
                                        <i data-feather="filter" class="feather-sm me-1"></i>TPROXY
                                    </label>
                                    <input class="form-control form-control-sm text-center" name="tproxy" type="text" placeholder="<?php echo $neko_cfg['tproxy'] ?>" disabled>
                                </div>
                                <div class="col-6">
                                    <label class="form-label text-center w-100">
                                        <i data-feather="settings" class="feather-sm me-1"></i>MODE
                                    </label>
                                    <input class="form-control form-control-sm text-center" name="mode" type="text" placeholder="<?php echo $neko_cfg['mode'] ?>" disabled>
                                </div>
                                <div class="col-6">
                                    <label class="form-label text-center w-100">
                                        <i data-feather="shield" class="feather-sm me-1"></i>ENHANCED
                                    </label>
                                    <input class="form-control form-control-sm text-center" name="ech" type="text" placeholder="<?php echo $neko_cfg['echanced'] ?>" disabled>
                                </div>
                                <div class="col-6">
                                    <label class="form-label text-center w-100">
                                        <i data-feather="key" class="feather-sm me-1"></i>SECRET
                                    </label>
                                    <input class="form-control form-control-sm text-center" name="sec" type="text" placeholder="<?php echo $neko_cfg['secret'] ?>" disabled>
                                </div>
                                <div class="col-12">
                                    <label class="form-label text-center w-100">
                                        <i data-feather="terminal" class="feather-sm me-1"></i>CONTROLLER
                                    </label>
                                    <input class="form-control form-control-sm text-center" name="ext" type="text" placeholder="<?php echo $neko_cfg['ext_controller'] ?>" disabled>
                                </div>
                            </div>
                        </div>
                        <?php endif; ?>
                        <!-- Config textarea section -->
                        <h2 class="text-center p-2 mt-4">
                            <?php 
                            if ($core_mode == 'singbox') {
                                echo 'Singbox Config';
                            } else {
                                echo 'Mihomo Config';
                            }
                            ?>
                        </h2>
                        <div class="container mb-3">
                            <form action="configs.php" method="post">
                                <textarea 
                                    class="form-control font-monospace" 
                                    name="config_content" 
                                    style="height: 400px; background: transparent; color: inherit; resize: none;"
                                ><?php
                                    if ($core_mode == 'singbox') {
                                        $config_file = "/etc/neko/config/singbox.json";
                                        if (file_exists($config_file)) {
                                            echo trim(file_get_contents($config_file));
                                        }
                                    } else {
                                        if(isset($selected_config) && file_exists($selected_config)) {
                                            echo trim(file_get_contents($selected_config));
                                        }
                                    }
                                ?></textarea>
                                
                                <div class="text-center mt-3">
                                    <button type="submit" name="save_config" class="btn btn-primary">
                                        <i data-feather="save" class="feather-sm me-2"></i>
                                        Save Config
                                    </button>
                                </div>
                                <?php if(isset($_POST['config_content']) && isset($_POST['save_config'])): ?>
                                    <div class="alert alert-success text-center mt-3" role="alert">
                                        <i data-feather="check-circle" class="feather-sm me-2"></i>
                                        Config Successfully Saved
                                    </div>
                                <?php endif; ?>
                            </form>
                        </div>
                    </div>
                </div>
                <?php if ($core_mode != 'singbox'): ?>
                <div id="proxy" class="tab-pane fade">
                  <h2 class="text-center p-2">Proxy</h2>
                    <div class="container mb-5">
                        <div class="container text-center justify-content-md-center">
                            <div class="row justify-content-md-center">
                                <div class="col input-group mb-3 justify-content-md-center">
                                    <select class="form-select" id="proxySelect" name="proxycfg" aria-label="themex">
                                        <option selected>Select Proxy</option>
                                        <?php 
                                        $proxyDirPath = "$neko_dir/proxy_provider";
                                        $proxyFiles = glob("$proxyDirPath/*.yaml");
                                        foreach ($proxyFiles as $file) echo "<option value=\"".$file.'">'.$file."</option>" 
                                        ?>
                                    </select>
                                    <button class="btn btn-outline-primary" id="selectProxy" type="button">Select</button>
                                </div>
                            </div>
                        </div>

                        <div class="container mb-3">
                            <div class="container text-center justify-content-md-center">
                                <div class="col input-group mb-3 justify-content-md-center" id="proxyPath"></div>
                                <div class="col input-group mb-3 justify-content-md-center">
                                    <textarea class="form-control" id="proxyContent" name="newproxycfg" rows="16"></textarea>
                                </div>
                                <div class="col input-group mb-3 justify-content-md-center">
                                    <button class="btn btn-primary" id="saveProxy" type="button">Save Proxy</button>
                                </div>
                                <div class="col input-group mb-3 justify-content-md-center" id="saveStatus"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Rules -->
                <div id="rules" class="tab-pane fade">
                    <h2 class="text-center p-2">Rules</h2>
                    <div class="container mb-5">
                        <div class="container text-center justify-content-md-center">
                            <div class="row justify-content-md-center">
                                <div class="col input-group mb-3 justify-content-md-center">
                                    <select class="form-select" id="rulesSelect" name="rulescfg" aria-label="themex">
                                        <option selected>Select Rules</option>
                                        <?php 
                                        $ruleFiles = glob("$ruleDirPath/*.yaml");
                                        foreach ($ruleFiles as $file) echo "<option value=\"".$file.'">'.$file."</option>" 
                                        ?>
                                    </select>
                                    <button class="btn btn-outline-primary" id="selectRules" type="button">Select</button>
                                </div>
                            </div>
                        </div>

                        <div class="container mb-3">
                            <div class="container text-center justify-content-md-center">
                                <div class="col input-group mb-3 justify-content-md-center" id="rulesPath"></div>
                                <div class="col input-group mb-3 justify-content-md-center">
                                    <textarea 
                                        class="form-control font-monospace" 
                                        id="rulesContent"
                                        name="newrulescfg" 
                                        rows="16" 
                                        style="resize: none;"
                                    ></textarea>
                                </div>
                                <div class="col input-group mb-3 justify-content-md-center">
                                    <button class="btn btn-primary" id="saveRules" type="button">
                                        <i data-feather="save" class="feather-sm me-2"></i>
                                        Save Rules
                                    </button>
                                </div>
                                <div class="col input-group mb-3 justify-content-md-center" id="rulesStatus"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Converter -->
                <div id="converter" class="tab-pane fade">
                    <h2 class="text-center p-2">Converter</h2>
                    <div class="container mb-5">
                        <div class="container text-center justify-content-md-center">
                            <div class="row justify-content-md-center">
                                <div class="col input-group mb-3 justify-content-md-center">
                                    <input type="text" class="form-control" id="urlInput" name="url" placeholder="Paste Here">
                                    <button class="btn btn-outline-primary" onclick="convertUrl()" type="button">Convert</button>
                                </div>
                            </div>
                        </div>
                        <div class="container mb-3">
                            <textarea id="convertResult" class="form-control" rows="16" readonly></textarea>
                        </div>
                        <div>
                        <div class="container mb-3">
                            <div class="alert alert-info alert-dismissible fade show p-2" role="alert">
                                <div class="d-flex align-items-center">
                                    <div class="flex-shrink-0">
                                        <i data-feather="info" class="feather-sm me-2" data-bs-toggle="tooltip" data-bs-placement="top" title="Supported :"></i>
                                    </div>
                                    <div class="flex-grow-1 ms-2">
                                        <small class="d-block mb-1">
                                            <i data-feather="shield" class="feather-xs me-1"></i>
                                            <strong>TROJAN:</strong> GFW, WS TLS/NTLS, GRPC
                                        </small>
                                        <small class="d-block mb-1">
                                            <i data-feather="box" class="feather-xs me-1"></i>
                                            <strong>VMESS:</strong> WS TLS/NTLS, HTTP, H2, GRPC
                                        </small>
                                        <small class="d-block">
                                            <i data-feather="lock" class="feather-xs me-1"></i>
                                            <strong>VLESS:</strong> WS TLS/NTLS, XTLS, GRPC
                                        </small>
                                        <small class="d-block">
                                            <i data-feather="key" class="feather-xs me-1"></i>
                                            <strong>SS:</strong> DIRECT, OBFS, V2RAY/XRAY-PLUGIN
                                        </small>
                                        <small class="d-block">
                                            <i data-feather="link" class="feather-xs me-1"></i>
                                            <strong>SUBSCRIBE LINK:</strong> Only works with active internet connection
                                        </small>
                                    </div>
                                </div>
                            <button type="button" class="btn-close btn-close-sm" data-bs-dismiss="alert" aria-label="Close"></button>
                        </div>
                    </div>
                        </div>
                    </div>
                </div>
                <div id="manager" class="tab-pane fade">
                    <h2 class="text-center p-2">Config File Manager</h2>
                    <div class="container mb-5">
                        <!-- Upload & Backup Section -->
                        <div class="container container-bg border border-3 rounded-4 col-12 mb-4">
                            <h3 class="mt-3">Upload & Backup file</h3>
                            <form id="uploadForm" action="manager.php" method="POST" enctype="multipart/form-data">
                                <table class="table table-borderless">
                                    <tbody>
                                        <tr class="text-center">
                                            <td class="col-3">
                                                <input class="form-control" type="file" name="file_upload" accept=".yaml,.yml,.tar.gz">
                                            </td>
                                            <td class="col-2">
                                                <select class="form-select" name="path_selector">
                                                    <option selected>Option</option>
                                                    <?php foreach ($arrPath as $file) echo "<option value=\"".$file.'">'.$file."</option>" ?>
                                                </select>
                                            </td>
                                            <td class="col-2">
                                                <button type="submit" class="btn btn-outline-primary d-grid col-8">Apply</button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </form>
                            <div id="uploadStatus" class="alert mt-3" style="display: none;"></div>
                            <div class="mb-3">
                                <b>NOTE</b><br/>
                                <span>Restore your configuration is destroying our old <b>configuration</b> at neko directory!!!</span><br/>
                                <span>Backup is include of directory <b>configs, proxy_provider,</b> and<b> rule_provider.</b></span>
                            </div>
                        </div>

                        <!-- Config Files Section -->
                        <div class="container container-bg border border-3 rounded-4 col-12 mb-4">
                            <h3 class="mt-3">Config files</h3>
                            <table class="table table-borderless">
                                <thead>
                                    <tr class="text-center">
                                        <th class="col-4">Files</th>
                                        <th class="col-2">Action</th>
                                    </tr>
                                </thead>
                                <tbody id="configTable"></tbody>
                            </table>
                        </div>

                        <!-- Proxy Provider Section -->
                        <div class="container container-bg border border-3 rounded-4 col-12 mb-4">
                            <h3 class="mt-3">Proxy Provider files</h3>
                            <table class="table table-borderless">
                                <thead>
                                    <tr class="text-center">
                                        <th class="col-4">Files</th>
                                        <th class="col-2">Action</th>
                                    </tr>
                                </thead>
                                <tbody id="proxyTable"></tbody>
                            </table>
                        </div>

                        <!-- Rules Provider Section -->
                        <div class="container container-bg border border-3 rounded-4 col-12 mb-4">
                            <h3 class="mt-3">Rules Provider files</h3>
                            <table class="table table-borderless">
                                <thead>
                                    <tr class="text-center">
                                        <th class="col-4">Files</th>
                                        <th class="col-2">Action</th>
                                    </tr>
                                </thead>
                                <tbody id="ruleTable"></tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
<?php endif; ?>
        </div>
    </div>
</div>
<div id="managerModals"></div>                

<script>
document.getElementById('selectProxy').addEventListener('click', function(e) {
    e.preventDefault();
    let proxyPath = document.getElementById('proxySelect').value;
    
    fetch('configs.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'action=load_proxy&proxycfg=' + encodeURIComponent(proxyPath)
    })
    .then(response => response.text())
    .then(data => {
        document.getElementById('proxyPath').innerHTML = '<h5>' + proxyPath + '</h5>';
        document.getElementById('proxyContent').value = data;
    });
});

document.getElementById('saveProxy').addEventListener('click', function(e) {
    e.preventDefault();
    let proxyPath = document.getElementById('proxySelect').value;
    let content = document.getElementById('proxyContent').value;
    
    fetch('configs.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'action=save_proxy&proxycfg=' + encodeURIComponent(proxyPath) + '&content=' + encodeURIComponent(content)
    })
    .then(response => response.text())
    .then(data => {
        if(data === 'success') {
            document.getElementById('saveStatus').innerHTML = '<h5>Proxy SUCCESSFULLY SAVED</h5>';
        }
    });
});

document.getElementById('selectRules').addEventListener('click', function(e) {
    e.preventDefault();
    let rulesPath = document.getElementById('rulesSelect').value;
    
    fetch('configs.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'action=load_rules&rulescfg=' + encodeURIComponent(rulesPath)
    })
    .then(response => response.text())
    .then(data => {
        document.getElementById('rulesPath').innerHTML = '<h5>' + rulesPath + '</h5>';
        document.getElementById('rulesContent').value = data;
    });
});

document.getElementById('saveRules').addEventListener('click', function(e) {
    e.preventDefault();
    let rulesPath = document.getElementById('rulesSelect').value;
    let content = document.getElementById('rulesContent').value;
    
    fetch('configs.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'action=save_rules&rulescfg=' + encodeURIComponent(rulesPath) + '&content=' + encodeURIComponent(content)
    })
    .then(response => response.text())
    .then(data => {
        if(data === 'success') {
            document.getElementById('rulesStatus').innerHTML = 
                '<div class="alert alert-success text-center mt-3" role="alert">' +
                '<i data-feather="check-circle" class="feather-sm me-2"></i>' +
                'Rules Successfully Saved</div>';
            feather.replace();
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const convertButton = document.getElementById('convertButton');
    if (convertButton) {
        convertButton.addEventListener('click', function(e) {
            e.preventDefault();
            let url = document.getElementById('urlInput').value;
            
            fetch('yamlconv.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: 'url=' + encodeURIComponent(url)
            })
            .then(response => response.text())
            .then(data => {
                document.getElementById('convertResult').value = data;
            })
            .catch(error => {
                console.error('Error:', error);
            });
        });
    }
});

function convertUrl() {
    var url = document.getElementById('urlInput').value;
    
    fetch('yamlconv.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'url=' + encodeURIComponent(url)
    })
    .then(response => response.text())
    .then(data => {
        document.getElementById('convertResult').value = data;
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('convertResult').value = 'Error: ' + error;
    });
}

function loadManagerTables() {
    fetch('manager.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'action=get_tables'
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('configTable').innerHTML = data.config;
        document.getElementById('proxyTable').innerHTML = data.proxy;
        document.getElementById('ruleTable').innerHTML = data.rule;
    });
}

function loadManagerModals() {
    fetch('manager.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'action=get_modals'
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('managerModals').innerHTML = data.config + data.proxy + data.rule;
    });
}

document.querySelector('a[href="#manager"]').addEventListener('shown.bs.tab', function (e) {
    loadManagerTables();
    loadManagerModals();
});

function topFunction() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
}

document.getElementById('uploadForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    let formData = new FormData(this);
    let pathSelector = formData.get('path_selector');
    
    if (pathSelector === 'BACKUP CONFIG') {
        fetch('manager.php', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/x-gzip')) {
                return response.blob().then(blob => {
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'neko_backup.tar.gz';
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                });
            }
            return response.json();
        })
        .then(data => {
            if (data && data.status) {
                Swal.fire({
                    icon: data.icon,
                    title: data.title,
                    text: data.message,
                    showConfirmButton: false,
                    timer: 1500,
                    position: 'top-end',
                    toast: true
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
        return;
    }
    
    fetch('manager.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.text())
    .then(data => {
        try {
            let json = JSON.parse(data);
            let uploadStatus = document.getElementById('uploadStatus');
            uploadStatus.style.display = 'block';
            uploadStatus.className = 'alert mt-3 alert-' + (json.status === 'success' ? 'success' : 'danger');
            uploadStatus.textContent = json.message;
            
            if (json.status === 'success') {
                this.reset();
                refreshTables();
            }
        } catch(e) {
            document.getElementById('uploadStatus').style.display = 'block';
            document.getElementById('uploadStatus').className = 'alert mt-3 alert-info';
            document.getElementById('uploadStatus').innerHTML = data;
        }
    })
    .catch(error => {
        document.getElementById('uploadStatus').style.display = 'block';
        document.getElementById('uploadStatus').className = 'alert mt-3 alert-danger';
        document.getElementById('uploadStatus').textContent = 'Error: ' + error.message;
    });
});

function refreshTables() {
    fetch('manager.php', {
        method: 'POST',
        body: new URLSearchParams({
            'action': 'get_tables'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.config) document.getElementById('configTable').innerHTML = data.config;
        if (data.proxy) document.getElementById('proxyTable').innerHTML = data.proxy;
        if (data.rule) document.getElementById('ruleTable').innerHTML = data.rule;

        return fetch('manager.php', {
            method: 'POST',
            body: new URLSearchParams({
                'action': 'get_modals'
            })
        });
    })
    .then(response => response.json())
    .then(data => {
        let modalContainer = document.getElementById('modalContainer');
        if (modalContainer) {
            modalContainer.innerHTML = data.config + data.proxy + data.rule;
        }
    })
    .catch(error => console.error('Error refreshing tables:', error));
}

function handleFileAction(action) {
    if (action.startsWith('down@')) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = 'configs.php';
        
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'file_action';
        input.value = action;
        
        form.appendChild(input);
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
        return;
    }
    
    const formData = new FormData();
    formData.append('file_action', action);
    
    if (action.startsWith('save@')) {
        const file_info = action.split('@')[1].split('/');
        const dir = file_info[3];
        const filename = file_info[4].split('.')[0];
        const textarea = document.querySelector(`textarea[name="form_${dir}_${filename}"]`);
        
        if (!textarea) {
            console.error('Textarea not found');
            return;
        }
        
        formData.append(`form_${dir}_${filename}`, textarea.value);
    }
    
    if (action.startsWith('del@')) {
        Swal.fire({
            title: 'Are you sure?',
            text: "File will be permanently deleted!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                sendRequest(formData);
            }
        });
        return;
    }
    
    sendRequest(formData);
}

function sendRequest(formData) {
    fetch('configs.php', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        if (response.headers.get('Content-Type')?.includes('application/json')) {
            return response.json();
        }
        return response;
    })
    .then(data => {
        if (data instanceof Response) {
            return;
        }
        Swal.fire({
            icon: data.icon || 'success',
            title: data.title || 'Success!',
            text: data.message,
            position: 'top-end',
            toast: true,
            timer: 3000,
            showConfirmButton: false
        });
        
        if (data.status === 'success') {
            const modal = bootstrap.Modal.getInstance(document.querySelector('.modal.show'));
            if (modal) modal.hide();
            loadManagerTables();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error!', 
            text: 'An error occurred: ' + error.message,
            position: 'top-end',
            toast: true,
            timer: 3000
        });
    });
}

document.addEventListener('click', function(e) {
    if (e.target && e.target.name === 'file_action') {
        e.preventDefault();
        const action = e.target.value;
        
        if (action.startsWith('down@')) {
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = 'configs.php';
            
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'file_action';
            input.value = action;
            
            form.appendChild(input);
            document.body.appendChild(form);
            form.submit();
            document.body.removeChild(form);
        } else {
            handleFileAction(action);
            const modal = bootstrap.Modal.getInstance(e.target.closest('.modal'));
            if (modal) modal.hide();
        }
    }
});

function saveFile(filePath, contentId) {
    const content = document.getElementById(contentId).value;
    const formData = new FormData();
    formData.append('file_action', 'save@' + filePath);
    formData.append('content', content);
    
    fetch('configs.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        Swal.fire({
            icon: data.icon,
            title: data.title,
            text: data.message,
            toast: true,
            position: 'top-end',
            timer: 3000,
            showConfirmButton: false
        });
        
        if (data.status === 'success') {
            bootstrap.Modal.getInstance(document.querySelector('.modal.show')).hide();
            loadManagerTables();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'System error occurred',
            toast: true,
            position: 'top-end',
            timer: 3000
        });
    });
}

function deleteFile(filePath) {
    Swal.fire({
        title: 'Delete file?',
        text: "File will be permanently deleted!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete!',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            const formData = new FormData();
            formData.append('file_action', 'del@' + filePath);
            
            fetch('configs.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                Swal.fire({
                    icon: 'success', 
                    title: 'Deleted!',
                    text: 'File successfully deleted',
                    toast: true,
                    position: 'top-end',
                    timer: 3000,
                    showConfirmButton: false
                });
                bootstrap.Modal.getInstance(document.querySelector('.modal.show')).hide();
                loadManagerTables();
            });
        }
    });
}

function downloadFile(filePath) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'configs.php';
    
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'file_action';
    input.value = 'down@' + filePath;
    
    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
}
</script>

<?php include './footer.php'; ?>

