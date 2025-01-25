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

ob_start();
include './cfg.php';
$cfg_path = "/etc/neko/config";
$proxy_path = "/etc/neko/proxy_provider";
$rule_path = "/etc/neko/rule_provider";
$arrPath = array($cfg_path, $proxy_path, $rule_path, "BACKUP CONFIG", "RESTORE CONFIG");

function create_table($path){
  $arr_table = glob("$path/*.yaml");
  $output = "";
  foreach ($arr_table as $file) {
    $file_info = explode("/", $file);
    $file_dir = $file_info[3];
    $file_name = explode(".", $file_info[4]);
    $output .= "<tr class=\"text-center\">\n";
    $output .= "  <td class=\"col-4\">".$file_info[4]." </br>[ ".formatSize(filesize($file))." - ".date('Y-m-d H:i:s', ((7*3600)+filemtime($file)))." ]"."</td>\n";
    $output .= "  <td class=\"col-2\">\n";
    $output .= "    <form action=\"configs.php\" method=\"post\">\n";
    $output .= "      <div class=\"btn-group col\" role=\"group\" aria-label=\"ctrl\">\n";
    $output .= "        <button type=\"submit\" name=\"file_action\" value=\"down@".$file."\" class=\"btn btn-info d-grid\"><i class=\"fa fa-download\"></i>Download</button>\n";
    $output .= "        <button type=\"button\" class=\"btn btn-primary d-grid\" data-bs-toggle=\"modal\" data-bs-target=\"#".$file_dir."_".$file_name[0]."\"><i class=\"fa fa-gear\"></i>Option</button>\n";
    $output .= "      </div>\n";
    $output .= "    </form>\n";
    $output .= "  </td>\n";
    $output .= "</tr>\n";
  }
  return $output;
}

function create_modal($path) {
    $output = "";
    $arr_modal = glob("$path/*.yaml");
    foreach ($arr_modal as $file) {
        $file_info = explode("/", $file);
        $file_dir = $file_info[3];
        $file_name = explode(".", $file_info[4]);
        
        $output .= "<div class=\"modal fade\" id=\"".$file_dir."_".$file_name[0]."\" tabindex=\"-1\">\n";
        $output .= "    <div class=\"modal-dialog modal-xl modal-fullscreen-md-down\">\n";
        $output .= "        <div class=\"modal-content\">\n";
        $output .= "            <div class=\"modal-header\">\n";
        $output .= "                <h5 class=\"modal-title\">".$file_info[4]."</h5>\n";
        $output .= "                <button type=\"button\" class=\"btn-close\" data-bs-dismiss=\"modal\"></button>\n";
        $output .= "            </div>\n";
        $output .= "            <div class=\"modal-body\">\n";
        $output .= "                <textarea id=\"content_".$file_dir."_".$file_name[0]."\" class=\"form-control\" rows=\"15\">".htmlspecialchars(file_get_contents($file))."</textarea>\n";
        $output .= "            </div>\n";
        $output .= "            <div class=\"modal-footer\">\n";
        $output .= "                <button type=\"button\" class=\"btn btn-danger\" onclick=\"deleteFile('".$file."')\">Delete</button>\n";
        $output .= "                <button type=\"button\" class=\"btn btn-success\" onclick=\"saveFile('".$file."', 'content_".$file_dir."_".$file_name[0]."')\">Save</button>\n";
        $output .= "                <button type=\"button\" class=\"btn btn-info\" onclick=\"downloadFile('".$file."')\">Download</button>\n";
        $output .= "                <button type=\"button\" class=\"btn btn-secondary\" data-bs-dismiss=\"modal\">Close</button>\n";
        $output .= "            </div>\n";
        $output .= "        </div>\n";
        $output .= "    </div>\n";
        $output .= "</div>\n";
    }
    return $output;
}

function up_controller($dir) {
    header('Content-Type: application/json');
    
    try {
        if (!isset($_FILES["file_upload"]) || $_FILES["file_upload"]["error"] !== UPLOAD_ERR_OK) {
            throw new Exception("Failed to upload file");
        }

        $target_file = $dir . "/" . basename($_FILES["file_upload"]["name"]);
        $fileType = strtolower(pathinfo($target_file, PATHINFO_EXTENSION));
        
        if (!in_array($fileType, ['yaml', 'yml'])) {
            throw new Exception("Only .yaml, .yml files are allowed");
        }
        
        if (strpos($target_file, ' ') !== false) {
            throw new Exception("File names cannot contain spaces");
        }
        
        if (!move_uploaded_file($_FILES["file_upload"]["tmp_name"], $target_file)) {
            throw new Exception("Failed to upload file");
        }
        
        echo json_encode([
            'status' => 'success',
            'title' => 'Success!',
            'message' => "File " . basename($_FILES["file_upload"]["name"]) . " has been uploaded",
            'icon' => 'success'
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'status' => 'error',
            'title' => 'Error!',
            'message' => $e->getMessage(),
            'icon' => 'error'
        ]);
    }
    exit;
}

