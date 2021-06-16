#FILE=./test-scripts/test-09.06.21.ark
FILE=./test-scripts/test.ark

Compiler:
	clear
	pnpx esbuild ./src/index.ts --sourcemap --bundle --outfile=./index.js --platform=node --target=node14 --format=cjs

run: Compiler
	node --enable-source-maps=true ./cli.js $(FILE)
