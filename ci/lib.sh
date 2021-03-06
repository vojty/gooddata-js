#!/bin/bash

setupGrunt () {
    echo "Installing Grunt and dependencies..."

    # this should really be a dependency of the client
    npm install grunt-cli

    # install dependencies
    npm install && bower install

    export SETUP="1"
}

export PATH=$PATH:$WORKSPACE/node_modules/.bin

# initiate
if [ -z "$SETUP" ]; then
    setupGrunt
fi