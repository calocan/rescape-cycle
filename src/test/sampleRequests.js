/**
 * Created by Andy Likuski on 2017.09.18
 * Copyright (c) 2017 Andy Likuski
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

const R = require('ramda');
const {apiUri} = require('../helpers/configHelpers');
const {asyncActionsPhaseKeysForActionConfig} = require('../helpers/actionHelpers');
const {actionCreatorNameForPhase, makeActionCreatorsForConfig} = require('../helpers/actionCreatorHelpers');
const {reqPath} = require('rescape-ramda').throwing;
const {config} = require('test/testConfig');
const {PropTypes} = require('prop-types');
const {
  VERBS: { FETCH, UPDATE, ADD, REMOVE, SELECT, DESELECT },
  PHASES: { REQUEST, SUCCESS, FAILURE}
} = require('../helpers/actionHelpers');
const {v} = require('rescape-validate');

/**
 * Returns a sample fetch request body for tests
 * @param {Object} actionConfig An actionConfig for fetching the model of iterest
 * @param {Object|Array} objs Functor representing the instances
 * @returns {Object} The sample request body based on the actionConfig and objs
 */
const sampleFetchRequestBody = module.exports.sampleFetchRequestBody = v(R.curry((actionConfig, objs) => {
  const actionTypeLookup = asyncActionsPhaseKeysForActionConfig(actionConfig);
  const actionName = actionCreatorNameForPhase(actionConfig);
  const actions = makeActionCreatorsForConfig(actionConfig);
  return {
    request: {
      url: `${apiUri(reqPath(['settings', 'api'], config))}/${actionConfig.model}`,
      type: actionTypeLookup[REQUEST],
      filters: R.omit(['type'], actions[actionName](objs)),
      // We process all responses in the same place for now,
      // so use a catch-all category name
      category: 'all'
    }
  }
}),
[
  ['actionConfig', PropTypes.shape().isRequired],
  ['objs', PropTypes.array.isRequired]
], 'sampleFetchRequestBody');


/**
 * HTTP driver sample response. including the request since that is what the Cycle.js HTTP driver does
 * @params {Object} actionConfig An actionConfig for fetching the model of interest
 * @params {Object|Array} objs Functor representing the instances
 * @returns {Object} The sample response body based on the actionConfig and objs
 */
module.exports.sampleFetchResponseSuccess = v(R.curry((actionConfig, objs) => R.merge(
  sampleFetchRequestBody(actionConfig, objs), {
    status: 200,
    data: objs
  }
)),
[
  ['actionConfig', PropTypes.shape().isRequired],
  ['objs', PropTypes.array.isRequired]
], 'sampleFetchResponseSuccess');

/**
 * HTTP driver sample error response.
 * @params {Object} actionConfig An actionConfig for fetching the model of interest
 * @params {Object|Array} objs Functor representing the instances
 * @returns {Object} The sample response error based on the actionConfig and objs
 */
module.exports.sampleFetchResponseError = v(R.curry((actionConfig, objs) => R.merge(
  sampleFetchRequestBody(objs), {
    status: 500,
    message: 'Internal Server Error'
  }
)),
[
  ['actionConfig', PropTypes.shape().isRequired],
  ['objs', PropTypes.array.isRequired]
], 'sampleFetchResponseError');

/**
 * HTTP driver sample patch request body
 * @params {Object} actionConfig An actionConfig for fetching the model of interest
 * @params {Object|Array} objs Functor representing the instances
 * @returns {Object} The sample request patch body based on the actionConfig and objs
 */
const samplePatchRequestBody = module.exports.samplePatchRequestBody = v(R.curry((actionConfig, objs) => {
  const actionTypeLookup = asyncActionsPhaseKeysForActionConfig(actionConfig);
  const actionName = actionCreatorNameForPhase(actionConfig, REQUEST);
  const actions = makeActionCreatorsForConfig(actionConfig);
  return {
    // PATCH calls don't have a URL path, since the path is in the standarized
    // JSON query
    url: apiUri(reqPath(['settings', 'api'], config)),
    method: 'PATCH',
    type: actionTypeLookup[REQUEST],
    query: {
      op: R.toLower(actionConfig.verb),
      path: `/${actionConfig[actionName].model}`,
      value: R.omit(['type'], actions[actionName](R.values(R.omit(['id'], objs))))
    },
    // We process all responses in the same place for now,
    // so use a catch-all category name
    category: 'all'
  }
}),
[
  ['actionConfig', PropTypes.shape().isRequired],
  ['objs', PropTypes.array.isRequired]
], 'samplePatchRequestBody');

/**
 * HTTP driver sample patch response body
 * @params {Object} actionConfig An actionConfig for fetching the model of interest
 * @params {Object|Array} objs Functor representing the instances
 * @returns {Object} The sample response patch body based on the actionConfig and objs
 */
module.exports.samplePatchResponseSuccess = v(R.curry((actionConfig, objs) => ({
  status: 200,
  request: samplePatchRequestBody(actionConfig, objs),
  data: objs
})),
[
  ['actionConfig', PropTypes.shape().isRequired],
  ['objs', PropTypes.array.isRequired]
], 'samplePatchResponseSuccess');
