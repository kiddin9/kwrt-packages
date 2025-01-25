<?php
include '../cfg.php';
$neko_log_path="$neko_dir/tmp/log.txt";
$core_mode = exec("uci -q get neko.cfg.core_mode");

if ($core_mode === 'mihomo') {
    $binary_log_path = "$neko_dir/tmp/neko_log.txt";
    $core_bin = $neko_bin;
} elseif ($core_mode === 'singbox') {
    $binary_log_path = "$neko_dir/tmp/singbox_log.txt";
    $core_bin = "/usr/bin/sing-box";
}

$host_now=$_SERVER['SERVER_NAME'];

if(isset($_GET['data'])){
    $dt = $_GET['data'];
    if ($dt == 'neko') {
        echo shell_exec("cat $neko_log_path");
    }
    else if($dt == 'bin') {
        if ($core_mode === 'mihomo') {
            echo shell_exec("cat $binary_log_path | awk -F'[\"T.= ]' '{print \"[ \" $4 \" ] \" toupper($8) \" :\", substr($0,index($0,$11))}' | sed 's/.$//'");
        } elseif ($core_mode === 'singbox') {
            echo shell_exec("cat $binary_log_path");
        }
    }
    else if($dt == 'neko_ver') {
        echo exec("$neko_dir/core/neko -v");
    }
    else if($dt == 'core_ver') {
        if ($core_mode === 'mihomo') {
            echo exec("$core_bin -v | head -1 | awk '{print $5 \" \" $3}'");
        } elseif ($core_mode === 'singbox') {
            echo exec("$core_bin version");
        }
    }
    else if($dt == 'url_dash'){
        header("Content-type: application/json; charset=utf-8");
        $yacd = exec (" curl -m 5 -f -s $host_now/nekoclash/dashboard.php | grep 'href=\"h' | cut -d '\"' -f6 | head -1");
        $meta = exec (" curl -m 5 -f -s $host_now/nekoclash/dashboard.php | grep 'href=\"h' | cut -d '\"' -f6 | tail -1");
        echo "{\n";
        echo "  \"yacd\":\"$yacd\",\n";
        echo "  \"meta\":\"$meta\"\n";
        echo "}";
    }
}
?>
