let fs = require('fs');

let folder = "../generated/csv/";

let folderContent = fs.readdirSync(folder);

let evaluateStrategies = folderContent.filter(entry => entry.startsWith('evaluateStrategies-'));
let heuristicBaseLine = evaluateStrategies.filter(entry => entry.indexOf("Z-CallingRulesWithHeuristic") !== -1);
let randomBaseLine = evaluateStrategies.filter(entry => entry.indexOf("Z-CallingRulesWithRandomPlay") !== -1);
let mostRecentHeuristics = heuristicBaseLine.filter(s => /(CallingRulesWith(Flat|Uct)MonteCarloStrategy(?!100k)(AndHeuristic)?)/.test(s)).sort().reverse().slice(0, 4);
let mostRecentHeuristicsMax = heuristicBaseLine.filter(s => /(CallingRulesWith(Flat|Uct)MonteCarloStrategy(100k|AndCheating)|Nemesis)/.test(s)).sort().reverse().slice(0, 4);
let mostRecentRandom = randomBaseLine.sort().reverse().slice(0, 5); // 5 is the number....

if (mostRecentRandom.length < 5 || mostRecentHeuristics.length < 4 || mostRecentHeuristicsMax.length < 4) {
    throw Error('wrong count!');
}

let evaluateRules = folderContent.filter(entry => entry.startsWith('evaluateRules-'));
let mostRecentRulesEval = evaluateRules.sort().reverse()[0];

let ruleEvalAllLines = fs.readFileSync(folder + mostRecentRulesEval, 'utf-8').split('\n');
let ruleEvalLines = ruleEvalAllLines.filter(row => row.startsWith('10000;'));
ruleEvalLines.unshift(ruleEvalAllLines[0]);

function readCsv(listOfCsvs) {
    let firstLine;
    let allLines = [];
    for (let csv of listOfCsvs) {
        let lines = fs.readFileSync(folder + csv, 'utf-8').split('\n');
        firstLine = lines.shift();
        allLines = allLines.concat(lines);
        if (allLines[allLines.length - 1] === "") {
            allLines.pop();
        }
    }

    allLines.unshift(firstLine);

    return allLines;
}

let allLinesHeuristics = readCsv(mostRecentHeuristics);
let allLinesHeuristicsMax = readCsv(mostRecentHeuristicsMax);
let allLinesRandom = readCsv(mostRecentRandom);

fs.writeFileSync('heuristicBaseline.csv', allLinesHeuristics.join('\n'));
fs.writeFileSync('heuristicMaxBaseline.csv', allLinesHeuristicsMax.join('\n'));
fs.writeFileSync('randomBaseline.csv', allLinesRandom.join('\n'));
fs.writeFileSync('evaluateRules.csv', ruleEvalLines.join('\n'));

console.log("all imported!");