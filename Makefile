install: clean
	npm install
	npm run build
start:
	npm run start
clean:
	rm -rf build && rm -rf node_modules
update: clean
	git pull
	npm install
	npm run build
evaluation: evaluateStategiesRandomBaseLine evaluateStategiesHeuristicsBaseLine evaluateRules
evaluateStategiesRandomBaseLine:
	nohup node build/index.js --profile=evaluateStrategies --runs=1000 --log=disabled --strategy1=CallingRulesWithRandomPlay --strategy2=CallingRulesWithHeuristic --seed=evaluationTime &
	nohup node build/index.js --profile=evaluateStrategies --runs=1000 --log=disabled --strategy1=CallingRulesWithRandomPlay --strategy2=CallingRulesWithGreedyPlay --seed=evaluationTime &
	nohup node build/index.js --profile=evaluateStrategies --runs=1000 --log=disabled --strategy1=CallingRulesWithRandomPlay --strategy2=Leprechauns --seed=evaluationTime &
	nohup node build/index.js --profile=evaluateStrategies --runs=1000 --log=disabled --strategy1=CallingRulesWithRandomPlay --strategy2=CallingRulesWithFlatMonteCarloStrategy --seed=evaluationTime &
	nohup node build/index.js --profile=evaluateStrategies --runs=1000 --log=disabled --strategy1=CallingRulesWithRandomPlay --strategy2=CallingRulesWithUctMonteCarloStrategy --seed=evaluationTime &
evaluateStategiesHeuristicsBaseLine:
	nohup node build/index.js --profile=evaluateStrategies --runs=1000 --log=disabled --strategy1=CallingRulesWithHeuristic --strategy2=CallingRulesWithUctMonteCarloStrategy --seed=evaluationTime &
	nohup node build/index.js --profile=evaluateStrategies --runs=1000 --log=disabled --strategy1=CallingRulesWithHeuristic --strategy2=CallingRulesWithUctMonteCarloAndHeuristic --seed=evaluationTime &
	nohup node build/index.js --profile=evaluateStrategies --runs=1000 --log=disabled --strategy1=CallingRulesWithHeuristic --strategy2=CallingRulesWithGreedyPlay --seed=evaluationTime &
	nohup node build/index.js --profile=evaluateStrategies --runs=1000 --log=disabled --strategy1=CallingRulesWithHeuristic --strategy2=CallingRulesWithFlatMonteCarloStrategy --seed=evaluationTime &
evaluateStategiesHeuristicsBaseLineMax:
	nohup node build/index.js --profile=evaluateStrategies --runs=1000 --log=disabled --strategy1=CallingRulesWithHeuristic --strategy2=Nemesis --seed=evaluationTime &
	nohup node build/index.js --profile=evaluateStrategies --runs=1000 --log=disabled --strategy1=CallingRulesWithHeuristic --strategy2=CallingRulesWithUctMonteCarloStrategyAndCheating --seed=evaluationTime &
	nohup node build/index.js --profile=evaluateStrategies --runs=1000 --log=disabled --strategy1=CallingRulesWithHeuristic --strategy2=CallingRulesWithFlatMonteCarloStrategy10k --seed=evaluationTime &
	nohup node build/index.js --profile=evaluateStrategies --runs=1000 --log=disabled --strategy1=CallingRulesWithHeuristic --strategy2=CallingRulesWithUctMonteCarloStrategy10k --seed=evaluationTime &

evaluateRules:
	nohup node build/index.js --profile=evaluateRules --runs=10000 --log=disabled --seed=evaluationTime &
