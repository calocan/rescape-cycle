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
const {asyncActionsPhaseKeysForActionConfig, actionName} = require('../helpers/actionHelpers');
const {makeActionCreatorsForConfig} = require('../helpers/actionCreatorHelpers');
const {reqPath} = require('rescape-ramda').throwing;
const {PropTypes} = require('prop-types');
const {mapKeys} = require('rescape-ramda');
const {
  PHASES: { REQUEST, SUCCESS, FAILURE},
  VERBS: { FETCH, ADD }
} = require('../helpers/actionHelpers');
const {v} = require('rescape-validate');

/**
 * Creates test body functions for all given actionConfigs
 * If one actionConfig is model: 'City', verb: FETCH
 * and another is model: 'Location', verb: REPLACE,
 * this function will return
 * {
 *  fetchCityRequestBody: { sample fetch city request body }
 *  fetchCitySuccessBody: { sample fetch city success response body }
 *  fetchCityFailureBody: { sample fetch city success response failure body }
 *  replaceLocationRequestBody: { sample replace location PATCH request body }
 *  replaceLocationSuccessBody: { sample replace location PATCH success response body }
 *  replaceLocationFailureBody: { sample replace location PATCH success response failure body }
 * }
 * @param {Object} config A minimal config object, needed for API values such as domain, even though
 * no actual requests are made.
 * @param {[Object]} actionConfigs ActionConfigs without the phase key. See actionCreatorHelpers for format
 * @param {Object} scopeValues Object of values that the actions expects, e.g. {user: 123, project: 456}.
 * Different actionCreators might use one or more of the scope values. Just make sure all needed values are in
 * this object
 * @param {Object} objs An lookup of objects for each model, where each can be an object or array or any
 * other functor, for instance
 * {
 * [MODELS.CITY]: {123: {name: 'Jackson Hole'}, 234: {...}, ...}
 * [MODELS.LOCATION]: [{name: 'Castro Valley Golden Tee'}, {name: 'Castro Valley Village Bowl'}]
 * ...
 * }
 * @returns {Object} All test bodies as shown in the example above
 */
module.exports.testBodies = v((config, actionConfigs, scopeValues, objs) =>
  // Add 'Body' to the action name so we know this is a test request/response body
  mapKeys(
    theActionName => `${theActionName}Body`,
    // Each iteration returns an object of three items, so merge them all
    R.mergeAll(R.map(
      // Map each actionConfig, which itself represents the three phases--REQUEST, SUCCESS, FAILURE
      actionConfig => {
        // Map the actionName to the phase. We'll use this to resolve the actionCreator action name to a phase
        const actionNameToPhase =
          mapKeys(phase => actionName(actionConfig.model, actionConfig.verb, phase), {REQUEST, SUCCESS, FAILURE});
        // Creates the three actionCreators, one for each phase.
        const actionCreators = makeActionCreatorsForConfig(actionConfig, scopeValues);
        // Create a the three actionCreators for this actionConfig and map each to the appropriate
        // resquest/response body based on the phase and verb (e.g. FETCH, REPLACE, etc)
        return R.mapObjIndexed(
          (actionCreator, name) => {
            const phase = actionNameToPhase[name];
            const phasedActionConfig = R.merge(actionConfig, {phase});

            // We always need to make the request, since other phases back reference it, so 'hard code' it
            const requestBody = sampleRequestBody(
              config,
              R.merge(actionConfig, {phase: REQUEST}),
              actionCreators[actionName(actionConfig.model, actionConfig.verb, REQUEST)],
              reqPath([actionConfig.model], objs)
            );

            // Pick the correct body function. Also pass the objs of the actionConfig's model to use in our
            // request/response
            return R.cond([
              [R.equals(REQUEST), R.always(requestBody)],
              [R.equals(SUCCESS), () => sampleSuccessBody(phasedActionConfig, actionCreator, requestBody, reqPath([actionConfig.model], objs))],
              [R.equals(FAILURE), () => sampleFailureBody(phasedActionConfig, actionCreator, requestBody, reqPath([actionConfig.model], objs))]
            ])(phase);
          },
          actionCreators
        );
      },
      actionConfigs
    ))
),
[
  ['config', PropTypes.shape().isRequired],
  ['actionConfigs', PropTypes.array.isRequired],
  ['scopeValues', PropTypes.shape().isRequired],
  ['objs', PropTypes.oneOfType([PropTypes.array, PropTypes.shape()]).isRequired]
], 'testBodies');

