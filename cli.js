const fs = require('fs/promises');
const fss = require('fs');
/**
 * type {{function Compile(source: string): string}}
 */
const Compile = require('./index');

/**
 *
 * @param err {CompileError}
 * @return {void}
 */
function printError(err) {
    if ('origin' in err && 'getSnippet' in err) {
        console.error(err.msg);
        console.error(' ', err.origin.resource);
        process.stderr.write(err.getSnippet().trim() + '\n');
    }else
        console.error(`${err.msg} - ${err.origin.source}#${err.origin.charIndex}`);
}

/**
 *
 * @param argv {string[]}
 * @returns {number}
 */
(module.exports = async function main(argv) {
    const file = argv.find(i => /^.+(\/.*)*|.*(\/.*)+$/.test(i));

    if (file && fss.existsSync(file))
        Compile(await fs.readFile(file, 'utf8'), file);
    else
        throw {
            msg: 'Compile failed',
            reason: 'No source'
        };

    return 0;
})(process.argv.slice(2)).then(c => process.exit(c)).catch(
    /**
     *
     * @param err {CompileError | Error}
     */
    function (err) {
        if ('msg' in err)
            printError(err);
        else
            console.error(err);
        process.exit(-1);
    });