import {Table} from "./model/Table";
import program from "commander";
import {chooseProfile, defineCliOptions, validateCliOptions} from "./profiles/cliOptions";

defineCliOptions();

program.parse(process.argv);

validateCliOptions();

let tableProfile = chooseProfile();

let table = new Table(tableProfile);

(async () => {
    await table.run()
})();