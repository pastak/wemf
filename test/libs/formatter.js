'use strict'
const test = require('ava')
const proxyquire = require('proxyquire')
const Formatter = require('../../libs/formatter')

test('isValid', t => {
  const formatter = new Formatter('../fixtures/check_must_key.json')
  t.ok(formatter.isValid === false)
})

test('checkUnsupportedKeyOrProps', t => {
  const formatter = new Formatter('../fixtures/manifest.json')
  t.ok(formatter.checkUnsupportedKeyOrProps() === false)
})

test('checkRequiredKey', t => {
  const formatter = new Formatter('../fixtures/check_must_key.json')
  t.ok(formatter.checkRequiredKey() === false)
  t.ok(formatter.shouldContainKeys.indexOf('applications') > -1 === true)
  t.ok(formatter.shouldContainKeys.indexOf('manifest_version') > -1 === true)
  t.ok(formatter.shouldContainKeys.indexOf('name') > -1 === true)
  t.ok(formatter.shouldContainKeys.indexOf('version') > -1 === true)

  const formatter2 = new Formatter('../fixtures/check_must_key_pass.json')
  t.ok(formatter2.checkRequiredKey() === true)
  t.is(formatter2.shouldContainKeys.length, 0)
})

test('fillMustKey `applications`', t => {
  // Write Only Id String
  const formatter = new Formatter('../fixtures/check_must_key.json')
  formatter.fillMustKey('applications', 'sample-extension@example.com')
  t.is(formatter.shouldContainKeys.indexOf('applications') > -1, false)
  t.is(formatter.json.applications.gecko.id, 'sample-extension@example.com')
  t.is(formatter.checkApplicationsKeyFormat(), true)

  // Write `id`'s Key and Val
  const formatter2 = new Formatter('../fixtures/check_must_key.json')
  formatter2.fillMustKey('applications', {id: 'sample-extension@example.com'})
  t.is(formatter2.shouldContainKeys.indexOf('applications') > -1, false)
  t.is(formatter2.json.applications.gecko.id, 'sample-extension@example.com')
  t.is(formatter2.checkApplicationsKeyFormat(), true)

  // Write Full Structor
  const formatter3 = new Formatter('../fixtures/check_must_key.json')
  formatter3.fillMustKey({
    applications :{
      gecko: {id: 'sample-extension@example.com'}
    }
  })
  t.is(formatter3.shouldContainKeys.indexOf('applications') > -1, false)
  t.is(formatter3.json.applications.gecko.id, 'sample-extension@example.com')
  t.is(formatter3.checkApplicationsKeyFormat(), true)

  // Write invalid Id String
  const formatter4 = new Formatter('../fixtures/check_must_key.json')
  formatter4.fillMustKey('applications', 'authoradgadkdaldgau')
  t.is(formatter4.shouldContainKeys.indexOf('applications') > -1, false)
  t.is(formatter4.checkApplicationsKeyFormat(), false)

  // Write invalid Id String
  const formatter5 = new Formatter('../fixtures/check_must_key.json')
  formatter5.fillMustKey('applications', 'author+amo@example.com')
  t.is(formatter5.shouldContainKeys.indexOf('applications') > -1, false)
  t.is(formatter5.checkApplicationsKeyFormat(), false)

  // id's domain has 2 .(dots)
  const formatter6 = new Formatter('../fixtures/check_must_key.json')
  formatter6.fillMustKey('applications', 'test@kmc.gr.jp')
  t.is(formatter6.checkApplicationsKeyFormat(), true)
})

test('fillMustKey `version`', t => {
  const formatter = new Formatter('../fixtures/check_must_key.json')
  formatter.fillMustKey('version', '0.0.1')
  t.is(formatter.shouldContainKeys.indexOf('version') > -1, false)
  t.is(formatter.json.version, '0.0.1')

  const formatter2 = new Formatter('../fixtures/check_must_key.json')
  formatter2.fillMustKey({version: '0.0.1'})
  t.is(formatter2.shouldContainKeys.indexOf('version') > -1, false)
  t.is(formatter2.json.version, '0.0.1')
})
test('fillMustKey `manifest_version`', t => {
  const formatter = new Formatter('../fixtures/check_must_key.json')
  formatter.fillMustKey('manifest_version', '2')
  t.is(formatter.shouldContainKeys.indexOf('manifest_version') > -1, false)
  t.is(formatter.json.manifest_version, '2')

  const formatter2 = new Formatter('../fixtures/check_must_key.json')
  formatter2.fillMustKey({manifest_version: '2'})
  t.is(formatter2.shouldContainKeys.indexOf('manifest_version') > -1, false)
  t.is(formatter2.json.manifest_version, '2')

  const formatter3 = new Formatter('../fixtures/check_must_key.json')
  formatter3.fillMustKey('manifest_version')
  t.is(formatter3.shouldContainKeys.indexOf('manifest_version') > -1, false)
  t.is(formatter3.json.manifest_version, '2')
})
test('fillMustKey `name`', t => {
  const formatter = new Formatter('../fixtures/check_must_key.json')
  formatter.fillMustKey('name', 'test')
  t.is(formatter.shouldContainKeys.indexOf('name') > -1, false)
  t.is(formatter.json.name, 'test')

  const formatter2 = new Formatter('../fixtures/check_must_key.json')
  formatter2.fillMustKey({name: 'test'})
  t.is(formatter2.shouldContainKeys.indexOf('name') > -1, false)
  t.is(formatter2.json.name, 'test')
})

