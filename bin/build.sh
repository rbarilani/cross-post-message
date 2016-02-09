#!/usr/bin/env bash

DIST_FOLDER='./dist'

browserify lib/exports/client.js -o ${DIST_FOLDER}/client.js -t [ babelify --presets [ es2015 ] ]
uglifyjs ${DIST_FOLDER}/client.js --keep-fnames --reserved exports,require,module  > ${DIST_FOLDER}/client.min.js

browserify lib/exports/hub.js -o ${DIST_FOLDER}/hub.js  -t [ babelify --presets [ es2015 ] ]
uglifyjs ${DIST_FOLDER}/hub.js --keep-fnames --reserved exports,require,module  > ${DIST_FOLDER}/hub.min.js

