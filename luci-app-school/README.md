依赖

https://github.com/CHN-beta/rkp-ipid/

https://github.com/zfdx123/UA2F-cpp/

系统依赖
sudo apt update

sudo apt -y install libmnl-dev libnfnetlink-dev

wget https://deb.debian.org/debian/pool/main/libn/libnetfilter-queue/libnetfilter-queue1_1.0.5-2_amd64.deb

wget https://deb.debian.org/debian/pool/main/libn/libnetfilter-queue/libnetfilter-queue-dev_1.0.5-2_amd64.deb

sudo dpkg -i libnetfilter-queue1_1.0.5-2_amd64.deb

sudo dpkg -i libnetfilter-queue-dev_1.0.5-2_amd64.deb
