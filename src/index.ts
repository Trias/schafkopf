import {Table} from "./model/Table";
import program from "commander";

program.version('1.0.0');
program.option('-p, --profile <profile>', 'which profile to use').parse(process.argv);

let tableProfile;
try {
    tableProfile = require('./profiles/' + program.profile).default;
} catch (e) {
    if (!program.profile) {
        tableProfile = require('profiles/default').default;
    } else {
        console.error(`no profile called "${program.profile}" found!`);
        process.exit();
    }
}

let table = new Table(tableProfile);

(async () => {
    await table.run()
})();