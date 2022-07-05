#!/bin/bash

set -e

OS="$(uname -s)"
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

update_node() {
    npm i -g n
    n 16
}

install_node() {
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"                   # This loads nvm
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion" # This loads nvm bash_completion
    nvm install 16
    nvm use 16
    update_node
}

if keagate_has "node" && keagate_has "npm"; then
    keagate_debug "Node and NPM detected. Checking versions..."
    installed_node_version=$(node --version | cut -c 2-3)
    keagate_debug "Installed node version: $installed_node_version"
    if (("$installed_node_version" < "14")); then
        read -p "Your existing node version ($installed_node_version) is too low for Keagate. Would you like me to automatically upgrade Node and NPM? (You can revert back with \`nvm install $installed_node_version && nvm use $installed_node_version\`) [Y/n] " -n 1 -r
        echo # (optional) move to a new line
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            update_node
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
        git clone $REPO_LOCATION
        cp -f ./local.json $FOLDER_NAME/config/local.json >/dev/null 2>&1 || true
        rm -f ./local.json || true
    fi
else
    git clone $REPO_LOCATION
fi

cd $FOLDER_NAME
npm i
npm i -g pm2 m >/dev/null 2>&1
npm run build
node packages/scripts/build/installer.js $INSTALLER_ARGS
