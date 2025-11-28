"use strict"
const __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k
    let desc = Object.getOwnPropertyDescriptor(m, k)
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get() { return m[k] } }
    }
    Object.defineProperty(o, k2, desc)
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k
    o[k2] = m[k]
}))
const __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v })
}) : function(o, v) {
    o["default"] = v
})
const __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod
    const result = {}
    if (mod != null) for (const k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k)
    __setModuleDefault(result, mod)
    return result
}
Object.defineProperty(exports, "__esModule", { value: true })
exports.ConfigReader = void 0
const fs = __importStar(require("fs"))
const path = __importStar(require("path"))
// create a new class
class ConfigReader {
    constructor(basePath) {
        this.configFolderPath = path.join(basePath, 'config')
    }
    // define a static method
    getFieldConfig() {
        const absolutePath = path.join(this.configFolderPath, 'fields.json')
        const fileContents = fs.readFileSync(absolutePath, 'utf8')
        return JSON.parse(fileContents)
    }
}
exports.ConfigReader = ConfigReader
