interface Opts {
    quiet?: boolean;
    verbose?: boolean;
    dryrun?: boolean;
}

let _opts: Opts;

export function setOpts(newOpts: Opts) {
    _opts = newOpts;
}

export default () => _opts;

