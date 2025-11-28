"use strict"
const __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value) }) }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)) } catch (e) { reject(e) } }
        function rejected(value) { try { step(generator["throw"](value)) } catch (e) { reject(e) } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected) }
        step((generator = generator.apply(thisArg, _arguments || [])).next())
    })
}
Object.defineProperty(exports, "__esModule", { value: true })
exports.run = void 0
const issue_forms_parser_1 = require("./issue_forms_parser")
const config_reader_1 = require("./config_reader")
function run({ core, github, context, process }) {
    let _a; let _b; let _c; let _d; let _e; let _f; let _g
    return __awaiter(this, void 0, void 0, function* () {
        const owner = (_b = (_a = context.payload.repository) === null || _a === void 0 ? void 0 : _a.owner) === null || _b === void 0 ? void 0 : _b.login
        const repo = (_c = context.payload.repository) === null || _c === void 0 ? void 0 : _c.name
        const issue_number = (_d = context.payload.issue) === null || _d === void 0 ? void 0 : _d.number
        const body = (_f = (_e = context.payload.issue) === null || _e === void 0 ? void 0 : _e.body) !== null && _f !== void 0 ? _f : ''
        const configReader = new config_reader_1.ConfigReader((_g = process.env.GITHUB_WORKSPACE) !== null && _g !== void 0 ? _g : '')
        const fieldConfig = configReader.getFieldConfig()
        core.debug(`config: ${JSON.stringify(fieldConfig)}`)
        core.debug(`owner: ${owner}`)
        core.debug(`repo: ${repo}`)
        core.debug(`issue_number: ${issue_number}`)
        core.debug(`body: ${body}`)
        const jsonOutput = (0, issue_forms_parser_1.markdownToJson)(body, fieldConfig)
        core.setOutput('result', JSON.stringify(jsonOutput))
    })
}
exports.run = run
