import * as fs from "fs";
import {RuleEvaluation} from "../model/reporting/RuleEvaluation";
import {SaveGame} from "../model/Table";
import {fromPairs} from "lodash";

export function saveGames(games: SaveGame[], to: string) {
    if (!fs.existsSync('generated')) {
        fs.mkdirSync('generated');
    }
    fs.writeFileSync(`generated/${to}`, JSON.stringify(games, null, 2));
}

export function saveRules(ruleEvaluation: RuleEvaluation) {
    let ruleStatistics = ruleEvaluation.getRuleStatistics();
    let rules = Object.keys(ruleStatistics);
    if (!fs.existsSync('generated')) {
        fs.mkdirSync('generated');
    }
    fs.writeFileSync('generated/rules.json', JSON.stringify(rules.sort(), null, 2));
}

export function saveBadRules(badRules: [string, number][]) {
    if (!fs.existsSync('generated')) {
        fs.mkdirSync('generated');
    }
    fs.writeFileSync('generated/badRules.json', JSON.stringify(fromPairs(badRules), null, 2));
}
