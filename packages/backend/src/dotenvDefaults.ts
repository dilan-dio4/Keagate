// https://github.com/mrsteele/dotenv-defaults/blob/master/src/index.js
import dotenv from 'dotenv';

/**
 * Merges two objects.
 * @param {Object} apply - The overwriter
 * @param {Object} defaults - The defaults to be overwritten
 * @returns {Object} The merged results.
 */
const merge = (apply = {}, defaults = {}) => Object.assign({}, defaults, apply)


/**
 * Runs the configurations and applies it to process.env.
 * @param {Object} [options={}] - The options to determnie how this goes
 * @returns {Object} The parsed results.
 */
const config = (options: dotenv.DotenvConfigOptions & { defaults: string }) => {
    const src = dotenv.config(options)
    // we run this second so it doesn't override things set from src
    const defaults = dotenv.config(Object.assign({}, options, {
        path: options.defaults
    }))

    return {
        parsed: merge(src.parsed, defaults.parsed)
    }
}

const dotenvDefaultConfig = config;
export default dotenvDefaultConfig;