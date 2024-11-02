## Luci app insomclash untuk openwrt

[![EN](https://img.shields.io/badge/lang-EN-red.svg?style=for-the-badge)](README-EN.md)
[![GitHub Downloads](https://img.shields.io/github/downloads/bobbyunknown/luci-app-insomclash/total?style=for-the-badge&logo=github)](https://github.com/bobbyunknown/luci-app-insomclash/releases)
[![GitHub Views](https://img.shields.io/badge/VIEWS-0-brightgreen?style=for-the-badge&logo=github)](https://github.com/bobbyunknown/luci-app-insomclash)

#### Support me:
[![Sociabuzz](https://img.shields.io/badge/Sociabuzz-1DA1F2?style=for-the-badge&logo=sociabuzz&logoColor=white)](https://sociabuzz.com/bobbyunknown/tribe)
[![Saweria](https://img.shields.io/badge/Saweria-FFA500?style=for-the-badge&logo=saweria&logoColor=white)](https://saweria.co/widgets/qr?streamKey=48ea6792454c7732924b663381c69521)


#### Telegram group:
[![SanTech](https://img.shields.io/badge/SanTech-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/+TuLCASzJrVJmNzM1)


### Fitur
- Core mihomo
- Tproxy
- Yacd panel
- Filemanager, edit config, proxy, dan upload

### Instalasi

#### Metode Manual
- Unduh paket instalasi dari [Release](https://github.com/bobbyunknown/luci-app-insomclash/releases)
#### Metode Auto Install
- Jalankan perintah berikut di terminal:
```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/bobbyunknown/luci-app-insomclash/main/install.sh)"
```
### Core dan Geofiles

#### Core

**Untuk (x86_64):**
- mihomo-linux-amd64
- mihomo-linux-amd64-compatible
- mihomo-linux-amd64-compatible-go120
- mihomo-linux-amd64-compatible-go122

**Untuk ARM:**
- mihomo-linux-arm64
- mihomo-linux-armv7
- mihomo-linux-armv5

> ⚠️ **Penting**: Pilih core yang sesuai dengan arsitektur CPU perangkat Anda untuk performa optimal

### Cara Install Core & Geodata
1. Download core yang sesuai
2. Extract file `.gz`
3. Rename menjadi `mihomo`
4. Upload ke direktori `/etc/insomclash/core`
5. Upload semua geodata ke `/etc/insomclash/run`

### Geo Database 
| File | Deskripsi | Ukuran |
|------|-----------|--------|
| `country.mmdb` | Database MaxMind lengkap | Besar |
| `country-lite.mmdb` | Database MaxMind ringkas | Kecil |
| `geoip.dat` | GeoIP format DAT lengkap | Besar |
| `geoip-lite.dat` | GeoIP format DAT ringkas | Kecil |
| `geoip-lite.db` | GeoIP format DB optimized | Kecil |
| `geoip-lite.metadb` | Metadata GeoIP | Minimal |
| `geosite.dat` | GeoSite format DAT lengkap | Besar |
| `geosite-lite.dat` | GeoSite format DAT ringkas | Kecil |
| `geosite.db` | GeoSite format DB lengkap | Besar |
| `geosite-lite.db` | GeoSite format DB ringkas | Kecil |

> 💡 **Tips**: Gunakan versi "lite" untuk menghemat penyimpanan dengan tetap mendapatkan fungsi utama

Untuk panduan lengkap penggunaan GEOSITE dan GEOIP, silakan kunjungi [dokumentasi resmi](https://github.com/bobbyunknown/luci-app-insomclash/blob/main/README-DAT.md)

#### Auto install geofiles dan core
- Jalankan perintah berikut di terminal:
```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/bobbyunknown/luci-app-insomclash/main/install-core-geofiles.sh)"
```


### Lokasi Direktori
| Jenis | Path |
|-------|------|
| Run | `/etc/insomclash/run` |
| Core | `/etc/insomclash/core` |
| Config | `/etc/insomclash/profile` |
| Proxy | `/etc/insomclash/proxy` |
| Rule | `/etc/insomclash/rule` |
| GeoFile | `/etc/insomclash/` |

### Tutorial Konfigurasi Rule dan Proxy

#### Cara Setting Config
1. Edit file example config di tab filemanager dan sesuaikan bagian-bagian berikut:
   - `proxy-providers`: Daftar penyedia proxy
   - `proxy-groups`: Pengaturan grup proxy
   - `rule-providers`: Daftar penyedia rule
   - `rules`: Aturan routing

#### Penempatan File External
Jika ingin menggunakan file rule dan proxy terpisah dari config utama:
- File proxy: Upload ke `/etc/insomclash/proxy`
- File rule: Upload ke `/etc/insomclash/rule`
- Atau upload di insomclash tab file manager kemudian pilih tab proxy rule


#### Contoh Struktur Config
```yaml
mode: rule
ipv6: false
log-level: silent
allow-lan: false
tproxy-port: 7894
unified-delay: true
tcp-concurrent: true
keep-alive-interval: 15
tcp-keep-alive-interval: 15
geodata-mode: true
geodata-loader: memconservative
external-controller: 0.0.0.0:9090
external-ui: ui
dns:
  enable: true
  listen: 0.0.0.0:7874
  ipv6: false
  default-nameserver: ['1.1.1.1', '1.0.0.1', '8.8.8.8', '8.8.4.4']
  nameserver: ['https://cloudflare-dns.com/dns-query', 'https://dns.google/dns-query']
profile:
  store-selected: true
  store-fake-ip: true
  tracing: false

sniffer:
  enable: true
  sniff:
    HTTP:
      ports: [80, 8080-8880]
      override-destination: true
    TLS:
      ports: [443, 8443]
  skip-domain:
    - '+.microsoft.com'
    - '+.windows.com'
```

> 💡 **Tips**: 
> - Pastikan URL provider dan path file sudah benar
> - Sesuaikan interval update sesuai kebutuhan
> - Gunakan RULE-SET untuk mengorganisir rule dengan lebih baik

### Screenshot

<details>
<summary>File Manager</summary>

![File Manager](img/filemanager.png)
</details>

<details>
<summary>Log</summary>

![Log](img/log.png)
</details>

<details>
<summary>Start</summary>

![Start](img/start.png)
</details>

<details>
<summary>Stop</summary>

![Stop](img/stop.png)
</details>

### Credit
Terima kasih kepada:
- Allah SWT
- DBAI
- IndoWRT
- [MetaCubeX](https://github.com/MetaCubeX) untuk Core
- [ZeroLab](https://github.com/zerolabnet/SSClash) untuk Routing
- [RTA Server](https://github.com/rtaserver) untuk dat files




