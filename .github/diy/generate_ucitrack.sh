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
    
    if grep -q "add ucitrack" "$file"; then
        # 提取xx的值
        xx=$(grep "add ucitrack" "$file" | awk '{print $3}' | head -1 | tr -d '\r' | tr -d ' ')
        
        # 读取第一行
        first_line=$(head -n 1 "$file")
        
        # 构建新文件内容
        {
            # 检查第一行是否包含 #!/bin/
            if [[ "$first_line" == "#!/bin/"* ]]; then
                echo "$first_line"
            fi
            echo "[ ! -f \"/usr/share/ucitrack/luci-app-${xx}.json\" ] && {"
            echo "    cat > /usr/share/ucitrack/luci-app-${xx}.json << EEOF"
            echo "{"
            echo "    \"config\": \"${xx}\","
            echo "    \"init\": \"${xx}\""
            echo "}"
            echo "EEOF"
            echo "}"
             # 如果第一行不包含 #!/bin/，在这里输出
            if [[ "$first_line" != "#!/bin/"* && -n "$first_line" ]]; then
                echo "$first_line"
            fi
            # 获取其余内容
            sed '1d' "$file"
        } > "${file}.tmp"
        
        # 替换原文件
        mv "${file}.tmp" "$file"
        
        echo "已处理文件: $file (ucitrack)"
        
    else
        # 检查是否需要添加 reload_service
    if (grep -q "stop_service\|service_stopped" "$file") && ! grep -q "reload_service" "$file"; then
        echo >> "$file"
        echo "reload_service() {" >> "$file"
        echo -e "\trestart" >> "$file"
        echo "}" >> "$file"
        
        echo "已添加 reload_service 到文件: $file"
    fi

if awk '/^USE_PROCD/{a=1} /start_service/{b=1} /config_load/{c=1} /service_triggers/{d=1} END{exit !(a&&b&&c&&!d)}' "$file"; then
        needs_service_triggers=1
        config=$(grep -m 1 "config_load" "$file" | sed 's/.*config_load[[:space:]]\+["'\'']\?\([^"'\''[:space:]]*\)["'\'']\?.*$/\1/')
        echo >> "$file"
        echo "service_triggers() {" >> "$file"
        echo -e "\tprocd_add_reload_trigger \"$config\"" >> "$file"
        echo "}" >> "$file"
        
        echo "已添加 service_triggers 到文件: $file"
    fi
    fi
done
touch /tmp/ok3
