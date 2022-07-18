import config from './config';

class DelegateLogger {
    log = (...args: any[]) => console.log('[KEAGATE LOG]: ', ...args);
    debug = (...args: any[]) => config.has('IS_DEV') && config.getTyped('IS_DEV') && console.log('[KEAGATE DEBUG]: ', ...args);
    success = (text = 'Complete') => console.log('\x1b[1;32m \u2714 ' + text + '\x1b[0m');
}

const logger = new DelegateLogger();

export default logger;
