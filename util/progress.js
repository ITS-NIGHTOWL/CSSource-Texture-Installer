const ora = require('ora')
const chalk = require('chalk')
let progress

module.exports = {
    progress,
    start: (msg, color = 'yellow') => {
        progress = ora(chalk[color](msg) + '\n').start()
    },
    succeed: (msg) => {
        progress.succeed(msg)
    },
    update: (msg) => {
        progress.text = chalk.yellow(msg)
    },
    log: (msg) => {
        console.log(chalk.green('√ ') + msg)
    },
    fail: (msg, interval) => {
        progress.fail(chalk.red(msg))
        setTimeout(() => {
            return process.exit()
        }, interval)
    }
}