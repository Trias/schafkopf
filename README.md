# Schafkopf
1. Make sure you have [node.js](https://nodejs.org/en/) with npm and [git](https://git-scm.com/) installed.
2. Check out this repo on the command line with ``git clone https://github.com/Trias/schafkopf``
3. Enter the directory of the project and run ``npm install`` on the command line
4. After npm installed the dependencies, run ``npm run build`` on the command line

now you are ready to go. You can choose from the following starting points:
1. ``npm run start``: runs a simulation with the default settings from ``index.js``
2. ``npm run replay``: runs a replay of a specific game saved under ``generated/games.json``. You need to run 1) to have saved games available.
3. ``npm run evaluateStrategies``: runs an evaluation on the strategies set in ``evaluateStrategies.js``
4. ``npm run evaluateRules``: runs an evaluation on the rules set in ``generated/rules.json``. Rules get generated as a side effect of running 3).
