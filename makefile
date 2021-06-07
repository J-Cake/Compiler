Compiler:
	pnpx esbuild ./src/index.ts --sourcemap --bundle --outfile=./index.js --platform=node --target=node14 # --minify --format=cjs

run: Compiler
	node ./app.js --entry=./index.js