/**
 * Delegates to the property request body function based on the phasedActionConfig's verb (e.g. FETCH, REPLACE, etc)
 * @param {Object} config A config containing the api info
 * @param {Object} config.settings A config containing the api info
 * @param {Object} config.settings.api A config containing the api info
 * @param {Object} actionConfig An actionConfig containing the verb which is check
 * @param {Function} actionCreator Returns an action body when called with objs
 * @param {Object, Array} objs Objects particular to the model of actionConfig
 * @returns {Object} A sample request body
 */
const sampleRequestBody = v((config, actionConfig, actionCreator, objs) => {
  return R.cond([
    // Fetch
    [R.equals(FETCH), () => sampleFetchRequestBody(config, actionConfig, actionCreator, objs)],
    // If not a fetch assume a patch
    [R.T, () => samplePatchRequestBody(config, actionConfig, actionCreator, objs)]
  ])(actionConfig.verb);
},
[
  ['config', PropTypes.shape({
    settings: PropTypes.shape({
      api: PropTypes.shape().isRequired
    }).isRequired
  }).isRequired],
  ['actionConfig', PropTypes.shape().isRequired],
  ['actionCreator', PropTypes.func.isRequired],
  ['objs', PropTypes.oneOfType([PropTypes.array, PropTypes.shape()]).isRequired]
], 'sampleRequestBody');

/**
 * Delegates to the proper success response body function based on the phasedActionConfig's verb (e.g. FETCH, REPLACE, etc)
 * @param {Object} actionConfig An actionConfig containing the verb which is check
 * @param {Function} actionCreator Returns an action body when called with objs
 * @param {Object} requestBody The requestBody that resulted in the success body
 * @param {Object, Array} objs Objects particular to the model of actionConfig
 * @returns {Object} A sample request body
 */
const sampleSuccessBody = v((actionConfig, actionCreator, requestBody, objs) =>
  R.cond([
    // Fetch
    [R.equals(FETCH), () => sampleFetchResponseSuccess(actionConfig, actionCreator, requestBody, objs)],
    // If not a fetch assume a patch
    [R.T, () => samplePatchResponseSuccess(actionConfig, actionCreator, requestBody, objs)]
  ])(actionConfig.verb),
[
  ['actionConfig', PropTypes.shape().isRequired],
  ['actionCreator', PropTypes.func.isRequired],
  ['requestBody', PropTypes.shape().isRequired],
  ['objs', PropTypes.oneOfType([PropTypes.array, PropTypes.shape()]).isRequired]
], 'sampleSuccessBody');


/**
 * Delegates to the proper failure response body function based on the phasedActionConfig's verb (e.g. FETCH, REPLACE, etc)
 * @param {Object} actionConfig An actionConfig containing the verb which is check
 * @param {Function} actionCreator Returns an action body when called with objs
 * @param {Object} requestBody The requestBody that resulted in the success body
 * @param {Object, Array} objs Objects particular to the model of actionConfig
 * @returns {Object} A sample request body
 */
