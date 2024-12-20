#!/bin/sh

# Copyright 2020 BlackYau <blackyau426@gmail.com>
# GNU General Public License v3.0

dir="/tmp/log/suselogin/" && mkdir -p ${dir}
logfile="${dir}suselogin.log"
pidpath=${dir}run.pid
count=0
ua="User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.89 Safari/537.36"
enable=$(uci get suselogin.@login[0].enable)
[ "$enable" -eq 0 ] && echo "$(date "+%Y-%m-%d %H:%M:%S"): 未启用,停止运行..." >${logfile} && exit 0
interval=$(($(uci get suselogin.@login[0].interval) * 60)) # 把时间换算成秒
username=$(uci get suselogin.@login[0].username)
password=$(uci get suselogin.@login[0].password)
isp=$(uci get suselogin.@login[0].isp)
auto_offline=$(uci get suselogin.@login[0].auto_offline)

# 获取已连接设备数
check() {
    count="$(grep -E "0x2|0x6" /proc/net/arp | awk '{print $1}' | grep -Ev "^169.254.|^172.21." | sort -u | wc -l)"
    echo "$count"
}

# 控制log文件大小
reducelog() {
    [ -f ${logfile} ] && logrow=$(grep -c "" ${logfile}) || logrow="0"
    [ "$logrow" -gt 500 ] && sed -i '1,100d' ${logfile} && echo "$(date "+%Y-%m-%d %H:%M:%S")  日志超出上限(500行)，删除前 100 条" >>${logfile}
}

# 如果在线返回真 关于返回值的问题:https://stackoverflow.com/a/43840545
isonline() {
    captive_return_code=$(curl -s -I -m 10 -o /dev/null -w "%{http_code}" http://gstatic.com/generate_204)
    if [ "$captive_return_code" = "204" ]; then
        return 0 # 明确返回在线状态
    else
        return 1 # 明确返回不在线状态
    fi
}

log_message() {
    echo "$(date "+%Y-%m-%d %H:%M:%S"): $1" >>"${logfile}"
}

up() {
    if isonline; then
        log_message "您已连接到网络!"
        sleep 1
        return
    fi

    # Get referer page
    refererPage=$(curl -s "http://gstatic.com/generate_204" | awk -F \' '{print $2}')

    # Structure login_url
    login_url=$(echo "$refererPage" | awk -F \? '{print $1}')
    login_url=$(echo "$login_url" | sed 's/index\.jsp/InterFace.do?method=login/')

    # Structure queryString
    queryString=$(echo "$refererPage" | awk -F \? '{print $2}')
    queryString=$(echo "$queryString" | sed 's/&/%2526/g' | sed 's/=/\%253D/g')

    log_message "username: ${username}, password: ${password}"

    # Login
    if [ -n "$login_url" ]; then
        response=$(curl -s -A "${ua}" \
            -e "$refererPage" \
            -b "EPORTAL_COOKIE_OPERATORPWD=; ..." \
            -d "userId=${username}&password=${password}&service=${isp}&queryString=${queryString}&..." \
            -H "Accept: */*" \
            -H "Content-Type: application/x-www-form-urlencoded; charset=UTF-8" \
            -m 5 \
            "$login_url")

        log_message "response: ${response}"
        echo "$response" >"${dir}login.log"
        wait
    else
        log_message "获取登录地址失败" && return
    fi

    if isonline; then
        ntpd -n -q -p ntp1.aliyun.com
        wait
        log_message "登录成功!"
        sleep 2
    else
        log_message "登录失败,错误信息: $(cat /tmp/log/suselogin/login.log)"
    fi
}

logout() {
    url="http://10.23.2.4/eportal/InterFace.do"
    data="method=logout"
    response=$(curl -m 5 -A "${ua}" -d "${data}" "${url}" -w "%{http_code}" -o -)

    if [ "$(response: -3)" = "200" ]; then
        log_message "成功下线！"
        sleep 2
        up
    else
        log_message "下线失败, HTTP状态码: $(response: -3)"
        echo "$response" >>${logfile}
    fi
}

terminate_previous_process() {
    if [ -f ${pidpath} ]; then
        pid=$(cat $pidpath)
        log_message "终止之前的进程: $pid"
        kill "$pid" >/dev/null 2>&1 && sleep 1
        rm -rf $pidpath
    fi
}

terminate_previous_process
echo $$ >$pidpath
log_message "进程已启动 pid:$$"

while [ "$enable" -eq 1 ]; do
    connected_devices=$(check "%@")
    if [ "$connected_devices" -gt 0 ]; then
        up
        wait
        if [ "$auto_offline" -eq 1 ] && [ "$connected_devices" -gt "$count" ]; then
            log_message "当前已连接$connected_devices个设备, 上次检测时有$count个设备,开始退出登录"
            logout
        fi
        count=$connected_devices
    fi
    reducelog
    sleep $interval
done
