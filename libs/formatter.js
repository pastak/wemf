'use strict'
const fs = require('fs')
const path = require('path')
const GUID = require('guid')
const keyRules = require('./manifestKeyRules')

module.exports = class Formatter {
  constructor (_path, browser = 'firefox') {
    try {
      this.json = JSON.parse(fs.readFileSync(path.resolve(_path)))
      try {
        const _package = JSON.parse(fs.readFileSync(path.resolve('package.json')))
        const webextensionConfig = _package.webextension || {}
        this.json = Object.assign(webextensionConfig, this.json)
        ;['name', 'version', 'author', 'description', 'homepage_url'].forEach((key) => {
          if (this.json[key] === 'inherit') this.json[key] = _package[key === 'homepage_url' ? 'homepage' : key]
        })
      } catch (e) {}
    } catch (e) {
      throw new Error(e)
    }
    this.browser = browser
    this.unSupportedKeys = []
    this.errorMessages = []
    this.warningMessage = []
    this.recommendMessage = []

    this.rules = {}
    this.validKeys = []

    this.loadRules()
    this.validator()
  }

  loadRules () {
    const browser = this.browser
    const rules = keyRules[browser]
    Object.keys(rules).forEach((key) => {
      this.rules[key] = []
      if (key === 'optional_permissions' && Array.isArray(rules['permissions'])) {
        this.rules[key] = [key, rules['permissions'][1]]
        this.validKeys.push(key)
      } else if (rules[key] === 'inherit') {
        keyRules['chrome'][key].forEach((rule) => {
          this.rules[key].push(rule)
          this.validKeys.push(Array.isArray(rule) ? rule[0] : rule)
        })
      } else {
        rules[key].forEach((rule) => {
          this.rules[key].push(rule)
          this.validKeys.push(Array.isArray(rule) ? rule[0] : rule)
        })
      }
    })
  }

  validator () {
    this.errorMessages = []
    this.checkRequiredKey()
    this.checkRecommendedKey()
    this.checkUnsupportedKey()
    this.checkUnsupportedProps()
    this.checkApplicationsKeyFormat()
    const result = this.errorMessages.length === 0
    this.isValid = result
    return result
  }

  checkRecommendedKey () {
    const recommendKeys = this.rules['recommend']
    recommendKeys.forEach((key) => {
      if (!this.hasKey(key)) {
        this.recommendMessage.push(`set ${key} is good`)
      }
    })
  }

  checkUnsupportedKeyOrProps () {
    return this.checkUnsupportedKey() && this.checkUnsupportedProps()
  }

  checkApplicationsKeyFormat () {
    // applicationsをサポートしていない場合はチェックしない
    if (this.validKeys.indexOf('applications') === -1) return true
    const applications = this.json.applications
    if (!(applications &&
      applications.hasOwnProperty('gecko') &&
      applications.gecko.hasOwnProperty('id') &&
      applications.gecko.id)) return false
    const id = applications.gecko.id
    // Check Valid ID
    // NOTE: You can't use +
    if (!(/^[A-Z|a-z|0-9|\-|\.]+@[a-z|A-Z|0-9|-]+(\.[a-z-A-Z]+)+$/).test(id) || GUID.isGuid(id)) {
      this.errorMessages.push(`Invaid id: ${id}`)
      return false
    }
    return true
  }

  hasKey (rule) {
    const keyName = this.getKeyName(rule)
    return this.json[keyName] !== undefined
  }

  getKeyName (rule) {
    return typeof rule === 'string' ? rule : rule[0]
  }

  checkRequiredKey () {
    const shouldContainKeys = []
    const requiredKeys = this.rules['required']
    requiredKeys.forEach((rule) => {
      if (!this.hasKey(rule)) shouldContainKeys.push(this.getKeyName(rule))
    })
    const result = shouldContainKeys.length === 0
    if (!result) {
      this.errorMessages.push(`${this.browser}'s extension must have keys: ${shouldContainKeys.join(', ')}`)
    }
    this.shouldContainKeys = shouldContainKeys
    return result
  }
  fillMustKey (key, val) {
    if (val === undefined) {
      // Set key as props
      if (typeof key === 'string') {
        if (key === 'manifest_version') this.json.manifest_version = '2'
      } else {
        this.json = Object.assign(this.json, key)
      }
    } else {
      if (key === 'applications') {
        if (typeof val === 'string') {
          this.json.applications = {gecko: {id: val}}
        } else {
          if (val.hasOwnProperty('id')) {
            this.json.applications = {gecko: val}
          } else {
            this.json.applications = val
          }
        }
      } else {
        this.json[key] = val
      }
    }
    this.validator()
  }
  checkUnsupportedKey () {
    const containedKey = Object.keys(this.json).filter(k => this.validKeys.indexOf(k) === -1)
    if (containedKey.length === 0) {
      return true
    } else {
      this.errorMessages.push(`${this.browser}'s extension does not yet support keys: ${containedKey.join(', ')}`)
      return false
    }
  }

  searchUnsupportedProps (cb) {
    Object.keys(this.rules).forEach((ruleType) => {
      this.rules[ruleType]
      .filter((rule) => typeof rule !== 'string' && Array.isArray(rule))
      .forEach((rule) => {
        let target = this.json[rule[0]]
        if (!target) return
        if (rule[1].unsupportProps) {
          rule[1].unsupportProps.forEach((unsupportProp) => {
            if (!target.hasOwnProperty(unsupportProp)) return
            if (cb(rule[0], unsupportProp) === 'delete') {
              delete target[unsupportProp]
            }
          })
        }
        if (rule[1].supportValues) {
          target.filter((val) => rule[1].supportValues.indexOf(val) === -1)
          .forEach((unsupportVal) => {
            if (
              (rule[0] === 'permissions' || rule[0] === 'optional_permissions') &&
              this.checkValidHostPattern(unsupportVal)
            ) return

            if (cb(rule[0], unsupportVal) === 'delete') {
              target.splice(target.indexOf(unsupportVal), 1)
            }
          })
        }
        if (rule[1].recommend) {
          const recommend = rule[1].recommend
          if (typeof recommend === 'object') {
            Object.keys(recommend).forEach((key) => {
              if (recommend[key] !== target[key]) {
                this.recommendMessage.push(`${recommend[key]} is better than ${target[key]} on ${key} of ${rule[0]}`)
              }
            })
          } else if (recommend !== target) {
            this.recommendMessage.push(`${recommend} is better than ${target} on ${rule[0]}`)
          }
        }
      })
    })
  }

  checkValidHostPattern (val) {
    if (val === '<all_urls>') return true
    const result = /^(http|https|file|ftp|\*):\/\/(\*|((\*\.)?[^\/\*]+))?\/.*$/.test(val)
    if (!result) {
      this.errorMessages.push(`${val} is invalid on permissons host pattern`)
    }
    return result
  }

  checkUnsupportedProps () {
    let result = true
    this.searchUnsupportedProps((k, keyword) => {
      result = false
      this.errorMessages.push(`${k} does'nt yet support keyword '${keyword}'`)
    })
    return result
  }
  deleteUnsupportedProps () {
    this.searchUnsupportedProps((k, keyword, notDeleted) => {
      if (notDeleted) {
        this.unSupportedKeys.push(`"${k}" doesn't support keyword: "${keyword}"`)
      }
      return 'delete'
    })
    this.validator()
  }
  deleteUnsupportedKey () {
    Object.keys(this.json)
      .filter(k => this.validKeys.indexOf(k) === -1)
      .forEach(k => {
        delete this.json[k]
      })
    this.validator()
  }
}
