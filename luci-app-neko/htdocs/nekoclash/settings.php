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

$themeDir = "$neko_www/assets/theme";
$arrFiles = array();
$arrFiles = glob("$themeDir/*.css");

$neko_version = exec("opkg list-installed | grep luci-app-neko | cut -d ' - ' -f3");
$neko_latest = exec("curl -m 5 -f -s https://raw.githubusercontent.com/nosignals/openwrt-neko/main/luci-app-neko/Makefile | grep PKG_VERSION: | cut -d= -f2");
$stat = 0;
if ($neko_version == $neko_latest){
    $stat = 0;
}
else {
    $stat = 1;
}

for($x=0;$x<count($arrFiles);$x++) $arrFiles[$x] = substr($arrFiles[$x], strlen($themeDir)+1);

if(isset($_POST['themechange'])){
    $dt = $_POST['themechange'];
    shell_exec("uci set neko.cfg.theme='$dt' && uci commit neko");
    $neko_theme = $dt;
}
if(isset($_POST['fw'])){
    $dt = $_POST['fw'];
    if ($dt == 'enable') shell_exec("uci set neko.cfg.new_interface='1' && uci commit neko");
    if ($dt == 'disable') shell_exec("uci set neko.cfg.new_interface='0' && uci commit neko");
}
if(isset($_POST['neko'])){
    $dt = $_POST['neko'];
    if ($dt == 'update'){
        updateNeko();
    }
}
if(isset($_POST['core_mode'])){
    $dt = $_POST['core_mode'];
    shell_exec("uci set neko.cfg.core_mode='$dt' && uci commit neko");
    $core_mode = $dt;
}
if(isset($_POST['show_ip'])){
    $show_ip = $_POST['show_ip'];
    shell_exec("uci set neko.cfg.show_ip='$show_ip' && uci commit neko");
}
if(isset($_POST['show_isp'])){
    $show_isp = $_POST['show_isp'];
    shell_exec("uci set neko.cfg.show_isp='$show_isp' && uci commit neko");
}
if(isset($_POST['show_luci'])){
    $show_luci = $_POST['show_luci'];
    shell_exec("uci set neko.cfg.show_luci='$show_luci' && uci commit neko");
}
function updateNeko(){
    $neko_latest = exec("curl -m 5 -f -s https://raw.githubusercontent.com/nosignals/openwrt-neko/main/luci-app-neko/Makefile | grep PKG_VERSION: | cut -d= -f2");
    if(!empty($neko_latest)){
        $url_update = "https://github.com/nosignals/openwrt-neko/releases/download/luci-app-neko_".$neko_latest."/luci-app-neko_".$neko_latest."_all.ipk";
        $str_update = <<<EOF
        #/bin/bash
        wget -O /tmp/neko.ipk $url_update
        cd /tmp
        opkg remove luci-app-neko
        opkg install neko.ipk
        rm -r /tmp/neko.ipk
        EOF;
        echo "<h1>UPDATING NEKO TO VERSION ".$neko_latest."</br>";
        echo "DONT CLOSE THIS TAB</br></h1>";
        echo "if in 30s not showing notification, you can try again update";
        file_put_contents('/tmp/neko_update', $str_update);
        exec("chmod +x /tmp/neko_update");
        shell_exec("/tmp/neko_update");
        echo "<h1>Done Updating, Please reload this tab</h1>";
        shell_exec("rm /tmp/neko_update");
    }
    else{
        echo "<h1>Check your Internet Connection!!!.</h1>";
    }
}
$fwstatus=shell_exec("uci get neko.cfg.new_interface");
?>
<?php include './header.php'; ?>
  <?php include './navbar.php'; ?>
  <div class="container p-3">
        <div class="card">
            <div class="card-header d-flex align-items-center">
                <i data-feather="settings" class="feather-sm me-2"></i>
                <h5 class="card-title mb-0">Core Settings</h5>
            </div>
            <div class="card-body">
                <?php 
                    $neko_status = exec("uci -q get neko.cfg.enabled");
                    $current_core = exec("uci -q get neko.cfg.core_mode");
                ?>
                <?php if($neko_status == '1'): ?>
                <div class="alert alert-info">
                    <i data-feather="info" class="feather-sm me-2"></i>
                    Core <?php echo strtoupper($current_core); ?> is currently running. Please stop the service first to change the core.
                </div>
                <?php endif; ?>

                <form action="settings.php" method="post">
                    <div class="mb-3">
                        <label for="core_mode" class="form-label">Select Core Mode:</label>
                        <select name="core_mode" id="core_mode" class="form-select" <?php if($neko_status == '1') echo 'disabled'; ?>>
                            <option value="mihomo" <?php if($current_core == 'mihomo') echo 'selected'; ?>>Core Mihomo</option>
                            <option value="singbox" <?php if($current_core == 'singbox') echo 'selected'; ?>>Core Singbox</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary" <?php if($neko_status == '1') echo 'disabled'; ?>>Save</button>
                </form>
            </div>
        </div>
    </div>
    <div class="container p-3">
        <div class="card">
            <div class="card-header d-flex align-items-center">
                <i data-feather="settings" class="feather-sm me-2"></i>
                <h5 class="card-title mb-0">Neko Settings</h5>
            </div>
            <div class="card-body">
                <?php 
                    $show_ip = exec("uci -q get neko.cfg.show_ip");
                    $show_isp = exec("uci -q get neko.cfg.show_isp");
                    $show_luci = exec("uci -q get neko.cfg.show_luci");
                ?>
                <form action="settings.php" method="post">
                    <div class="mb-3">
                        <label class="form-label">Show IP Address:</label>
                        <select name="show_ip" class="form-select">
                            <option value="1" <?php if($show_ip == '1') echo 'selected'; ?>>Enable</option>
                            <option value="0" <?php if($show_ip == '0') echo 'selected'; ?>>Disable</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Show ISP:</label>
                        <select name="show_isp" class="form-select">
                            <option value="1" <?php if($show_isp == '1') echo 'selected'; ?>>Enable</option>
                            <option value="0" <?php if($show_isp == '0') echo 'selected'; ?>>Disable</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Show Neko on LuCI:</label>
                        <select name="show_luci" class="form-select">
                            <option value="1" <?php if($show_luci == '1') echo 'selected'; ?>>Enable</option>
                            <option value="0" <?php if($show_luci == '0') echo 'selected'; ?>>Disable</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary">Save</button>
                </form>
            </div>
        </div>
    </div>
    <div class="container p-3">
        <div class="card">
            <div class="card-header d-flex align-items-center">
                <i data-feather="info" class="feather-sm me-2"></i>
                <h5 class="card-title mb-0">Software Information</h5>
            </div>
            <div class="card-body">
                <table class="table table-borderless mb-3">
                    <tbody>
                        <tr>
                            <td class="col-2">Auto Reload Firewall</td>
                            <form action="settings.php" method="post">
                                <td class="d-grid">
                                    <div class="btn-group col" role="group" aria-label="ctrl">
                                        <button type="submit" name="fw" value="enable" class="btn btn<?php if($fwstatus==1) echo "-outline" ?>-success <?php if($fwstatus==1) echo "disabled" ?> d-grid">Enable</button>
                                        <button type="submit" name="fw" value="disable" class="btn btn<?php if($fwstatus==0) echo "-outline" ?>-warning <?php if($fwstatus==0) echo "disabled" ?> d-grid">Disable</button>
                                    </div>
                                </td>
                            </form>
                        </tr>
                        <tr>
                            <td class="col-1">Client Version</td>
                            <td class="col-4">
                                <div class="form-control text-center" id="cliver">-</div>
                            </td>
                            <td class="col-1">
                                <form action="settings.php" method="post">
                                    <button type="submit" name="neko" value="update" class="btn btn-primary <?php if($stat==0) echo "disabled " ?>col-10">Update</button>
                                </form>
                            </td>
                        </tr>
                        <tr>
                            <td class="col-1">Core Version</td>
                            <td class="col-4">
                                <div class="form-control text-center" id="corever">-</div>
                            </td>
                            <td class="col-1">
                                <a class="btn btn-primary col-10" target="_blank" href="https://github.com/nosignals/openwrt-neko/releases">Update</a>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
        <div class="container p-3">
            <div class="card">
                <div class="card-header d-flex align-items-center">
                    <i data-feather="info" class="feather-sm me-2"></i>
                    <h5 class="card-title mb-0">About</h5>
                </div>
                <div class="card-body">
                    <div class="text-center">
                        <h5 class="mb-3">NekoClash</h5>
                        <p>NekoClash is a family friendly Clash Proxy tool, this tool makes it easy for users to use Clash Proxy, and User can modify your own Theme based Bootstrap, inspired by OpenClash Tools. NekoClash has writen by PHP, and BASH.</p>
                        <p>This tool aims to make it easier to use Clash Proxy</p>
                        <p>If you have questions or feedback about NekoClash you can contact me on the <span class="badge bg-indigo"><b>DBAI Discord Server</b></span> link below</p>

                        <h5 class="mb-3">External Links</h5>
                        <div class="container mb-4">
                            <div class="row g-3 justify-content-center">
                                <div class="col-md-6">
                                    <div class="d-grid">
                                        <a class="btn btn-outline-info" target="_blank" href="https://discord.gg/vtV5QSq6D6">
                                            <i data-feather="message-circle" class="feather-sm me-2"></i>
                                            DBAI Discord
                                        </a>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="d-grid">
                                        <a class="btn btn-outline-info" target="_blank" href="https://github.com/nosignals">
                                            <i data-feather="github" class="feather-sm me-2"></i>
                                            Github
                                        </a>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="d-grid">
                                        <a class="btn btn-outline-info" target="_blank" href="https://www.facebook.com/groups/indowrt">
                                            <i data-feather="facebook" class="feather-sm me-2"></i>
                                            indoWRT Group
                                        </a>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="d-grid">
                                        <a class="btn btn-outline-info" target="_blank" href="https://github.com/MetaCubeX/mihomo">
                                            <i data-feather="box" class="feather-sm me-2"></i>
                                            Mihomo
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <p class="mb-0">Please don't <b>CHANGE</b> or <b>REMOVE</b> this Credit!.</p>
                    </div>
                </div>
            </div>
        </div>
<?php include './footer.php'; ?>