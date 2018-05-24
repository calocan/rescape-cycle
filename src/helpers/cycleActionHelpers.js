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
import R from 'ramda';
import xs from 'xstream';
import {sources} from './sources';
import {v} from 'rescape-validate';
import {PropTypes} from 'prop-types';

/**
 * Make any config sources that are objects into a function returning a stream, as Cycle.js expects.
 * This is used for configuration objects that are not real drivers
 * @param {Object} sources Cycle.js sources
 * @returns {Object} Cycle.js sources with any configuration objects turned into streams
 */
export const streamConfigSources = R.map(
  R.when(R.complement(R.is(Function)), source => () => xs.of(source))
);

/**
 * Overrides the config sources with sources for particular Redux actions.
 * Also makes any config sources into streams to work with Cycle.js
 * This is just being used for the ACTION_CONFIG source, but can override any other source
 * @param {Object} sources The overrides
 * @returns {Object} Merged sources with configs turned into streams
 */
export const overrideSources = R.compose(
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
export const overrideSourcesWithoutStreaming = R.merge(sources);

/**
 * Merges cycle.js sources that have each have a different ACTION_CONFIG
 * Since each ACTION_CONFIG.configByType has distinct types, we can safely merge
 * that object together
 * @param {[Object]} cycleSources Sources for different models, presumably each
 * containing an ACTION_CONFIG source
 * @returns {Object} A merged cycle.js drivers object. Only ACTION_CONFIG is merged.
 * Other drivers are assumed identical and the right side value is taken
 */
export const mergeCycleSources = v(cycleSources => R.reduce(
  // This is 2-arity. It receives the reduction and current source
  R.mergeDeepWithKey((k, l, r) => k === 'configByType' ? R.merge(l, r) : r),
  {},
  cycleSources
),
[
  ['cycleSources', PropTypes.arrayOf(PropTypes.shape()).isRequired]
], 'mergeCycleSources');

