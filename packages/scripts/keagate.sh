#!/bin/bash

{ # this ensures the entire script is downloaded #

    # OS="$(uname -s)"
    if [ -n "$SUDO_USER" ]; then
        HOME="$(getent passwd "$SUDO_USER" | cut -d: -f6)"
    fi

    INSTALL_DIR="$HOME"
    FOLDER_NAME="Keagate"
    REPO_LOCATION="https://github.com/dilan-dio4/$FOLDER_NAME"
    NODE_ARGS=""

    # sudo chmod 777 -R .local

    # Parse Flags
    for i in "$@"; do
        case $i in
        -q | --quiet)
            QUIET="true"
            NODE_ARGS+="$i "
            shift # past argument
            # shift # past value
            ;;
        -v | --verbose)
            VERBOSE="true"
            NODE_ARGS+="$i "
            shift # past argument
            # shift # past value
            ;;
        *)
            keagate_echo "Unrecognized argument $i"
            exit 1
            ;;
        esac
    done

    keagate_has() {
        command -v "$1" >/dev/null 2>&1
    }

    keagate_echo() {
        command printf %s\\n "$*" 2>/dev/null
    }

    keagate_debug() {
        if [ -n "$VERBOSE" ]; then
            command printf %s\\n "$*" 2>/dev/null
        fi
    }

    print_complete() {
        echo -e "\033[1;32m \xE2\x9C\x94 ${1:-"Complete"}\033[0m"
    }

    install_node() {
        keagate_echo "Installing Node and NPM via nvm..."
        curl -s -o nvm.sh https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh
        chmod +x ./nvm.sh
        export NVM_DIR="$HOME/.nvm"
        ./nvm.sh >/dev/null 2>&1
        rm ./nvm.sh
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"                   # This loads nvm
        [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion" # This loads nvm bash_completion
        nvm install 16 >/dev/null 2>&1
        nvm use 16 >/dev/null 2>&1
        print_complete
    }

    clean_stdin() {
        read -r -t 1 -n 10000 discard
    }

    # https://gist.github.com/kujiy/3a4d2dc368db93712f638a28462de62d
    ask() {
        # http://djm.me/ask
        local prompt default REPLY
        while true; do
            if [ "${2:-}" = "Y" ]; then
                prompt="Y/n"
                default=Y
            elif [ "${2:-}" = "N" ]; then
                prompt="y/N"
                default=N
            else
                prompt="y/n"
                default=
            fi

            # Ask the question (not using "read -p" as it uses stderr not stdout)
            echo -n "$1 [$prompt] "
            # Read the answer (use /dev/tty in case stdin is redirected from somewhere else)
            read REPLY </dev/tty

            # Default?
            if [ -z "$REPLY" ]; then
                REPLY=$default
            fi

            # Check if the reply is valid
            case "$REPLY" in
            Y* | y*) return 0 ;;
            N* | n*) return 1 ;;
            esac
        done
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

    if ! keagate_has "git"; then
        keagate_echo "git command not found. Installing..."
        if keagate_has "apt"; then
            sudo apt -y install git-all
        elif keagate_has "dnf"; then
            sudo dnf -y install git-all
        else
            echo "Could not install git from bash. Please install git, then run this script again. (For more information: https://git-scm.com/download/linux)"
            exit 1
        fi
        print_complete
    else
        print_complete "git detected"
    fi

    if ! keagate_has "docker"; then
        keagate_echo "Docker command not found. Installing..."
        # Install Docker - used for Mongo and Nginx
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh >/dev/null 2>&1
        rm get-docker.sh
        if ! keagate_has "docker"; then
            echo "Could not install Docker from bash. Please install Docker, then run this script again. (For more information: https://docs.docker.com/desktop/linux/install/)"
            exit 1
        fi
        print_complete
    else
        print_complete "Docker detected"
    fi

    # Fix permissions issue on certain ports from `docker run`
    sudo chmod 666 /var/run/docker.sock

    VERBOSE="true"

    if keagate_has "node" && keagate_has "npm"; then
        print_complete "Node and NPM detected"
        installed_node_version=$(node --version | cut -c 2-3)
        if (("$installed_node_version" < "14")); then
            if ask "Your existing Node version ($installed_node_version) is too low for Keagate. Would you like me to automatically upgrade Node and NPM? (You can revert back with \`nvm install $installed_node_version && nvm use $installed_node_version\`)"; then
                install_node
            else
                keagate_echo "Please manually upgrade Node to at least version 14, then run this script again."
                exit 1
            fi
        else
            print_complete "Node and NPM version $installed_node_version satisfactory"
        fi
    else
        install_node
    fi

    cd $INSTALL_DIR

    if [ -d "$FOLDER_NAME" ]; then
        keagate_debug "Found an existing $FOLDER_NAME/. Asking for permission to override..."
        if ask "Folder $FOLDER_NAME/ already exists in $INSTALL_DIR. Would you like me to overwrite this? (This will preserve \`config/local.json\`)"; then
            keagate_debug "Caching existing local.json to a temporary file..."
            sudo chown -R "$(whoami)" $FOLDER_NAME/
            cp -f $FOLDER_NAME/config/local.json ./local.json >/dev/null 2>&1 || true
            rm -rf $FOLDER_NAME
            echo "Cloning Keagate repo..."
            git clone $REPO_LOCATION >/dev/null 2>&1
            cp -f ./local.json $FOLDER_NAME/config/local.json >/dev/null 2>&1 || true
            rm -f ./local.json || true
        fi
    else
        keagate_echo "Cloning Keagate repo..."
        git clone $REPO_LOCATION >/dev/null 2>&1
    fi

    sudo chown -R "$(whoami)" $FOLDER_NAME/
    print_complete

    cd $FOLDER_NAME

    # >/dev/null 2>&1

    echo "Installing and configuring pnpm..."
    npm i -g pnpm >/dev/null 2>&1
    export PNPM_HOME="$HOME/.local/share/pnpm"
    export PATH="$PNPM_HOME:$PATH"
    pnpm setup >/dev/null 2>&1
    print_complete

    echo "Installing Keagate dependencies..."
    pnpm i --silent -g pm2
    pnpm i --silent
    print_complete

    echo "Building Keagate..."
    pnpm run build >/dev/null 2>&1
    print_complete

    node packages/scripts/build/configure.js "$NODE_ARGS"

    pm2 stop Keagate || true
    pm2 del Keagate || true
    pm2 start packages/backend/build/index.js --name "Keagate" --time
    pm2 save

} # this ensures the entire script is downloaded #

# https://www.shellcheck.net/
