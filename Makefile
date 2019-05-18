install: clean
	npm install
	npm run build
start:
	npm run start
clean:
	rm -rf build && rm -rf node_modules