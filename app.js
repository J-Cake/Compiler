const file = process.argv.find(i => i.startsWith('--entry='));

if (file)
    require(file.match(/^--entry=(.+)$/)[1]).default(process.argv);
else
    require(require('package.json').main).default(process.argv);
// require(?.match(/^--entry=(.+)$/)[1] ?? require('./package.json').main).default(process.argv);