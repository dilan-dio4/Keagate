export type LoggingLevels = 0 | 1 | 2;

class DelegateLogger {
    logLevel: LoggingLevels = 1;

    public setLogLevel(level: LoggingLevels) {
        this.logLevel = level;
    }

    error = (...args: any[]) => this.logLevel >= 1 && console.error(...args);
    log = (...args: any[]) => this.logLevel >= 1 && console.log(...args);
    debug = (...args: any[]) => this.logLevel >= 2 && console.log(...args);
    success = (text = 'Complete') => this.log('\x1b[1;32m \u2714 ' + text + '\x1b[0m');
}

const logger = new DelegateLogger();

export default logger;
