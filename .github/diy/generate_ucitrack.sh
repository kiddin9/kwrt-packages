#!/bin/bash

find . -path "*/root/usr/share/ucitrack/*.json" -type f | while read -r json_file; do
    # 使用 sed 检查并替换格式，匹配不包含逗号的任意字符串
    if grep -q '"init": \[.*\]' "$json_file"; then
        # 使用 perl 正则来处理，因为它的正则表达式功能更强大
        perl -i -pe 's/"init":\s*\[\s*"([^,"\n]+)"\s*\]/"init": "$1"/g' "$json_file"
        echo "已处理 json 文件: $json_file"
    fi
done

find . -type f \
    -not -path "*.github*" \
    -not -name "Makefile" \
    | while read -r file; do
    needs_reload_service=0
    
    # 检查是否需要添加 reload_service
    if (grep -q "stop_service\|service_stopped" "$file") && ! grep -q "reload_service" "$file"; then
        needs_reload_service=1
    fi
    
    if grep -q "add ucitrack" "$file"; then
        # 提取xx的值
        xx=$(grep "add ucitrack" "$file" | awk '{print $3}' | head -1 | tr -d '\r' | tr -d ' ')
        
        # 读取第一行
        first_line=$(head -n 1 "$file")
        
        # 构建新文件内容
        {
            echo "$first_line"
            echo "[ ! -f \"/usr/share/ucitrack/luci-app-${xx}.json\" ] && {"
            echo "    cat > /usr/share/ucitrack/luci-app-${xx}.json << EEOF"
            echo "{"
            echo "    \"config\": \"${xx}\","
            echo "    \"init\": \"${xx}\""
            echo "}"
            echo "EEOF"
            echo "/etc/init.d/ucitrack reload"
            echo "}"
            # 获取其余内容
            sed '1d' "$file"
            
            # 如果需要添加 reload_service，在这里添加
            if [ "$needs_reload_service" = "1" ]; then
                echo
                echo "reload_service() {"
                echo -e "\trestart"
                echo "}"
            fi
        } > "${file}.tmp"
        
        # 替换原文件
        mv "${file}.tmp" "$file"
        
        echo "已处理文件: $file (ucitrack)"
        [ "$needs_reload_service" = "1" ] && echo "已添加 reload_service 到文件: $file"
        
    elif [ "$needs_reload_service" = "1" ]; then
        # 如果只需要添加 reload_service，直接追加到文件末尾
        echo >> "$file"
        echo "reload_service() {" >> "$file"
        echo -e "\trestart" >> "$file"
        echo "}" >> "$file"
        
        echo "已添加 reload_service 到文件: $file"
    fi
done
