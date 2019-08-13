import colors from "chalk";
import {extend} from "lodash";
import stripColors from 'strip-ansi';

const fs = require('fs');

interface Config {
    private: boolean;
    stats: boolean;
    info: boolean;
    error: boolean;
    report: boolean;
    gameInfo: boolean;
    disabled: boolean;
    time: boolean;
    toFile: null | string;
    csvFile: null | string;
}

let config: Config = {
    private: false,
    stats: true,
    info: true,
    error: true,
    report: true,
    gameInfo: true,
    time: false,
    disabled: false,
    toFile: null,
    csvFile: null
};

function time(string: string) {
    console.time(string);
}

function timeEnd(string: string) {
    // prints anyhow.....
    console.timeEnd(string);
}

export default {
    private: (string: string) => config.private && write(colors.green(string)),
    stats: (string: string) => config.stats && write(colors.blue(string)),
    info: (string: string) => config.info && write(colors.grey(string)),
    error: (string: string) => config.error && write(colors.red(string)),
    report: (string: string) => config.report && write(colors.cyan(string)),
    setConfig: (newConfig: Partial<Config>) => {
        config = extend(config, newConfig);
        return config;
    },
    gameInfo: (string: string) => config.gameInfo && write(colors.italic(string)),
    time: (string: string) => config.time && time(string),
    timeEnd: (string: string) => config.time && timeEnd(string),
    csv: (strings: string[]) => config.csvFile && writeCsv(strings)
}

function write(string: string) {
    if (!config.disabled) {
        if (config.toFile) {
            fs.appendFileSync(config.toFile, stripColors(string))
        } else {
            console.log(string);
        }
    }
}

function writeCsv(strings: string[]) {
    if (!config.disabled && config.csvFile) {
        fs.appendFileSync(config.csvFile, strings.join(';') + '\n');
    }
}