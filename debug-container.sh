#!/usr/bin/env bash

set -euo pipefail
IFS=$'\n\t'

NAME="$(basename $(pwd))"

stop() {
    echo 'stopping'
    docker stop "${NAME}" || echo 'no container'
    docker rm -v "${NAME}" || echo 'no container'
    docker image rm "${NAME}" || echo 'no image'
}

start() {
    stop

    echo 'starting'
    docker build -t "${NAME}" .
    docker run --name "${NAME}" -v "${HOME}/docker/${NAME}:/app/logs" -d "${NAME}"
    docker stats "${NAME}"
}

if [ $# -ne 1 ]; then
    echo "usage: $0 [start | stop]"
else
    $1
fi
