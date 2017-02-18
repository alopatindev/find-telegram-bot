#!/usr/bin/env bash

set -euo pipefail
IFS=$'\n\t'

NAME="$(basename $(pwd))"
DOCKERFILE="Dockerfile.debug"

stop() {
    echo 'stopping'
    docker stop "${NAME}" || echo 'no container'
    docker rm -v "${NAME}" || echo 'no container'
    docker image rm "${NAME}" || echo 'no image'
    #docker rm $(docker ps -q -f status=exited) || echo 'nothing to remove'
}

start() {
    stop
    rm -rf node_modules

    echo 'starting'
    docker build -t "${NAME}" -f "${DOCKERFILE}" .
    docker run --name "${NAME}" -v "${HOME}/docker/${NAME}:/app/logs" "${NAME}"
    #docker run --name "${NAME}" --restart=on-failure -d -v "${HOME}/docker/${NAME}:/app/logs" "${NAME}"
    #docker stats "${NAME}"
}

if [ $# -ne 1 ]; then
    echo "usage: $0 [start | stop]"
else
    $1
fi
