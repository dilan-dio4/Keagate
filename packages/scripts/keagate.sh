#!/bin/bash

set -e

OS="$(uname -s)"
INSTALL_DIR="$HOME"
FOLDER_NAME="Keagate"
REPO_LOCATION="https://github.com/dilan-dio4/$FOLDER_NAME"
INSTALLER_ARGS=""

# @file Interaction
# @brief Functions to enable interaction with the user.

# @description Prompt yes or no question to the user.
#
# @example
#   interaction::prompt_yes_no "Are you sure to proceed" "yes"
#   #Output
#   Are you sure to proceed (y/n)? [y]
#
# @arg $1 string The question to be prompted to the user.
# @arg $2 string default answer \[yes/no\] (optional).
#
# @exitcode 0  If user responds with yes.
# @exitcode 1  If user responds with no.
# @exitcode 2 Function missing arguments.
interaction::prompt_yes_no() {
    [[ $# = 0 ]] && printf "%s: Missing arguments\n" "${FUNCNAME[0]}" && return 2
    declare def_arg response
    def_arg=""
    response=""

    case "${2}" in
    [yY] | [yY][eE][sS])
        def_arg=y
        ;;
    [nN] | [nN][oO])
        def_arg=n
        ;;
    esac

    while :; do
        printf "%s (y/n)? " "${1}"
        [[ -n "${def_arg}" ]] && printf "[%s] " "${def_arg}"

        read -r response
        [[ -z "${response}" ]] && response="${def_arg}"

        case "${response}" in
        [yY] | [yY][eE][sS])
            response=y
            break
            ;;
        [nN] | [nN][oO])
            response=n
            break
            ;;
        *)
            response=""
            ;;
        esac
    done

    [[ "${response}" = 'y' ]] && return 0 || return 1
}

# @description Prompt question to the user.
#
# @example
#   interaction::prompt_response "Choose directory to install" "/home/path"
#   #Output
#   Choose directory to install? [/home/path]
#
# @arg $1 string The question to be prompted to the user.
# @arg $2 string default answer (optional).
#
# @exitcode 0  If user responds with answer.
# @exitcode 2 Function missing arguments.
#
# @stdout User entered answer to the question.
interaction::prompt_response() {
    [[ $# = 0 ]] && printf "%s: Missing arguments\n" "${FUNCNAME[0]}" && return 2

    declare def_arg response
    response=""
    def_arg="${2}"

    while :; do
        printf "%s ? " "${1}"
        [[ -n "${def_arg}" ]] && [[ "${def_arg}" != "-" ]] && printf "[%s] " "${def_arg}"

        read -r response
        [[ -n "${response}" ]] && break

        if [[ -z "${response}" ]] && [[ -n "${def_arg}" ]]; then
            response="${def_arg}"
            break
        fi
    done

    [[ "${response}" = "-" ]] && response=""

    printf "%s" "${response}"
}

keagate_has() {
    type "$1" >/dev/null 2>&1
}

keagate_echo() {
    command printf %s\\n "$*" 2>/dev/null
}

# Parse Flags
parse_args() {
    while [[ $# -gt 0 ]]; do
        key="$1"

        case $key in
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
}

update_node() {
    npm i -g n
    n 16
}

install_node() {
    mkdir $HOME/.n
    export N_PREFIX=$HOME/.n
    curl -L https://raw.githubusercontent.com/tj/n/master/bin/n -o n
    bash n lts
    update_node
}

parse_args "$@"

if keagate_has "node" && keagate_has "npm"; then
    $VERBOSE && keagate_echo "Node and NPM detected. Checking versions..."
    installed_node_version=$(node --version | cut -c 2-3)
    $VERBOSE && keagate_echo "Installed node version: $installed_node_version"
    if (("$installed_node_version" < "14")); then
        interaction::prompt_yes_no "Your existing node version ($installed_node_version) is too low for Keagate. Would you like me to automatically upgrade Node and NPM? (You can revert back with \`n $installed_node_version\`)" "yes"
        should_upgrade_node=$?
        if (($should_upgrade_node == 0)); then
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
    interaction::prompt_yes_no "Folder $FOLDER_NAME/ already exists in $INSTALL_DIR. Would you like me to overwrite this? (This will preserve \`config/local.json\`)" "yes"
    should_remove_stale_folder=$?
    if (($should_remove_stale_folder == 0)); then
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
