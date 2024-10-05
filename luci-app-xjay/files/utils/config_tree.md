# config tree naming convention

```
- log{}
	|- log_access: string
	|- log_error: string
	|- log_level: string
	|- log_dnslog: bool

- api{}
	|- tag: string
	|- services[]: string array

- dns{}
	|- tag: string
	|- hosts{}: key:value : domain:ipaddress
	|- servers[]: server object array
		|- querystrategy: string: UseIP | UseIPv4 | UseIPv6
		|- server_address: string
		|- server_port: number: 0-65535
		|- server_domains[]: string array
			|- server_domain: string
		|- server_expectedips[]: string array
			|- server_expectedip: ipaddress
		|- server_skipfallback: bool
		|- server_clientip: string
	|- clientip: string 
	|- querystrategy: string: UseIP | UseIPv4 | UseIPv6
	|- disablecache: bool
	|- disablefallback: bool
	|- disablefallbackifmatch: bool

- routing{}
	|- tag: string
	|- domainstrategy: string: AsIs | IPIfNonMatch | IPOnDemand
	|- domainmatcher: string: hybrid | hybrid
	|- rules
		|- rule_domainmatcher: string: hybrid | hybrid
		|- rule_type: string: field
		|- rule_domain[]: string | regexp: | domain: | full: | geosite: | ext:file:tag
		|- rule_ip[]: cidr | geoip: | ext:file:tag
		|- rule_port: number: 0-65535
		|- rule_sourceport: number: 0-65535
		|- rule_network: string: tcp | udp | tcp,udp
		|- rule_source[]: cidr | geoip: | ext:file:tag
		|- rule_user[]: string: email
		|- rule_inboundtag[]: string
		|- rule_protocol[]: string: http | tls | bittorrent
		|- rule_attrs: string
		|- rule_outboundtag: string
		|- rule_balancertag: string

- policy{}
	|- levels{0:{}, 1:{}, ...}
		|- level_handshake: number: default 4
		|- level_connidle: number: default 300
		|- level_uplinkonly: number: default 2
		|- level_downlinkonly: number default 5
		|- level_statsuseruplink: bool
		|- level_statsuserdownlink: bool
		|- level_buffersize: number: 
	|- system{}
		|- system_statsinbounduplink: bool
		|- system_statsinbounddownlink: bool
		|- system_statsoutbounduplink: bool
		|- system_statsoutbounddownlink: bool

- inbounds[]
	|- tag: string
	|- listen: ipaddress or socket
	|- port: number: 0-65535
	|- protocol: string: dokodemo-door | http | shadowsocks | socks | trojan | vless | vmess
	|- settings{}: protocol settings object array
	|- streamsettings{}
		|- stream_network: string: tcp | kcp | ws | http | domainsocket | quic | grpc
		|- stream_security: string: none | tls | xtls
		|- tcp_settings{}
		|- tls_settings{}
		|- kcp_settings{}
		|- ws_settings{}
		|- http_settings{}
		|- quic_settings{}
		|- ds_settings{}
		|- grpc_settings{}
		|- sockopt{}
	|- sniffing{}
		|- sniffing_enabled: bool
		|- sniffing_destoverride[]: string array: http | tls | fakedns
		|- sniffing_metadataonly: bool
		|- sniffing_domainsexcluded[]: string array
		|- sniffing_routeonly: bool
	|- allocate{}
		|- allocate_strategy: string: aways | random
		|- allocate_refresh: number: >= 2
		|- allocate_concurrency: number: 1 <= concurrency <= 65535/3

inbound_protocol{}
	|- dokodemo-door{}
		|- dokodemo_address: ipaddress or domain
		|- dokodemo_port: number: 0-65535
		|- dokodemo_network: tcp | udp | tcp,udp
		|- dokodemo_timeout: number: default 300
		|- dokodemo_followredirect: bool
		|- dokodemo_level: number: default 0
	|- http{}
		|- http_timeout: number: default 300
		|- http_auth: string: noauth | password
		|- http_accounts{}
			|- http_user: string
			|- http_password: string
		|- http_allocatransparent: bool
		|- http_level: number: default 0
	|- shadowsocks{}
		|- ss_password: string
		|- ss_method: string: aes-256-gcm | aes-128-gcm | chacha20-poly1305 | none | plain
		|- ss_email: string
		|- ss_network: string: tcp | udp | tcp,udp
		|- ss_level: number default 0
	|- socks{}
		|- socks_auth: string: noauth | password
		|- socks_accounts{}
			|- socks_user: string
			|- socks_pass: string
		|- socks_udp: bool
		|- socks_ip: ipaddress
		|- socks_level: number: default 0
	|- trojan{}
		|- trojan_password: string
		|- trojan_email: string
		|- trojan_level: number 
	|- vless{}
		|- vless_id: string
		|- vless_email: string
		|- vless_flow: string: xtls-rprx-vision | xtls-rprx-vision-udp443 | ...
		|- vless_level: number
		|- vless_decyption: string: none
	|- vmess{}
		|- vmess_id: string
		|- vmess_alterid: number
		|- vmess_email: string
		|- vmess_level: number
		|- vmess_detour: string

- outbounds[]
	|- tag: string
	|- address: ipaddress or domain
	|- port: number: 0-65535
	|- sendthrough: ipaddress
	|- protocol: string: blackhole | dns | freedom | http | shadowsocks | socks | trojan | vless | vmess | wireguard
	|- settings{}: protocol settings object array
	|- streamsettings{}
		|- stream_network: string: tcp | kcp | ws | http | domainsocket | quic | grpc
		|- stream_security: string: none | tls | xtls
		|- tls_settings{}
		|- tcp_settings{}
		|- kcp_settings{}
		|- ws_settings{}
		|- http_settings{}
		|- quic_settings{}
		|- ds_settings{}
		|- grpc_settings{}
		|- sockopt{}
	|- proxysettings{}
		|- proxy_settings: string: another outbound tag
	|- mux{}
		|- mux_enabled: bool
		|- mux_concurrency: number: 8 <= concurrency <= 1024

- outbound_protocol{}
	|- blackhole{}
		|- blackhole_response: string: none | http
	|- dns{}
		|- dns_network: string: tcp | udp
		|- dns_address: ipaddress
		|- dns_port: number: 0-65535
	|- freedom{}
		|- freedom_domainstrategy: string: AsIs | UseIP | UseIPv4 | UseIPv6
		|- freedom_redirect: ipaddress:port
		|- freedom_userlevel: number
	|- http{}
		|- address: ipadress or domain
		|- port: number: 0-65536
		|- http_users[]
			|- http_user: string
			|- http_pass: string
	|- shadowsocks{}
		|- address: ipaddress or domain
		|- port: number: 0-65535
		|- ss_method: string: aes-256-gcm | aes-128-gcm | chacha20-poly1305 | none | plain
		|- ss_password: string
		|- ss_uot: bool
		|- ss_email: string
		|- ss_level: number
	|- socks{}
		|- address: ipaddress or domain
		|- port: number: 65535
		|- socks_users[]
			|- socks_user: string
			|- socks_pass: string
			|- socks_level: number
	|- trojan{}
		|- address: ipaddress or domain
		|- port: number: 65535
		|- trojan_password: string
		|- trojan_email: string
		|- trojan_level: number
	|- vless{}
		|- address: ipaddress or domain
		|- port: number: 65535
		|- vless_users[]
			|- vless_id: string
			|- vless_encryption: string: none
			|- vless_flow: string: xtls-rprx-vision | xtls-rprx-vision-udp443 | ...
			|- vless_level: number
	|- vmess{}
		|- address: ipaddress or domain
		|- port: number: 0-65535
		|- vmess_user[]
			|- vmess_id: string
			|- vmess_alterid: number
			|- vmess_security: string: aes-128-gcm | chacha20-poly1305 | auto | none | zero
			|- vmess_level: number
	|- wireguard{}
		|- wg_secretkey: string
		|- wg_address[ IPv4_CIDR, IPv6_CIDR, ...]
		|- wg_peers[]
			|- wg_endpoint: ipaddress:port or domain:port
			|- wg_publickey: string
		|- wg_mtu: number: default 1420
		|- wg_workers: number: default 2

- transport{}
	|- tcp_settings{}
		|- tcp_acceptproxyprotocol: bool - inbound only
		|- tcp_header{}
			|- tcp_type: string: none | http
			|- tcp_path: string
			|- tcp_host: domain
	|- kcp_settings{}
		|- kcp_mtu: number: 576 <= mtu <= 1460
		|- kcp_tti: number: 10 <= tti <= 100
		|- kcp_uplinkcapacity: number: default 5
		|- kcp_downlinkcapacity: number: default 5
		|- kcp_congestion: bool
		|- kcp_readbuffersize: number: default 2
		|- kcp_writebuffersize: number: default 2
		|- kcp_header{}
			|- kcp_type: string: none | srtp | utp | wechat-video | dtls | wireguard
		|- kcp_seed: string
	|- ws_settings{}
		|- ws_acceptproxyprotocol: bool - inbound only
		|- ws_path: string: default: /
		|- ws_headers{}
			|- ws_host: string: domain
	|- http_settings{}
		|- http_host[]: string array
		|- http_path: string: default /
		|- http_readidletimeout: number - outbound only
		|- http_healthchecktimeout: number - outbound only
		|- http_method: string: PUT | GET | POST
	|- quic_settigns{}
		|- quic_security: string: none | aes-128-gcm | chacha20-poly1305
		|- quic_key: string
		|- quic_header{}
			|- quic_type: string: none | srtp | utp | wechat-video | dtls | wireguard
	|- ds_settings{} - inbound only
		|- ds_path: string
		|- ds_abstract: bool
		|- ds_padding: bool
	|- grpc_settings{}
		|- grpc_servicename: string
		|- grpc_multimode: bool - outbound only
		|- grpc_idletimeout: number: >= 10 - outbound only
		|- grpc_healthchecktimeout: number: default 20 - outbound only
		|- grpc_permitwithoutstream: bool - outbound only
		|- grpc_initialwindownsize: number: default 0 - outbound only
		|- grpc_useragent: string - outbound only
	|- sockopt{}
		|- sockopt_mark: number - outbound only
		|- sockopt_tcpfastopen: bool
		|- sockopt_tproxy: string: redirect | tproxy | off - inbound only
		|- sockopt_domainstrategy: string: AsIs | UseIP | UseIPv4 | UseIPv6 - outbound only
		|- sockopt_dialerproxy: string: another oubound tag - outbound only
		|- sockopt_acceptproxyprotocol: bool - inbound only
		|- sockopt_tcpkeepaliveinterval: number - inbound only
		|- sockopt_tcpcongestion: string: bbr | cubic | reno - inbound only
		|- sockopt_interface: string - outbound only
	|- tls_settings{}
		|- tls_servername: string - outbound only
		|- tls_rejectnuknownsni: bool - inbound only
		|- tls_allowinsecure: bool - outbound only
		|- tls_alpn[]: sting array: h2 | http/1.1
		|- tls_minversion: string - inbound only
		|- tls_maxversion: string - inbound only
		|- tls_ciphersuites: string: cipher1:cipher2:... - inbound only
		|- tls_certificates[] - inbound only
			|- cert_ocspStapling: number: default 3600
			|- cert_onetimeloading: bool
			|- cert_usage: string
			|- cert_certificatefile: string: file path
			|- cert_certificatekeyfile: string: file path
			|- cert_certficate: string array
			|- cert_key: string array
		|- tls_disablesystemroot: bool - outbound only
		|- tls_enablesessionresumption: bool - outbound only
		|- tls_fingerprint: string: chrome | firefox | safari | ios | android | edge | random | randomized - outbound only
		|- tls_pinnedpeercertificatechainsha256[]: string - outbound only
	|- reality_settings{}
		|- reality_show: bool
		|- reality_dest: string - inbound only
		|- reality_xver: number: 0 | 1 | 2 : default 0 - inbound only
		|- reality_servername[]: string array - inbound only
		|- reality_privatekey: string - inbound only
		|- reality_minclientver: string
		|- reality_maxclientver: string
		|- reality_maxtimediff: number: ms
		|- reality_shortid[]: string array
		|- reality_servername: string - outbound only
		|- reality_fingerprint: string: chrome | firefox | safari | ios | android | edge | random | randomized - outbound only
		|- reality_shortid: string
		|- reality_publickey: string
		|- reality_spiderx: string
	|- mux_settings{} - inbound only
		|- mux_enabled: bool
		|- mux_concurrency: number: 1 <= concurrency <= 1024, -1
		|- mux_xudpconcurrency: number: 1 <= concurrency <= 1024, -1
		|- mux_xudpproxyudp443: string: reject | allow | skip

- fallback{}: require inbound to be tcp+tls
	|- name: string: default ""
	|- alpn: string: h2 | http/1.1
	|- path: string: /xxx
	|- dest: string | number
	|- xver: number: default 0

- stats{}

- reverse{}
	|- bridges[]
		|- bridge_tag: string
		|- bridge_domain: string
	|- portals[]
		|- portal_tag: string
		|- portal_domain: string

- fakedns{}
	|- ip_pool: CIDR
	|- pool_size: number
```
