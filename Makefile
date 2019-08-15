install: clean
	npm install
	npm run build
start:
	npm run start
clean:
	rm -rf build && rm -rf node_modules
evaluateStategiesRandomBaseLine:
	nohup node build/index.js --profile=evaluateStrategies --runs=1000 --log=-info,-gameInfo,-stats,-report,-time --strategy1=CallingRulesWithRandomPlay --strategy2=CallingRulesWithHeuristic --runs=1000 --seed=evaluationTime &
	nohup node build/index.js --profile=evaluateStrategies --runs=1000 --log=-info,-gameInfo,-stats,-report,-time --strategy1=CallingRulesWithRandomPlay --strategy2=CallingRulesWithGreedyPlay --runs=1000 --seed=evaluationTime &
	nohup node build/index.js --profile=evaluateStrategies --runs=1000 --log=-info,-gameInfo,-stats,-report,-time --strategy1=CallingRulesWithRandomPlay --strategy2=Leprechauns --runs=1000 --seed=evaluationTime &
	nohup node build/index.js --profile=evaluateStrategies --runs=1000 --log=-info,-gameInfo,-stats,-report,-time --strategy1=CallingRulesWithRandomPlay --strategy2=CallingRulesWithFlatMonteCarloStrategy --runs=1000 --seed=evaluationTime &
	nohup node build/index.js --profile=evaluateStrategies --runs=1000 --log=-info,-gameInfo,-stats,-report,-time --strategy1=CallingRulesWithRandomPlay --strategy2=CallingRulesWithUctMonteCarloStrategy --runs=1000 --seed=evaluationTime &
evaluateStategiesHeuristicsBaseLine:
	nohup node build/index.js --profile=evaluateStrategies --runs=1000 --log=-info,-gameInfo,-stats,-report,-time --strategy1=CallingRulesWithHeuristic --strategy2=CallingRulesWithUctMonteCarloStrategy --runs=1000 --seed=evaluationTime &
	nohup node build/index.js --profile=evaluateStrategies --runs=1000 --log=-info,-gameInfo,-stats,-report,-time --strategy1=CallingRulesWithHeuristic --strategy2=CallingRulesWithUctMonteCarloAndHeuristic --runs=1000 --seed=evaluationTime &
	nohup node build/index.js --profile=evaluateStrategies --runs=1000 --log=-info,-gameInfo,-stats,-report,-time --strategy1=CallingRulesWithHeuristic --strategy2=Nemesis --runs=1000 --seed=evaluationTime &
	nohup node build/index.js --profile=evaluateStrategies --runs=1000 --log=-info,-gameInfo,-stats,-report,-time --strategy1=CallingRulesWithHeuristic --strategy2=CallingRulesWithUctMonteCarloStrategyAndCheating --runs=1000 --seed=evaluationTime &
evaluateStategiesHeuristicsBaseLineWithoutCallingRules:
	nohup node build/index.js --profile=evaluateStrategies --runs=1000 --log=-info,-gameInfo,-stats,-report,-time --strategy1=CallingRulesWithHeuristic --strategy2=UctMonteCarloStrategy --runs=1000 --seed=evaluationTime &
	nohup node build/index.js --profile=evaluateStrategies --runs=1000 --log=-info,-gameInfo,-stats,-report,-time --strategy1=CallingRulesWithHeuristic --strategy2=FlatMonteCarloStrategy --runs=1000 --seed=evaluationTime &