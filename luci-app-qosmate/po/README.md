# QoSmate Translations

This directory contains translations for the QoSmate LuCI application.

## Contributing Translations

1. Copy templates/qosmate.pot to xx.po (where xx is your language code)
2. Translate the strings in your xx.po file
3. Submit a pull request

## Available Languages
- English (default)
- German (de.po) (test)

## Creating/Updating Translations
Use these commands to update translations:

```bash
# Update .pot template
./scripts/i18n-scan.pl htdocs > po/templates/qosmate.pot

# Update existing .po files
./scripts/i18n-update.pl po/templates/qosmate.pot po/*.po
