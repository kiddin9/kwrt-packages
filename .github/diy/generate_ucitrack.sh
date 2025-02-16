#!/bin/bash

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
            # 获取其余内容：保留包含 "get ucitrack" 的行，删除其他包含 "ucitrack" 的行
            sed '1d' "$file" | awk '/get ucitrack/ {print; next} !/ ucitrack/ {print}'
        } > "${file}.tmp"
        
        # 替换原文件
        mv "${file}.tmp" "$file"
        
        echo "已处理文件: $file"
    fi
done
