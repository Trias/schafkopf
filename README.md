# Schafkopf
1. Make sure you have [node.js](https://nodejs.org/en/) (recommended: node v10 LTS) with npm and [git](https://git-scm.com/) installed.
2. Open the command line (cmd on windows, terminal on mac)
3. Check out this repo on the command line with ``git clone https://github.com/Trias/schafkopf``
4. Enter the directory with ``cd schafkopf``
5. run ``npm install`` on the command line
6. After npm installed the dependencies, run ``npm run build`` on the command line

Now you are ready to go. You can choose from the following starting points:
* ``node build/index.js``: runs the default profile. Simulates 4 computer players and prints the output
* ``node build/index.js --profile=manual``: runs the manual profile. You can play against the computer
* ``node build/index.js --profile=manual --manual=2``: runs the manual profile but you play at the second position.
* ``node build/index.js --profile=manual --manual=2 --log=private``: like above but now you can see the cards of the other players and the reasoning
* ``node build/index.js --profile=manual --manual=2 --log=private --seed=seed``: like above but now card deals are predetermined
* ``node build/index.js --profile=manual --manual=2 --log=private --seed=seed --saveFile=games.json``: like above but now saves the games so you can later replay them
* ``node build/index.js --profile=manual --manual=2 --log=private --seed=seed --saveFile=games.json --runs=100``: like above but with a hundred games
* ``node build/index.js --profile=replay --replay=1 --log=private --saveFile=games.json``: replay the saved game (seed is ignored because it is determined by the save game)

see more (advanced) options with ``node build/index.js -h``

