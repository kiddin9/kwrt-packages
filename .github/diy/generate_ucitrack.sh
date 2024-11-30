#!/bin/bash

# 遍历所有的luci-app-*目录
for app_dir in luci-app-*; do
    # 检查是否是目录
    if [ -d "$app_dir" ]; then
        # 检查ucitrack目录是否存在
        if [ ! -d "$app_dir/root/usr/share/ucitrack" ]; then
            # 获取应用名称（去掉luci-app-前缀）
            app_name=${app_dir#luci-app-}
            
            # 初始化变量
            config_file=""
            init_file=""
            
            # 查找config文件
            if [ -d "$app_dir/root/etc/config" ]; then
                # 获取config目录下的第一个文件名
                config_file=$(ls "$app_dir/root/etc/config" 2>/dev/null | head -n 1)
            fi
            
            # 查找init文件
            if [ -d "$app_dir/root/etc/init.d" ]; then
                # 获取init.d目录下的第一个文件名
                init_file=$(ls "$app_dir/root/etc/init.d" 2>/dev/null | head -n 1)
            fi
            
            # 如果找到了任意一个文件
            if [ ! -z "$config_file" ] || [ ! -z "$init_file" ]; then
                # 创建ucitrack目录
                mkdir -p "$app_dir/root/usr/share/ucitrack"
                
                # 创建json文件
                cat > "$app_dir/root/usr/share/ucitrack/$app_name.json" << EOF
{
	"config": "$config_file",
	"init": "$init_file"
}
EOF
                echo "Created ucitrack for $app_dir"
            fi
        else
            echo "Skipping $app_dir - ucitrack directory already exists"
        fi
    fi
done
