type LoggerFn = (...args: any[]) => void

interface Logger {
    error: LoggerFn
    warn: LoggerFn
    info: LoggerFn
    log: LoggerFn
    debug: LoggerFn
    trace: LoggerFn
}

export type LoggingLevels = 0 | 1 | 2;

class DelegateLogger implements Logger {
    logger: Logger | null
    logLevel: LoggingLevels = 1

    constructor(logger?: Logger | null | undefined, private readonly prefix?: string) {
        this.logger = typeof logger === 'undefined' ? console : logger
        if (prefix) {
            this.prefix = `[${prefix}]`
        }
    }

    public setLogLevel(level: LoggingLevels) {
        this.logLevel = level;
    }

    private delegate(method: keyof Logger) {
        return (level: LoggingLevels, ...args: any[]) => {
            if (this.logger !== null) {
                if (level > this.logLevel) {
                    return;
                }

                if (this.prefix) {
                    this.logger[method](this.prefix, ...args)
                } else {
                    this.logger[method](...args)
                }
            }
        }
    }

    error = this.delegate('error')
    warn = this.delegate('warn')
    info = this.delegate('info')
    log = this.delegate('log')
    debug = this.delegate('debug')
    trace = this.delegate('trace')
}



const logger = new DelegateLogger(console, 'Keagate');

export default logger;