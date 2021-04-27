import fs from 'fs';
import "source-map-support/register";

const main = await import(JSON.parse(fs.readFileSync('./package.json', 'utf8')).main);

if (main.default && typeof main.default === 'function' && main.default.name === "main") {
    const code = main.default(process.argv);

    if (code instanceof Promise)
        code.then(res => process.exit(res));
    else
        process.exit(code);
}else
    throw new ReferenceError(`Could not locate main function`);
