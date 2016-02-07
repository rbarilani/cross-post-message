#!/usr/bin/env bash

DIST_FOLDER='./dist'

browserify lib/Client.js -o ${DIST_FOLDER}/client.js -s CrossPostMessageClient -t [ babelify --presets [ es2015 ] ]
uglifyjs ${DIST_FOLDER}/client.js --keep-fnames --reserved exports,require,module  > ${DIST_FOLDER}/client.min.js

browserify lib/Hub.js -o ${DIST_FOLDER}/hub.js -s CrossPostMessageHub -t [ babelify --presets [ es2015 ] ]
uglifyjs ${DIST_FOLDER}/hub.js --keep-fnames --reserved exports,require,module  > ${DIST_FOLDER}/hub.min.js

