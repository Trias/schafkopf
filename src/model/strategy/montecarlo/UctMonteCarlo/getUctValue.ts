const C = Math.sqrt(2);

export function getUctValue(winRatio: number, numberOfSimulationsParent: number, numberOfSimulationsChild: number) {
    if (numberOfSimulationsParent < 1 || numberOfSimulationsChild <= 0) {
        throw Error('no uct value, unvisited node');
    }
    if (winRatio > 1 || winRatio < 0) {
        throw Error('invalid winratio');
    }

    return winRatio + C * Math.sqrt(Math.log(numberOfSimulationsParent) / numberOfSimulationsChild);
}