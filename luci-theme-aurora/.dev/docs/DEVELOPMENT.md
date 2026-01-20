# Development Guide

This guide covers the complete development workflow for the Aurora theme, from environment setup to building production packages.

## Prerequisites

- **[Node.js v20.19+](https://nodejs.org/en/download)** - JavaScript runtime
- **pnpm** - Package manager (managed via Corepack)
- **Tailwind CSS knowledge** - Required for styling. See [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- **Network access** - Development machine must be on the same network as your OpenWrt router

## Environment Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone git@github.com:eamonxg/luci-theme-aurora.git
cd luci-theme-aurora/.dev/

# Enable Corepack to manage pnpm version
corepack enable && corepack prepare

# Install dependencies
pnpm install
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env and set your OpenWrt device address
# VITE_OPENWRT_HOST=http://192.168.1.1
```

**Environment Variables:**

- `VITE_OPENWRT_HOST` - Your OpenWrt LuCI web interface URL (required)
- `VITE_DEV_HOST` - Development server host (default: `127.0.0.1`)
- `VITE_DEV_PORT` - Development server port (default: `5173`)

## Development Workflow

### Start Development Server

```bash
cd luci-theme-aurora/.dev/
pnpm dev
```

The development server will start at `http://127.0.0.1:5173` and proxy requests to your OpenWrt device.

**How Vite Proxy Works:**

The Vite development server intercepts network requests and replaces CSS/JS resources with local versions. This enables live editing without deploying to the router. For detailed implementation, see `vite.config.ts`.

**Key proxy behaviors:**

1. Proxies `/cgi-bin` and `/luci-static` requests to OpenWrt device
2. Intercepts HTML responses to inject Vite HMR client
3. Rewrites CSS requests to serve from `.dev/src/media/main.css`
4. Serves JS files directly from `.dev/src/resource/`
5. Redirects `/` to `/cgi-bin/luci` for proper routing

**Network Requirements:**

- Development machine and OpenWrt router **must be on the same network segment**

### Code Style and Formatting

This project uses **Prettier** for code formatting with automatic formatting on save.

**Prettier Configuration:**

- Located in `.prettierrc`
- VS Code settings in `.vscode/settings.json` enable format-on-save for CSS and JS files
- Uses `prettier-plugin-tailwindcss` to sort Tailwind CSS classes

### CSS Nesting Support

Thanks to **lightningcss**, you can freely use [CSS Nesting syntax](https://drafts.csswg.org/css-nesting/) in your stylesheets. The build process automatically compiles nested CSS into flat, browser-compatible format.

This will be compiled to standard CSS that works in all browsers.

### LuCI JavaScript API

For LuCI-specific JavaScript development, refer to the official API documentation:

- [LuCI JavaScript API Reference](http://openwrt.github.io/luci/jsapi/index.html)

### Live Reload Behavior

- **CSS changes**: Trigger full page reload via custom HMR handler
- **JS changes**: Trigger full page reload via custom HMR handler
- **Template changes** (`.ut` files): **Require building a new package and installing it on the router**

## Building for Production

### Build Command

```bash
cd luci-theme-aurora/.dev/
pnpm build
```

This compiles all assets to the production directory `htdocs/luci-static/`, which is used by LuCI during OpenWrt package compilation.

**Build Output:**

```
htdocs/luci-static/
├── aurora/
│   ├── main.css           # Minified CSS (via lightningcss)
│   ├── fonts/             # Web fonts (Lato)
│   └── images/            # Logo assets
└── resources/
    ├── menu-aurora.js     # Menu configuration (minified via Terser)
    └── view/aurora/
        └── sysauth.js     # Login page view (minified via Terser)
```

**Build Process:**

1. Vite builds CSS entry point (`src/media/main.css`)
2. Custom PostCSS plugin removes `@layer` at-rules for OpenWrt compatibility
3. Custom Vite plugin (`luci-js-compress`) minifies JS files via Terser
4. Static assets copied from `.dev/public/aurora/`

## Package Compilation

### Via GitHub Actions

1. Commit your changes to the repository
2. Manually trigger the GitHub Actions workflow
3. The workflow will compile the theme package (.ipk/.apk files)

**Workflow File:** `.github/workflows/build-and-release-aurora.yml`

## Directory Structure

```
luci-theme-aurora/
├── .dev/                           # Development environment
│   ├── docs/                       # Project documentation
│   │   ├── changelog/              # Version changelogs
│   │   └── DEVELOPMENT.md          # Development guide (this file)
│   ├── public/aurora/              # Public static assets
│   │   ├── fonts/                  # Web fonts (Lato)
│   │   └── images/                 # Theme images
│   ├── scripts/                    # Build scripts
│   │   └── clean.js                # Build cleanup utility
│   ├── src/                        # Source code
│   │   ├── assets/icons/           # SVG icons
│   │   ├── media/                  # CSS entry points
│   │   │   └── main.css            # Main stylesheet (Tailwind CSS)
│   │   └── resource/               # JavaScript resources
│   │       ├── view/               # LuCI view components
│   │       └── menu-aurora.js      # Menu logic
│   ├── .env.example                # Environment variables template
│   ├── .prettierrc                 # Prettier configuration
│   ├── package.json                # Node.js dependencies
│   ├── pnpm-lock.yaml              # pnpm lock file
│   └── vite.config.ts              # Vite configuration with custom plugins
├── .github/                        # GitHub configuration
│   ├── ISSUE_TEMPLATE/             # Issue templates
│   └── workflows/                  # GitHub Actions workflows
├── .vscode/                        # VS Code workspace settings
│   └── settings.json               # Auto-format on save settings
├── htdocs/luci-static/             # Build output (generated by Vite)
│   ├── aurora/                     # Theme CSS and assets
│   │   ├── fonts/                  # Built font files
│   │   ├── images/                 # Built images
│   │   └── main.css                # Compiled CSS
│   └── resources/                  # Built JavaScript modules
│       ├── view/                   # Minified view components
│       └── menu-aurora.js          # Minified menu logic
├── root/etc/uci-defaults/          # OpenWrt system integration
│   └── 30_luci-theme-aurora        # Theme auto-setup script
├── ucode/template/themes/aurora/   # LuCI ucode templates
│   ├── header.ut                   # Header template
│   ├── footer.ut                   # Footer template
│   └── sysauth.ut                  # Login page template
├── LICENSE                         # Apache License 2.0
├── Makefile                        # OpenWrt package Makefile
├── README.md                       # English documentation
└── README_zh.md                    # Chinese documentation
```

## Tools and Technologies

- **[Vite](https://vitejs.dev/)** - Build tool and development server
- **[Tailwind CSS v4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Prettier](https://prettier.io/)** - Code formatter
- **[prettier-plugin-tailwindcss](https://github.com/tailwindlabs/prettier-plugin-tailwindcss)** - Tailwind class sorting
- **[lightningcss](https://lightningcss.dev/)** - CSS minifier
- **[Terser](https://terser.org/)** - JavaScript minifier
- **[pnpm](https://pnpm.io/)** - Fast, disk space efficient package manager
