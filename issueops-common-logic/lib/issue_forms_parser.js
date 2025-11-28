"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.markdownToJson = void 0
function processLine(line, currentConfig, json) {
    const match = line.match(/^- \[(.)\] (.*)$/)
    if (match) {
        if (!json[currentConfig.name]) {
            json[currentConfig.name] = []
        }
        const isChecked = match[1] !== ' '
        const value = match[2]
        if (isChecked) {
            validateValue(value, currentConfig)
            json[currentConfig.name].push(value)
        }
    }
    else {
        const value = line.trim()
        validateValue(value, currentConfig)
        json[currentConfig.name] = value
    }
}
function validateValue(value, config) {
    if (config.regex && !new RegExp(config.regex).test(value)) {
        throw new Error(`Value "${value}" does not match regex for ${config.name}`)
    }
}
function markdownToJson(markdown, config) {
    const lines = markdown.split('\n')
    const json = {}
    let currentConfig = null
    lines.forEach(line => {
        line = line.trim()
        if (line.startsWith('### ')) {
            const label = line.slice(4).trim()
            currentConfig = config.find(cfg => cfg.label === label) || null
        }
        else if (currentConfig && line) {
            processLine(line, currentConfig, json)
        }
    })
    return json
}
exports.markdownToJson = markdownToJson
