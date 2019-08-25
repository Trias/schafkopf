let fs = require('fs');

let folder = "../generated/csv/";

let folderContent = fs.readdirSync(folder);

let evaluateStrategies = folderContent.filter(entry => entry.startsWith('evaluateStrategies-'));
let heuristicBaseLine = evaluateStrategies.filter(entry => entry.indexOf("Z-CallingRulesWithHeuristic") !== -1);
let randomBaseLine = evaluateStrategies.filter(entry => entry.indexOf("Z-CallingRulesWithRandomPlay") !== -1);

function filterForMostRecentEvaluations(heuristicBaseLine, regExp) {
    let strategies = new Set();

    return heuristicBaseLine.filter(s => regExp.test(s)).sort().reverse().filter(filename => {
        let matches = filename.match(regExp);

        if(strategies.has(matches[1])){
            return false;
        }else{
            strategies.add(matches[1]);
            return true;
        }
    });
}

let mostRecentHeuristics = filterForMostRecentEvaluations(heuristicBaseLine, /(CallingRulesWith(Flat|Uct)MonteCarloStrategy(AndHeuristic)?(?!(100k|10k|AndCheating)))/);
let mostRecentHeuristicsMax = filterForMostRecentEvaluations(heuristicBaseLine, /(CallingRulesWith(Flat|Uct)MonteCarloStrategy(AndHeuristic)?(100k|10k|AndCheating)|Nemesis)/);
let mostRecentRandom = filterForMostRecentEvaluations(randomBaseLine, /(Leprechauns|CallingRulesWith(Flat|Uct)MonteCarloStrategy|CallingRulesWithHeuristic)/);

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

        if (csv.indexOf('Nemesis') !== -1 || csv.indexOf('CallingRulesWithUctMonteCarloStrategyAndCheating') !== -1) {
            lines = lines.slice(0, 100);
        }

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