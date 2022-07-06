#!/bin/bash

set -e

# OS="$(uname -s)"
INSTALL_DIR="$HOME"
FOLDER_NAME="Keagate"
REPO_LOCATION="https://github.com/dilan-dio4/$FOLDER_NAME"
INSTALLER_ARGS=""

# yes/no script
# read -p "Are you sure? " -n 1 -r
# echo    # (optional) move to a new line
# if [[ $REPLY =~ ^[Yy]$ ]]
# then
#     ...do dangerous stuff
# fi

function _spinner() {
    # $1 start/stop
    #
    # on start: $2 display message
    # on stop : $2 process exit status
    #           $3 spinner function pid (supplied from stop_spinner)

    local on_success="DONE"
    local on_fail="FAIL"
    local white="\e[1;37m"
    local green="\e[1;32m"
    local red="\e[1;31m"
    local nc="\e[0m"

    case $1 in
    start)
        # calculate the column where spinner and status msg will be displayed
        let column=$(tput cols)-${#2}-8
        # display message and position the cursor in $column column
        echo -ne ${2}
        printf "%${column}s"

        # start spinner
        i=1
        sp='\|/-'
        delay=${SPINNER_DELAY:-0.15}

        while :; do
            printf "\b${sp:i++%${#sp}:1}"
            sleep $delay
        done
        ;;
    stop)
        if [[ -z ${3} ]]; then
            echo "spinner is not running.."
            exit 1
        fi

        kill $3 >/dev/null 2>&1

        # inform the user uppon success or failure
        echo -en "\b["
        if [[ $2 -eq 0 ]]; then
            echo -en "${green}${on_success}${nc}"
        else
            echo -en "${red}${on_fail}${nc}"
        fi
        echo -e "]"
        ;;
    *)
        echo "invalid argument, try {start/stop}"
        exit 1
        ;;
    esac
}

function start_spinner {
    # $1 : msg to display
    _spinner "start" "${1}" &
    # set global spinner pid
    _sp_pid=$!
    disown
}

function stop_spinner {
    # $1 : command exit status
    _spinner "stop" $1 $_sp_pid
    unset _sp_pid
}

# Parse Flags
for i in "$@"; do
    case $i in
    -q | --quiet)
        QUIET="true"
        INSTALLER_ARGS+="$key "
        shift # past argument
        # shift # past value
        ;;
    -v | --verbose)
        VERBOSE="true"
        INSTALLER_ARGS+="$key "
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

is_user_root() { [ "$(id -u)" -eq 0 ]; }

install_node() {
    start_spinner "Installing Node and NPM via nvm"
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"                   # This loads nvm
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion" # This loads nvm bash_completion
    nvm install 16 >/dev/null 2>&1
    nvm use 16 >/dev/null 2>&1
    stop_spinner 0
}

# Install Docker - used for Mongo and Nginx
start_spinner "Downloading docker"
stop_spinner 0
curl -fsSL https://get.docker.com -o get-docker.sh
if ! is_user_root; then
    keagate_debug "Script is not running as root, needs password..."
    read -s -p "Password: " password
    echo
    start_spinner "Installing docker"
    echo "$password\n" | sudo -S sh get-docker.sh >/dev/null 2>&1
else
    start_spinner "Installing docker"
    sh get-docker.sh >/dev/null 2>&1
fi
stop_spinner 0

if keagate_has "node" && keagate_has "npm"; then
    keagate_debug "Node and NPM detected. Checking versions..."
    installed_node_version=$(node --version | cut -c 2-3)
    keagate_debug "Installed node version: $installed_node_version"
    if (("$installed_node_version" < "14")); then
        read -p "Your existing node version ($installed_node_version) is too low for Keagate. Would you like me to automatically upgrade Node and NPM? (You can revert back with \`nvm install $installed_node_version && nvm use $installed_node_version\`) [Y/n] " -n 1 -r
        echo # (optional) move to a new line
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            install_node
        else
            keagate_echo "Please manually upgrade Node to at least version 14, then run this script again."
            exit 0
        fi
    fi
else
    install_node
fi

cd $INSTALL_DIR

if [ -d "$FOLDER_NAME" ]; then
    keagate_debug "Found an existing $FOLDER_NAME/. Asking for permission to override..."
    read -p "Folder $FOLDER_NAME/ already exists in $INSTALL_DIR. Would you like me to overwrite this? (This will preserve \`config/local.json\`) [Y/n] " -n 1 -r
    echo # (optional) move to a new line
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cp -f $FOLDER_NAME/config/local.json ./local.json >/dev/null 2>&1 || true
        rm -rf $FOLDER_NAME
        start_spinner "Cloning Keagate repo"
        git clone $REPO_LOCATION >/dev/null 2>&1
        cp -f ./local.json $FOLDER_NAME/config/local.json >/dev/null 2>&1 || true
        rm -f ./local.json || true
    fi
else
    start_spinner "Cloning Keagate repo"
    git clone $REPO_LOCATION
fi
stop_spinner 0


cd $FOLDER_NAME

# Init
start_spinner "Installing and configuring pnpm"
npm i --silent -g pnpm
export PNPM_HOME="$HOME/.local/share/pnpm"
export PATH="$PNPM_HOME:$PATH"
pnpm setup
stop_spinner 0

start_spinner "Installing Keagate depencencies"
pnpm i --silent -g pm2
pnpm i --silent
stop_spinner 0

start_spinner "Building Keagate"
pnpm run build >/dev/null 2>&1
stop_spinner 0

node packages/scripts/build/installer.js $INSTALLER_ARGS
