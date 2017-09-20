/**
 * Created by Andy Likuski on 2017.08.19
 * Copyright (c) 2017 Andy Likuski
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
const R = require('ramda');
const xs = require('xstream').default;
const {sources} = require('./sources');

/**
 * Make any config sources into streams, as Cycle.js expects
 * @param {Object} sources Cycle.js sources
 * @returns {Object} Cycle.js sources with any configuration objects turned into streams
 */
const streamConfigSources = module.exports.streamConfigSources = R.map(R.when(R.is(Object), xs.of));

/**
 * Overrides the config sources with sources for particular Redux actions.
 * Also makes any config sources into streams to work with Cycle.js
 * This is just being used for the ACTION_CONFIG source, but can override any other source
 * @param {Object} sources The overrides
 * @returns {Object} Merged sources with configs turned into streams
 */
module.exports.overrideSources = R.compose(
  // Make config sources into streams
  streamConfigSources,
  // Merge config sources with overrides
  R.merge(sources)
);

/**
 * Like overrideSources but doesn't turn Object sources into streams,
 * since marble tests make their own diagram streams
 * @param {Object} sources The overrides
 * @returns {Object} Merged sources
 */
module.exports.overrideSourcesWithoutStreaming = R.merge(sources);

