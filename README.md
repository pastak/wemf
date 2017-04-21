# WebExtension Manifest Formatter

[![Build Status](https://travis-ci.org/pastak/wemf.svg?branch=master)](https://travis-ci.org/pastak/wemf)

[![](https://nodei.co/npm-dl/wemf.png?months=3)](https://www.npmjs.com/package/wemf)

[![](https://nodei.co/npm/wemf.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/wemf)


Formatter and validator for manifest.json on Chrome Extension / Firefox WebExtension / Extension for Edge.

## Install

`% npm install -g wemf`

## Usage

```
  Usage: wemf <packageJsonPath> [options]

  Options:

    -h, --help          output usage information
    -V, --version       output the version number
    --validate          Only validate manifest.json
    -O --output <path>  Output manifest.json path
    -U --update         Update manifest.json itself
    --browser <browser-name>  Set target browser (chrome|firefox|edge) default: firefox
```

### Formatter

`% wemf /path/to/chrome-ext/manifest.json -O /path/to/firefox-ext/manifest.json`

### Validate

`% wemf /path/to/firefox-ext/manifest.json --validate`

if it has no problem, return nothing

### Tips

#### Set custom value via `package.json`

If you want to fill columns (ex: `applications`) automatically, you should write `webextension` column on project's `package.json`.

Example

```js
{
  "name": "hoge",
  ...
  "webextension": {
    "name": 'extension-name',
    "applications": {
      "gecko": {
        "id": "sample-extension@example.org",
        "strict_min_version": "47.0a1"
      }
    }
  }
}
```

#### inherit value from `package.json`

When `name`, `version`, `author`, `description` or `homepage_url` is filled `inherit`, `manifest.json`'s field will be filled by same key name value from `package.json` (`homepage_url` will be filled by `homepage` in `package.json`)

## information

Please check newest information

- [WebExtensions - MozillaWiki](https://wiki.mozilla.org/WebExtensions)
- [Are we Web Extensions yet?](http://www.arewewebextensionsyet.com/)
- [Chrome incompatibilities - Mozilla | MDN](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Chrome_incompatibilities)
- [manifest.json - Mozilla | MDN](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/manifest.json)

## Development

Welcome your Pull Request!!

Please fork it and send Pull Request to this repository.

### Testing

`% npm test`
