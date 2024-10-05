bcrypt-tool
===========

`bcrypt-tool` is a dandy CLI tool for generating and matching bcrypt hashes

[![GitHub](https://img.shields.io/github/license/shoenig/bcrypt-tool.svg)](LICENSE)

# Project Overview

Module `github.com/shoenig/bcrypt-tool` provides a simple command line tool.

# Getting Started

#### Install from Releases

The `bcrypt-tool` tool is available for the ```aarch64_cortex-a53``` architechure from the [Releases](https://github.com/xptsp/openwrt-bcrypt-tool/releases) page.

### Examples

#### Generate Hash from a Password
```bash
$ bcrypt-tool hash p4ssw0rd
```
    
#### Generate Hash from a Password with Cost
```bash
$ bcrypt-tool hash p4ssw0rd 31
```
    
#### Determine if Password matches Hash
```bash
$ bcrypt-tool match p4ssw0rd $2a$10$nWFwjoFo4zhyVosdYMb6XOxZqlVB9Bk0TzOvmuo16oIwMZJXkpanW
```

note: depending on your shell, you may need to escape the $ characters

#### Determine Cost of Hash
```bash
$ bcrypt-tool cost $2a$10$nWFwjoFo4zhyVosdYMb6XOxZqlVB9Bk0TzOvmuo16oIwMZJXkpanW
```
    
note: depending on your shell, you may need to escape the $ characters

### Usage
```bash
bcrypt-tool [action] parameter ...
```

#### Actions

- `hash  [password] <cost>` Use bcrypt to generate a hash given password and optional cost (4-31)

- `match [password] [hash]` Use bcrypt to check if a password matches a hash

- `cost  [hash]` Use bcrypt to determine the cost of a hash (4-31)

# Contributing

The `github.com/shoenig/bcrypt-tool` module is always improving with new features
and error corrections. For contributing bug fixes and new features please file an issue.

# License

The `github.com/shoenig/bcrypt-tool` module is open source under the [MIT](LICENSE) license.