const sampleFailureBody = v((actionConfig, actionCreator, requestBody, objs) =>
  R.cond([
    // Fetch
    [R.equals(FETCH), () => sampleFetchResponseFailure(actionConfig, actionCreator, requestBody, objs)],
    // If not a fetch assume a patch
    [R.T, () => samplePatchResponseFailure(actionConfig, actionCreator, requestBody, objs)]
  ])(actionConfig.verb),
[
  ['actionConfig', PropTypes.shape().isRequired],
  ['actionCreator', PropTypes.func.isRequired],
  ['requestBody', PropTypes.shape().isRequired],
  ['objs', PropTypes.oneOfType([PropTypes.array, PropTypes.shape()]).isRequired]
], 'sampleFailureBody');

/**
 * Returns a sample fetch request body for tests
 * @param {Object} config The config object, needed for the api
 * @param {Object} config.settings The config object, needed for the api
 * @param {Object} config.settings.api The config object, needed for the api
 * @param {Object} actionConfig An actionConfig for fetching the model of interest.
 * @param {Function} actionCreator When called with objs returns an action body
 * @param {Object|Array} objs Functor representing the instances
 * @returns {Object} The sample request body based on the actionConfig and objs
 */
const sampleFetchRequestBody = module.exports.sampleFetchRequestBody = v(R.curry((config, actionConfig, actionCreator, objs) => {
  const actionTypeLookup = asyncActionsPhaseKeysForActionConfig(actionConfig);
  return {
    request: {
      url: `${apiUri(reqPath(['settings', 'api'], config))}/${actionConfig.model}`,
      type: actionTypeLookup[REQUEST],
      filters: R.omit(['type'], actionCreator(objs)),
      // We process all responses in the same place for now,
      // so use a catch-all category name
      category: 'all'
    }
  };
}),
[
  ['config', PropTypes.shape({
    settings: PropTypes.shape({
      api: PropTypes.shape().isRequired
    }).isRequired
  }).isRequired],
  ['actionConfig', PropTypes.shape().isRequired],
  ['actionCreator', PropTypes.func.isRequired],
  ['objs', PropTypes.oneOfType([PropTypes.array, PropTypes.shape()]).isRequired]
], 'sampleFetchRequestBody');


/**
 * HTTP driver sample response. including the request since that is what the Cycle.js HTTP driver does
 * @params {Object} actionConfig An actionConfig for fetching the model of interest
 * @param {Function} actionCreator When called with objs returns an action body
 * @param {Object} requestBody The requestBody that resulted in the success body
 * @params {Object|Array} objs Functor representing the instances
 * @returns {Object} The sample response body based on the actionConfig and objs
 */
const sampleFetchResponseSuccess = module.exports.sampleFetchResponseSuccess = v(R.curry((actionConfig, actionCreator, requestBody, objs) =>
  R.merge(
    requestBody, {
      status: 200,
      data: objs
    }
  )
),
[
  ['actionConfig', PropTypes.shape().isRequired],
  ['actionCreator', PropTypes.func.isRequired],
  ['requestBody', PropTypes.shape().isRequired],
  ['objs', PropTypes.oneOfType([PropTypes.array, PropTypes.shape()]).isRequired]
], 'sampleFetchResponseSuccess');

/**
 * HTTP driver sample error response.
 * @params {Object} actionConfig An actionConfig for fetching the model of interest
 * @param {Function} actionCreator When called with objs returns an action body
 * @param {Object} requestBody The requestBody that resulted in the success body
 * @params {Object|Array} objs Functor representing the instances
 * @returns {Object} The sample response error based on the actionConfig and objs
 */
const sampleFetchResponseFailure = module.exports.sampleFetchResponseFailure = v(R.curry((actionConfig, actionCreator, requestBody, objs) =>
  R.merge(
    requestBody, {
      status: 500,
      message: 'Internal Server Error'
    }
  )
),
[
  ['actionConfig', PropTypes.shape().isRequired],
  ['actionCreator', PropTypes.func.isRequired],
  ['requestBody', PropTypes.shape().isRequired],
  ['objs', PropTypes.oneOfType([PropTypes.array, PropTypes.shape()]).isRequired]
], 'sampleFetchResponseFailure');