function action_controller($action_str) {
    try {
        $action = explode("@", $action_str);
        if (count($action) != 2) {
            throw new Exception("Invalid action format");
        }
        
        $command = $action[0];
        $file_path = $action[1];
        
        if (!file_exists($file_path)) {
            throw new Exception("File not found");
        }
        
        switch($command) {
            case "down":
                ob_clean();
                header('Content-Description: File Transfer');
                header('Content-Type: application/octet-stream');
                header('Content-Disposition: attachment; filename="'.basename($file_path).'"');
                header('Expires: 0');
                header('Cache-Control: must-revalidate');
                header('Pragma: public');
                header('Content-Length: ' . filesize($file_path));
                readfile($file_path);
                exit;
                
            case "save":
                $content = $_POST['content'] ?? null;
                if ($content === null) {
                    throw new Exception("Content not found");
                }
                
                if (file_put_contents($file_path, $content) === false) {
                    throw new Exception("Failed to save file");
                }
                
                return [
                    'status' => 'success',
                    'title' => 'Success!',
                    'message' => "File " . basename($file_path) . " has been saved",
                    'icon' => 'success'
                ];
                
            case "del":
                if (!unlink($file_path)) {
                    throw new Exception("Failed to delete file");
                }
                return [
                    'status' => 'success',
                    'title' => 'Success!',
                    'message' => "File " . basename($file_path) . " has been deleted",
                    'icon' => 'success'
                ];
                
            default:
                throw new Exception("Invalid operation");
        }
    } catch (Exception $e) {
        return [
            'status' => 'error',
            'title' => 'Error!',
            'message' => $e->getMessage(),
            'icon' => 'error'
        ];
    }
}

function formatSize($bytes) {
  if ($bytes >= 1073741824) {
      return number_format($bytes / 1073741824, 2) . ' GB';
  } elseif ($bytes >= 1048576) {
      return number_format($bytes / 1048576, 2) . ' MB';
  } elseif ($bytes >= 1024) {
      return number_format($bytes / 1024, 2) . ' KB';
  } else {
      return number_format($bytes, 2) . ' B';
  }
}

function restore_controller(){
  $target_file = "/etc/neko/" . basename($_FILES["file_upload"]["name"]);
  $upload_stat = 1;
  $fileType = strtolower(pathinfo($target_file, PATHINFO_EXTENSION));
  $str_prnt = "";
  if ($fileType !== 'gz') {
    $str_prnt = "</br>Only <b>.tar.gz</b> files are allowed.";
    $upload_stat = 0;
  }
  if (strpos($target_file, ' ') !== false) {
    $str_prnt = "</br>File names with spaces are not allowed.";
    $upload_stat = 0;
  }
  if ($upload_stat == 0) {
    echo $str_prnt."</br>File not uploaded.";
    return $target_file."tmp.gz";
  }
  else {
    if (move_uploaded_file($_FILES["file_upload"]["tmp_name"], $target_file)) {
      echo "</br>File <b>" . htmlspecialchars(basename($_FILES["file_upload"]["name"])) . "</b> has been uploaded.</br>";
      return $target_file;
    } 
    else {
      echo "ERROR uploading your files.";
    }
  }
}

function backupConfig(){
    try {
        while (ob_get_level()) {
            ob_end_clean();
        }
        
        shell_exec("/etc/neko/core/neko -b");
        
        sleep(1);
        
        $backup_files = glob("/tmp/neko_backup_*.tar.gz");
        if (empty($backup_files)) {
            throw new Exception('Backup file not found');
        }
        
        usort($backup_files, function($a, $b) {
            return filemtime($b) - filemtime($a);
        });
        $file_path = $backup_files[0];
        
        if (!file_exists($file_path)) {
            throw new Exception('Backup file not found or not accessible');
        }

        header('Content-Description: File Transfer');
        header('Content-Type: application/x-gzip');
        header('Content-Disposition: attachment; filename="'.basename($file_path).'"');
        header('Content-Transfer-Encoding: binary');
        header('Expires: 0');
        header('Cache-Control: must-revalidate');
        header('Pragma: public');
        header('Content-Length: ' . filesize($file_path));
        
        if (!readfile($file_path)) {
            throw new Exception('Failed to send file');
        }
        
        foreach ($backup_files as $old_file) {
            if ($old_file != $file_path) {
                @unlink($old_file);
            }
        }
        
        @unlink($file_path);
        exit;
        
    } catch (Exception $e) {
        header('Content-Type: application/json');
        echo json_encode([
            'status' => 'error',
            'title' => 'Error!',
            'message' => $e->getMessage(),
            'icon' => 'error'
        ]);
        exit;
    }
}

function restoreConfig(){
    $str = restore_controller();
    if (file_exists($str)){
        shell_exec("/etc/neko/core/neko -x");
        $filename = basename($str);
        $response = array(
            'status' => 'success',
            'file' => $filename,
            'message' => "Configuration from $filename has been restored successfully"
        );
    } else {
        $response = array(
            'status' => 'error',
            'message' => 'Failed to restore configuration'
        );
    }
    
    ob_clean();
    header('Content-Type: application/json');
    echo json_encode($response, JSON_UNESCAPED_SLASHES);
    exit;
}

if(isset($_POST["path_selector"])) {
    if ($_POST['path_selector'] == 'Option') {
        echo "Please, select the correct Options!!!";
    } elseif ($_POST['path_selector'] == 'BACKUP CONFIG') {
        backupConfig();
    } elseif ($_POST['path_selector'] == 'RESTORE CONFIG') {
        restoreConfig();
    } else {
        up_controller($_POST['path_selector']);
    }
}

if(isset($_POST["file_action"])) {
    $response = action_controller($_POST["file_action"]);
    if (!empty($response)) {
        header('Content-Type: application/json');
        echo json_encode($response);
    }
    exit;
}

if(isset($_POST['action'])) {
    if($_POST['action'] == 'get_tables') {
        ob_clean();
        $response = array(
            'config' => create_table($cfg_path),
            'proxy' => create_table($proxy_path),
            'rule' => create_table($rule_path)
        );
        header('Content-Type: application/json');
        echo json_encode($response);
        exit;
    }
    
    if($_POST['action'] == 'get_modals') {
        ob_clean();
        $response = array(
            'config' => create_modal($cfg_path),
            'proxy' => create_modal($proxy_path),
            'rule' => create_modal($rule_path)
        );
        header('Content-Type: application/json');
        echo json_encode($response);
        exit;
    }
}
?>

