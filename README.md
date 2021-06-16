# Compiler

I've been interested in writing a compiler as long as I can remember. I remember my first one. I sat there trying to
figure out how to extract bits of text from a file. I'd like to think I'm not so naive anymore, but I make no
guarantees. What I can say with confidence though is that I've made leaps in compiler building. So if you're interested
in playing around with it, feel free. There's only a handful of things you'll need beforehand.

## setup
1. Clone the repository
2. Clone the J-Cake/JCPU repository from my GitHub page.
3. Do the `pnpx tsc` thing in the JCPU repo
4. Run `pnpm run build` in the Compiler repo
5. Do `npm i -g` in the JCPU repo
6. Compile one of the example scripts with `node ./cli.js ./examples/example1.ark`
7. Run it on the JCPU VM with `jvm --file=./example1.bin`
8. Be horrified by how slow it is...
9. Laugh
10. *Nice*
11. Forget about ever setting your eyes on this repo and move on with your life.