/**
 * HTTP driver sample patch request body
 * @param {Object} config The config object, needed for the api
 * @param {Object} config.settings The config object, needed for the api
 * @param {Object} config.settings.api The config object, needed for the api
 * @params {Object} actionConfig An actionConfig for fetching the model of interest
 * @param {Function} actionCreator When called with objs returns an action body
 * @params {Object|Array} objs Functor representing the instances
 * @returns {Object} The sample request patch body based on the actionConfig and objs
 */
const samplePatchRequestBody = module.exports.samplePatchRequestBody = v(R.curry((config, actionConfig, actionCreator, objs) => {
  const actionTypeLookup = asyncActionsPhaseKeysForActionConfig(actionConfig);
  return {
    // PATCH calls don't have a URL path, since the path is in the standarized
    // JSON query
    url: apiUri(reqPath(['settings', 'api'], config)),
    method: 'PATCH',
    type: actionTypeLookup[REQUEST],
    query: {
      op: R.toLower(actionConfig.verb),
      path: `/${actionConfig.model}`,
      // Call the action creator with objs, omitting the ids and making it an array if we are simulating an ADD
      // Omit the type from the value since type isn't relevant to a query
      value: R.omit(['type'], actionCreator(
        R.map(
          R.omit(actionConfig.verb === ADD ? ['id'] : []),
          actionConfig.verb === ADD ? R.values(objs) : objs
        )
      ))
    },
    // We process all responses in the same place for now,
    // so use a catch-all category name
    category: 'all'
  };
}),
[
  ['config', PropTypes.shape({
    settings: PropTypes.shape({
      api: PropTypes.shape().isRequired
    }).isRequired
  }).isRequired],
  ['actionConfig', PropTypes.shape().isRequired],
  ['actionCreator', PropTypes.func.isRequired],
  ['objs', PropTypes.oneOfType([PropTypes.array, PropTypes.shape()]).isRequired]
], 'samplePatchRequestBody');

/**
 * HTTP driver sample patch response body
 * @params {Object} actionConfig An actionConfig for fetching the model of interest
 * @param {Function} actionCreator When called with objs returns an action body
 * @param {Object} requestBody The requestBody that resulted in the success body
 * @params {Object|Array} objs Functor representing the instances
 * @returns {Object} The sample response patch body based on the actionConfig and objs
 */
const samplePatchResponseSuccess = module.exports.samplePatchResponseSuccess = v(R.curry((actionConfig, actionCreator, requestBody, objs) =>
({
  status: 200,
  request: requestBody,
  data: objs
})
),
[
  ['actionConfig', PropTypes.shape().isRequired],
  ['actionCreator', PropTypes.func.isRequired],
  ['requestBody', PropTypes.shape().isRequired],
  ['objs', PropTypes.oneOfType([PropTypes.array, PropTypes.shape()]).isRequired]
], 'samplePatchResponseSuccess');

/**
 * HTTP driver sample PATCH error response.
 * @params {Object} actionConfig An actionConfig for fetching the model of interest
 * @param {Function} actionCreator When called with objs returns an action body
 * @param {Object} requestBody The requestBody that resulted in the success body
 * @params {Object|Array} objs Functor representing the instances
 * @returns {Object} The sample response error based on the actionConfig and objs
 */
const samplePatchResponseFailure = module.exports.samplePatchResponseFailure = v(R.curry((actionConfig, actionCreator, requestBody, objs) =>
R.merge(
  requestBody, {
    status: 500,
    message: 'Internal Server Error'
  }
)),
[
  ['actionConfig', PropTypes.shape().isRequired],
  ['actionCreator', PropTypes.func.isRequired],
  ['requestBody', PropTypes.shape().isRequired],
  ['objs', PropTypes.oneOfType([PropTypes.array, PropTypes.shape()]).isRequired]
], 'sampleFetchResponseFailure');
