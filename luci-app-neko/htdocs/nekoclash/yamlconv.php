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
$tmpdata = $neko_www."/lib/tmp.txt";

if(isset($_POST['url'])) {
    $dt = $_POST['url'];
    
    // Cek apakah ini adalah subscription URL
    if (strpos($dt, '/sub/') !== false) {
        // Gunakan curl untuk mengambil konten
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $dt);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        $content = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode == 200 && !empty($content)) {
            // Decode base64
            $decoded = base64_decode($content);
            if ($decoded) {
                // Split multiple configs
                $configs = explode("\n", $decoded);
                $outcfg = "";
                
                foreach ($configs as $config) {
                    if (empty(trim($config))) continue;
                    
                    $basebuff = parse_url($config);
                    if (!$basebuff || !isset($basebuff['scheme'])) continue;
                    
                    // Buat temporary file untuk setiap config
                    $tmpfile = $tmpdata . "_" . uniqid();
                    
                    if ($basebuff['scheme'] == "vmess") {
                        parseVmess($basebuff, $tmpfile);
                    } else if (in_array($basebuff['scheme'], ["vless", "trojan", "ss"])) {
                        parseUrl($basebuff, $tmpfile);
                    }
                    
                    // Gabungkan hasil
                    if (file_exists($tmpfile)) {
                        $outcfg .= shell_exec("cat $tmpfile") . "\n";
                        shell_exec("rm -f $tmpfile");
                    }
                }
                
                // Simpan hasil gabungan
                exec("echo \"$outcfg\" > $tmpdata");
                echo $outcfg;
                shell_exec("rm -f $tmpdata");
                exit;
            }
        }
        
        echo "ERROR: Cannot fetch subscription content";
        exit;
    }
    
    // Kode existing untuk single URL
    $basebuff = parse_url($dt);
    if (!$basebuff || !isset($basebuff['scheme'])) {
        echo "ERROR: Invalid URL format!";
        exit;
    }
    
    $tmp = $basebuff['scheme']."://";
    if ($basebuff['scheme'] == "vless") parseUrl($basebuff,$tmpdata);
    else if ($basebuff['scheme'] == "vmess") parseVmess($basebuff,$tmpdata);
    else if ($basebuff['scheme'] == "trojan") parseUrl($basebuff,$tmpdata);
    else if ($basebuff['scheme'] == "ss") parseUrl($basebuff,$tmpdata);
    else exec("echo \"ERROR, PLEASE CHECK YOUR URL!\ntrojan://...\nvless://...\nss://...\nvmess://...\nYOU ENTERED : $tmp\" > $tmpdata");
    
    if (file_exists($tmpdata)) {
        $strdata = shell_exec("cat $tmpdata");
        echo $strdata;
        shell_exec("rm -f $tmpdata");
    } else {
        echo "Error: Could not create output file";
    }
    exit;
}
function parseVmess($base,$tmpdata){
    $decoded = base64_decode($base['host']);
    $urlparsed = array();
    $arrjs = json_decode($decoded,true);
    if (!empty($arrjs['v'])){
        $urlparsed['cfgtype'] = isset($base['scheme']) ? $base['scheme'] : '';
        $urlparsed['name'] = isset($arrjs['ps']) ? $arrjs['ps'] : '';
        $urlparsed['host'] = isset($arrjs['add']) ? $arrjs['add'] : '';
        $urlparsed['port'] = isset($arrjs['port']) ? $arrjs['port'] : '';
        $urlparsed['uuid'] = isset($arrjs['id']) ? $arrjs['id'] : '';
        $urlparsed['alterId'] = isset($arrjs['aid']) ? $arrjs['aid'] : '';
        $urlparsed['type'] = isset($arrjs['net']) ? $arrjs['net'] : '';
        $urlparsed['path'] = isset($arrjs['path']) ? $arrjs['path'] : '';
        $urlparsed['security'] = isset($arrjs['type']) ? $arrjs['type'] : '';
        $urlparsed['sni'] = isset($arrjs['host']) ? $arrjs['host'] : '';
        $urlparsed['tls'] = isset($arrjs['tls']) ? $arrjs['tls'] : '';
        $urlparsed['serviceName'] = isset($arrjs['path']) ? $arrjs['path'] : '';
        printcfg($urlparsed,$tmpdata);
    } else exec("echo \"DECODING FAILED!\nPLEASE CHECK YOUR URL!\" > $tmpdata");
}
function parseUrl($basebuff,$tmpdata){
    $urlparsed = array();
    $querybuff = array();
    $urlparsed['cfgtype'] = isset($basebuff['scheme']) ? $basebuff['scheme'] : '';
	$urlparsed['name'] = isset($basebuff['fragment']) ? $basebuff['fragment'] : '';
	$urlparsed['host'] = isset($basebuff['host']) ? $basebuff['host'] : '';
	$urlparsed['port'] = isset($basebuff['port']) ? $basebuff['port'] : '';

    if($urlparsed['cfgtype'] == "ss"){
        $urlparsed['uuid'] = isset($basebuff['user']) ? $basebuff['user'] : '';
        $basedata = explode(":", base64_decode($urlparsed['uuid']));
        $urlparsed['cipher'] = $basedata[0];
        $urlparsed['uuid'] = $basedata[1];
        
    }else $urlparsed['uuid'] = isset($basebuff['user']) ? $basebuff['user'] : '';

    if($urlparsed['cfgtype'] == "ss"){
        $tmpbuff = array();
        $tmpstr = "";
        $tmpquery = isset($basebuff['query']) ? $basebuff['query'] : '';
        $tmpquery2 = explode(";", $tmpquery);
        for($x = 0; $x < count($tmpquery2); $x++){
            $tmpstr .= $tmpquery2[$x]."&";
        }
        parse_str($tmpstr,$querybuff);
        $urlparsed['mux'] = isset($querybuff['mux']) ? $querybuff['mux'] : '';
        $urlparsed['host2'] = isset($querybuff['host2']) ? $querybuff['host2'] : '';
    }else parse_str($basebuff['query'],$querybuff);

    $urlparsed['type'] = isset($querybuff['type']) ? $querybuff['type'] : '';
	$urlparsed['path'] = isset($querybuff['path']) ? $querybuff['path'] : '';
    $urlparsed['mode'] = isset($querybuff['mode']) ? $querybuff['mode'] : '';
    $urlparsed['plugin'] = isset($querybuff['plugin']) ? $querybuff['plugin'] : '';
    $urlparsed['security'] = isset($querybuff['security']) ? $querybuff['security'] : '';
    $urlparsed['encryption'] = isset($querybuff['encryption']) ? $querybuff['encryption'] : '';
    $urlparsed['serviceName'] = isset($querybuff['serviceName']) ? $querybuff['serviceName'] : '';
    $urlparsed['sni'] = isset($querybuff['sni']) ? $querybuff['sni'] : '';
    printcfg($urlparsed,$tmpdata);
    //print_r ($basebuff);
    //print_r ($querybuff);
    //print_r ($urlparsed);
}
function printcfg($data,$tmpdata){
    $outcfg="";
    if ($data['cfgtype'] == "vless"){
        if(!empty($data['name'])) $outcfg .= "- name: ".$data['name']."\n";
        else $outcfg .= "- name: VLESS\n";
        $outcfg .= "  type: ".$data['cfgtype']."\n";
        $outcfg .= "  server: ".$data['host']."\n";
        $outcfg .= "  port: ".$data['port']."\n";
        $outcfg .= "  uuid: ".$data['uuid']."\n";
        $outcfg .= "  cipher: auto\n";
        $outcfg .= "  tls: true\n";
        $outcfg .= "  alterId: 0\n";
        $outcfg .= "  flow: xtls-rprx-direct\n";
        if(!empty($data['sni'])) $outcfg .= "  servername: ".$data['sni']."\n";
        else $outcfg .= "  servername: ".$data['host']."\n";
        if ($data['type'] == "ws"){
            $outcfg .= "  network: ".$data['type']."\n";
            $outcfg .= "  ws-opts: \n";
            $outcfg .= "   path: ".$data['path']."\n";
            $outcfg .= "   Headers: \n";
            $outcfg .= "      Host: ".$data['host']."\n";
        }
        else if($data['type'] == "grpc"){
            $outcfg .= "  network: ".$data['type']."\n";
            $outcfg .= "  grpc-opts: \n";
            $outcfg .= "   grpc-service-name: ".$data['serviceName']."\n";
        }
        $outcfg .= "  udp: true\n";
        $outcfg .= "  skip-cert-verify: true \n";
        exec("echo \"$outcfg\" > $tmpdata");
        //echo $outcfg;
    }
    else if ($data['cfgtype'] == "trojan" ){
        if(!empty($data['name'])) $outcfg .= "- name: ".$data['name']."\n";
        else $outcfg .= "- name: TROJAN\n";
        $outcfg .= "  type: ".$data['cfgtype']."\n";
        $outcfg .= "  server: ".$data['host']."\n";
        $outcfg .= "  port: ".$data['port']."\n";
        $outcfg .= "  password: ".$data['uuid']."\n";
        if(!empty($data['sni'])) $outcfg .= "  sni: ".$data['sni']."\n";
        else $outcfg .= "  sni: ".$data['host']."\n";
        if ($data['type'] == "ws"){
            $outcfg .= "  network: ".$data['type']."\n";
            $outcfg .= "  ws-opts: \n";
            $outcfg .= "   path: ".$data['path']."\n";
            $outcfg .= "   Headers: \n";
            $outcfg .= "      Host: ".$data['host']."\n";
        }
        else if($data['type'] == "grpc"){
            $outcfg .= "  network: ".$data['type']."\n";
            $outcfg .= "  grpc-opts: \n";
            $outcfg .= "   grpc-service-name: ".$data['serviceName']."\n";
        }
        $outcfg .= "  udp: true\n";
        $outcfg .= "  skip-cert-verify: true \n";
        exec("echo \"$outcfg\" > $tmpdata");
        //echo $outcfg;
    }
    else if ($data['cfgtype'] == "ss" ){
        if(!empty($data['name'])) $outcfg .= "- name: ".$data['name']."\n";
        else $outcfg .= "- name: SHADOWSOCKS\n";
        $outcfg .= "  type: ".$data['cfgtype']."\n";
        $outcfg .= "  server: ".$data['host']."\n";
        $outcfg .= "  port: ".$data['port']."\n";
        $outcfg .= "  cipher: ".$data['cipher']."\n";
        $outcfg .= "  password: ".$data['uuid']."\n";
        if ($data['plugin'] == "v2ray-plugin" | $data['plugin'] == "xray-plugin"){
            $outcfg .= "  plugin: ".$data['plugin']."\n";
            $outcfg .= "  plugin-opts: \n";
            $outcfg .= "   mode: websocket\n";
            $outcfg .= "   # path: ".$data['path']."\n";
            $outcfg .= "   mux: ".$data['mux']."\n";
            $outcfg .= "   # tls: true \n";
            $outcfg .= "   # skip-cert-verify: true \n";
            $outcfg .= "   # headers: \n";
            $outcfg .= "   #    custom: value\n";
        }
        else if($data['plugin'] == "obfs"){
            $outcfg .= "  plugin: ".$data['plugin']."\n";
            $outcfg .= "  plugin-opts: \n";
            $outcfg .= "   mode: tls\n";
            $outcfg .= "   # host: ".$data['host2']."\n";
        }
        $outcfg .= "  udp: true\n";
        $outcfg .= "  skip-cert-verify: true \n";
        exec("echo \"$outcfg\" > $tmpdata");
        //echo $outcfg;
    }
    if ($data['cfgtype'] == "vmess"){
        if(!empty($data['name'])) $outcfg .= "- name: ".$data['name']."\n";
        else $outcfg .= "- name: VMESS\n";
        $outcfg .= "  type: ".$data['cfgtype']."\n";
        $outcfg .= "  server: ".$data['host']."\n";
        $outcfg .= "  port: ".$data['port']."\n";
        $outcfg .= "  uuid: ".$data['uuid']."\n";
        $outcfg .= "  alterId: ".$data['alterId']."\n";
        $outcfg .= "  cipher: auto\n";
        if($data['tls']== "tls") $outcfg .= "  tls: true\n";
        else $outcfg .= "  tls: false\n";
        if(!empty($data['sni'])) $outcfg .= "  servername: ".$data['sni']."\n";
        else $outcfg .= "  servername: ".$data['host']."\n";
        $outcfg .= "  network: ".$data['type']."\n";
        if ($data['type'] == "ws"){
            $outcfg .= "  ws-opts: \n";
            $outcfg .= "   path: ".$data['path']."\n";
            $outcfg .= "   Headers: \n";
            $outcfg .= "      Host: ".$data['sni']."\n";
        }
        else if($data['type'] == "grpc"){
            $outcfg .= "  grpc-opts: \n";
            $outcfg .= "   grpc-service-name: ".$data['serviceName']."\n";
        }
        else if($data['type'] == "h2"){
            $outcfg .= "  h2-opts: \n";
            $outcfg .= "   host: \n";
            $outcfg .= "     - google.com \n";
            $outcfg .= "     - bing.com \n";
            $outcfg .= "   path: ".$data['path']."\n";
        }
        else if($data['type'] == "http"){
            $outcfg .= "  # http-opts: \n";
            $outcfg .= "  #   method: \"GET\"\n";
            $outcfg .= "  #   path: \n";
            $outcfg .= "  #     - '/'\n";
            $outcfg .= "  #   headers: \n";
            $outcfg .= "  #     Connection: \n";
            $outcfg .= "  #       - keep-alive\n";
        }
        $outcfg .= "  udp: true\n";
        $outcfg .= "  skip-cert-verify: true \n";
        exec("echo \"$outcfg\" > $tmpdata");
        //echo $outcfg;
    }
}
$strdata = shell_exec("cat $tmpdata");
shell_exec("rm -f $tmpdata");
?>