test('fillMustKeys', t => {
  const formatter = new Formatter('../fixtures/check_must_key.json')
  formatter.fillMustKey('applications', 'sample-extension@example.com')
  formatter.fillMustKey('name', 'test')
  formatter.fillMustKey('manifest_version')
  formatter.fillMustKey('version', '0.0.1')
  t.is(formatter.shouldContainKeys.length, 0)
  t.is(formatter.json.name, 'test')
  t.is(formatter.isValid, true)
})

test('checkUnsupportedProps', t => {
  const formatter = new Formatter('../fixtures/check_must_key_pass.json')
  t.is(formatter.checkUnsupportedProps(), true)

  const formatter2 = new Formatter('../fixtures/manifest.json')
  t.is(formatter2.checkUnsupportedProps(), false)
})

test('deleteUnsupportedProps', t => {
  const formatter = new Formatter('../fixtures/manifest.json')
  t.is(formatter.checkUnsupportedProps(), false)
  formatter.deleteUnsupportedProps()
  t.ok(formatter.checkUnsupportedProps())
})

test('deleteUnsupportedKey', t => {
  const formatter = new Formatter('../fixtures/unsupported_key.json')
  formatter.deleteUnsupportedKey()
  t.ok(formatter.isValid)
})

test('Merge applications column from package.json', t => {
  const fsStub = {readFileSync: (path) => {
    if (path.match(/package\.json/)) {
      return JSON.stringify({
        webextension: {
          applications: {
            gecko: {
              id: 'hoge@example.com'
            }
          }
        }
      })
    } else {
      return require('fs').readFileSync(path)
    }
  }}
  const Formatter = proxyquire('../../libs/formatter', {fs: fsStub})
  const formatter = new Formatter('../fixtures/check_must_key.json')
  t.is(formatter.json.applications.gecko.id, 'hoge@example.com')
  t.is(formatter.checkApplicationsKeyFormat(), true)

  const Formatter2 = proxyquire('../../libs/formatter', {fs: fsStub})
  const formatter2 = new Formatter('../fixtures/check_must_key_pass.json')
  t.is(formatter2.json.applications.gecko.id, 'sample@example.com')
  t.is(formatter2.checkApplicationsKeyFormat(), true)
})

test('General Check', t => {
  const formatter = new Formatter('../fixtures/manifest.json')
  t.is(formatter.isValid, false)
  formatter.fillMustKey('applications', 'sample-extension@example.com')
  formatter.fillMustKey('name', 'test')
  formatter.fillMustKey('manifest_version')
  formatter.fillMustKey('version', '0.0.1')
  t.is(formatter.isValid, false)
  formatter.deleteUnsupportedProps()
  t.is(formatter.isValid, false)
  formatter.deleteUnsupportedKey()
  t.ok(formatter.isValid)
})

test('checkValidHostPattern', t => {
  // Patterns from https://developer.chrome.com/extensions/match_patterns
  const formatter = new Formatter('../fixtures/manifest.json')
  t.is(formatter.checkValidHostPattern('http:/bar'), false)
  t.is(formatter.checkValidHostPattern('foo://*'), false)
  t.is(formatter.checkValidHostPattern('http://*/*'), true)
  t.is(formatter.checkValidHostPattern('http://*/foo*'), true)
  t.is(formatter.checkValidHostPattern('https://*.google.com/foo*bar'), true)
  t.is(formatter.checkValidHostPattern('http://example.org/foo/bar.html'), true)
  t.is(formatter.checkValidHostPattern('file:///foo*'), true)
  t.is(formatter.checkValidHostPattern('http://127.0.0.1/*'), true)
  t.is(formatter.checkValidHostPattern('*://mail.google.com/*'), true)
  t.is(formatter.checkValidHostPattern('<all_urls>'), true)
  t.is(formatter.checkValidHostPattern('http://www.google.com'), false)
  t.is(formatter.checkValidHostPattern('http://*foo/bar'), false)
  t.is(formatter.checkValidHostPattern('http://foo.*.bar/baz'), false)
})
