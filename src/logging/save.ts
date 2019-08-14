import * as fs from "fs";
import {RuleEvaluation} from "../model/reporting/RuleEvaluation";
import {SaveGame} from "../model/Table";
import {fromPairs} from "lodash";

if (!fs.existsSync('generated')) {
    fs.mkdirSync('generated');
}
if (!fs.existsSync('generated/logs')) {
    fs.mkdirSync('generated/logs');
}
if (!fs.existsSync('generated/csv')) {
    fs.mkdirSync('generated/csv');
}

export function saveGames(games: SaveGame[], to: string) {
    fs.writeFileSync(`generated/${to}`, JSON.stringify(games, null, 2));
}

export function saveRules(ruleEvaluation: RuleEvaluation) {
    let ruleStatistics = ruleEvaluation.getRuleStatistics();
    let rules = Object.keys(ruleStatistics);

    fs.writeFileSync('generated/rules.json', JSON.stringify(rules.sort(), null, 2));
}

export function saveBadRules(badRules: [string, number][]) {
    fs.writeFileSync('generated/badRules.json', JSON.stringify(fromPairs(badRules), null, 2));
}

export function appendLog(fileName: string, appendString: string) {
    fs.appendFileSync('generated/logs/' + fileName, appendString + '\n');
}

export function appendCsv(fileName: string, strings: string[]) {
    fs.appendFileSync('generated/csv/' + fileName, strings.join(';') + '\n');
}