#!/bin/bash

# set -e

# OS="$(uname -s)"
# if [ -n "$SUDO_USER" ]; then
#     HOME="$(getent passwd $SUDO_USER | cut -d: -f6)"
# fi

INSTALL_DIR="$HOME"
FOLDER_NAME="Keagate"
REPO_LOCATION="https://github.com/dilan-dio4/$FOLDER_NAME"
NODE_ARGS=""

# yes/no script
# read -p "Are you sure? " -n 1 -r
# echo    # (optional) move to a new line
# if [[ $REPLY =~ ^[Yy]$ ]]
# then
#     ...do dangerous stuff
# fi

# https://github.com/DevelopersToolbox/bash-spinner

draw_spinner() {
    # shellcheck disable=SC1003
    local -a marks=('/' '-' '\' '|')
    local i=0

    delay=${SPINNER_DELAY:-0.25}
    message=${1:-}

    while :; do
        printf '%s\r' "${marks[i++ % ${#marks[@]}]} $message"
        sleep "${delay}"
    done
}

start_spinner() {
    message=${1:-}              # Set optional message
    draw_spinner "${message}" & # Start the Spinner:
    SPIN_PID=$!                 # Make a note of its Process ID (PID):
    declare -g SPIN_PID
    trap stop_spinner $(seq 0 15)
}

draw_spinner_eval() {
    # shellcheck disable=SC1003
    local -a marks=('/' '-' '\' '|')
    local i=0
    delay=${SPINNER_DELAY:-0.25}
    message=${1:-}
    while :; do
        message=$(eval "$1")
        printf '%s\r' "${marks[i++ % ${#marks[@]}]} $message"
        sleep "${delay}"
        printf '\033[2K'
    done
}

start_spinner_eval() {
    command=${1} # Set the command
    if [[ -z "${command}" ]]; then
        echo "You MUST supply a command"
        exit
    fi
    draw_spinner_eval "${command}" & # Start the Spinner:
    SPIN_PID=$!                      # Make a note of its Process ID (PID):
    declare -g SPIN_PID
    trap stop_spinner $(seq 0 15)
}

stop_spinner() {
    if [[ "${SPIN_PID}" -gt 0 ]]; then
        kill -9 $SPIN_PID >/dev/null 2>&1
    fi
    SPIN_PID=0
    printf '\033[2K'
}

# Parse Flags
for i in "$@"; do
    case $i in
    -q | --quiet)
        QUIET="true"
        NODE_ARGS+="$key "
        shift # past argument
        # shift # past value
        ;;
    -v | --verbose)
        VERBOSE="true"
        NODE_ARGS+="$key "
        shift # past argument
        # shift # past value
        ;;
    *)
        keagate_echo "Unrecognized argument $key"
        exit 1
        ;;
    esac
done

keagate_has() {
    type "$1" >/dev/null 2>&1
}

keagate_echo() {
    command printf %s\\n "$*" 2>/dev/null
}

keagate_debug() {
    if [ -n "$VERBOSE" ]; then
        command printf %s\\n "$*" 2>/dev/null
    fi
}

install_node() {
    # start_spinner "Installing Node and NPM via nvm"
    curl -s -o nvm.sh https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh
    chmod +x ./nvm.sh
    export NVM_DIR="$HOME/.nvm"
    ./nvm.sh
    rm ./nvm.sh
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"                   # This loads nvm
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion" # This loads nvm bash_completion
    nvm install 16
    nvm use 16
    # stop_spinner
}

# https://stackoverflow.com/a/42876846
# if [[ "$EUID" = 0 ]]; then
#     keagate_debug "Privilege check: already root"
# else
#     sudo -k # make sure to ask for password on next sudo
#     if sudo true; then
#         keagate_debug "Privilege check: Correct password"
#     else
#         keagate_debug "Privilege check: wrong password"
#         echo "Wrong password. Please try again."
#         exit 1
#     fi
# fi

if ! keagate_has "docker"; then
    keagate_debug "\`Docker\` command not found. Installing..."
    # Install Docker - used for Mongo and Nginx
    curl -fsSL https://get.docker.com -o get-docker.sh
    # start_spinner "Installing Docker"
    sudo sh get-docker.sh
    rm get-docker.sh
    # stop_spinner
fi

# Fix permissions issue on certain ports from `docker run`
sudo chmod 666 /var/run/docker.sock

if keagate_has "node" && keagate_has "npm"; then
    keagate_debug "Node and NPM detected. Checking versions..."
    installed_node_version=$(node --version | cut -c 2-3)
    keagate_debug "Installed node version: $installed_node_version"
    if (("$installed_node_version" < "14")); then
        echo -e '\0033\0143'
        read -p "Your existing node version ($installed_node_version) is too low for Keagate. Would you like me to automatically upgrade Node and NPM? (You can revert back with \`nvm install $installed_node_version && nvm use $installed_node_version\`) [Y/n] " -n 1 -r
        echo # (optional) move to a new line
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            install_node
        else
            keagate_echo "Please manually upgrade Node to at least version 14, then run this script again."
            exit 1
        fi
    fi
else
    install_node
fi

cd $INSTALL_DIR

if [ -d "$FOLDER_NAME" ]; then
    keagate_debug "Found an existing $FOLDER_NAME/. Asking for permission to override..."
    echo -e '\0033\0143'
    read -p "Folder $FOLDER_NAME/ already exists in $INSTALL_DIR. Would you like me to overwrite this? (This will preserve \`config/local.json\`) [Y/n] " -n 1 -r
    echo # (optional) move to a new line
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        keagate_debug "Caching existing local.json to a temporary file..."
        cp -f $FOLDER_NAME/config/local.json ./local.json || true
        rm -rf $FOLDER_NAME
        # start_spinner "Cloning Keagate repo"
        git clone $REPO_LOCATION
        cp -f ./local.json $FOLDER_NAME/config/local.json || true
        rm -f ./local.json || true
    fi
else
    # start_spinner "Cloning Keagate repo"
    git clone $REPO_LOCATION
fi

# stop_spinner

cd $FOLDER_NAME

# >/dev/null 2>&1

# start_spinner "Installing and configuring pnpm"
npm i -g pnpm
export PNPM_HOME="$HOME/.local/share/pnpm"
export PATH="$PNPM_HOME:$PATH"
pnpm setup
# stop_spinner

# start_spinner "Installing Keagate depencencies"
pnpm i --silent -g pm2
pnpm i --silent
# stop_spinner

# start_spinner "Building Keagate"
pnpm run build
# stop_spinner

echo -e '\0033\0143'
node packages/scripts/build/configure.js $NODE_ARGS

# pnpm run start
