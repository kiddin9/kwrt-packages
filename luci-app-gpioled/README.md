# LuCI support for GPIO LED Configuration

## Customize device GPIO LED behavior with LuCI.

<a target="_blank" href="https://github.com/animegasan/luci-app-gpioled/releases"><img src="https://img.shields.io/github/downloads/animegasan/luci-app-gpioled/total?label=Total%20Download&labelColor=blue&style=for-the-badge"></a>

This project is a continuation project of <a href="https://github.com/lutfailham96/s905x-gpio" target="_blank">GPIO controller for Amlogic S905X devices</a>.

By taking advantage of GPIOID, some additional functionality is provided for LED behavior.

* Internet Detector : Service to detect whether internet is running or not.
* Application Detector : Service to detect whether desired application is running or not with a notification using IR Blaster LED.
* Power LED : Service for set Power LED blink mode.

## Table of GPIO ID
| Device | Power | IR Blaster | Ethernet | Searcher |
| ------ | ----- | ---------- | -------- | -------- |
| HG680P R1GB | 483, 484 | 480 | 481, 482| <a href="https://www.facebook.com/arif.kholid" target="_blank">Mohammad Arif</a> |
| HG680P R2GB | 425, 426 | 507 | 506, 510| <a href="https://github.com/animegasan" target="_blank">animegasan</a> |

## List app for Application Detector
* Cloudflared
* ZeroTier
