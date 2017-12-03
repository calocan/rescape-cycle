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

const {getMockResponses} = require('./mockResponses');
const {asyncActionsGenericKeys} = require('helpers/actionHelpers');
const R = require('ramda');
const {camelCase, capitalize, throwing: {reqPath}} = require('rescape-ramda');

/**
 * Makes consistent fake scope values for the given scope keys
 * Make up scope values, 10, 100, 1000 etc
 * @param {[String]} scopeKeys to create values for
 * @returns {Object} Keyed by scope keys and valued by the fake values
 */
const makeScopeValues = module.exports.makeScopeValues = scopeKeys => R.fromPairs(R.addIndex(R.map)((k, i) => [k, Math.pow(10, i + 1)], scopeKeys));

/**
 * Given an object of actionCreator functions and the scopeKeys expected by those actionCreators,
 * returns scoped actionCreator functions by generating fake values for the scope.
 * This is useful for testing actions and reducers when the actual scope values don't matter,
 * and we just want to trigger the actions and reducer
 * @param {Function} actionCreators A function expecting the scope and returning an object
 * keyed by action name and valued by action functions that expect the actual action
 * @param {Object} scopeValues Object of values that the actions expects, e.g. {user: 123, project: 456}.
 * Different actionCreators might use one or more of the scope values. Just make sure all needed values are in
 * this object
 * @returns {Object} Keyed by action name and valued by an action that expects a Redux action body
 */
const makeTestScopedActions = module.exports.makeTestScopedActions = (actionCreators, scopeValues) => {
  return actionCreators(scopeValues);
};

/**
 * Creates actions and sample responses for those actions. See unittestHelpers.spec.js for an example
 * of how to use this.
 * @param {Object} actionConfigs keyed by action name and valued by action config. See sampleActions.js for an example
 * @param {Object} actionCreators keyed by action name and valued by unscoped action function that expects
 * scope values in order to return normal action functions that return an acton body
 * @param {[String]} scopeKeys A list of strings representing all scope keys needed by the actions
 * @param {Object} state The (initial) redux state. This is needed for URI settings by getMockResponses
 * @param {Object} objs keyed by the models of the actionConfigs and valued by instances of those models
 * @return {{actions: Object, responses: *}} Keyed by action name and valued by a sample response.
 * This includes three actions for each actionConfig, one for requests, success, and errors for asynchronous actions
 */
module.exports.createActionsAndSampleResponses = (actionConfigs, actionCreators, scopeKeys, state, objs) => {
  const scopeValues = makeScopeValues(scopeKeys);
  const actions = makeTestScopedActions(actionCreators, scopeValues);
  const responses = getMockResponses(state, actionConfigs, scopeValues, objs);
  const savedObjs =
    R.fromPairs(R.map(
      actionConfig => [
        actionConfig.model,
        R.values(
          reqPath(
            [`${(camelCase(R.toLower(actionConfig.verb)))}${capitalize(actionConfig.model)}SuccessBody`, 'data'],
            responses
          )
        )],
      actionConfigs)
    );
  const newObjs = R.map(R.map(R.omit(['id'])), savedObjs);
  return {
    actions,
    responses,
    newObjs,
    savedObjs
  };
};


/**
 * Returns the expected sequence of successful actionTypes
 * {String} scope See asyncActionsGenericKeys
 * {String} action See asyncActionsGenericKeys
 * {String} crud See asyncActionsGenericKeys
 * {Object} expectedBody The expected body value in the success action
 */
module.exports.expectedSuccessfulAsyncActions = R.curry((scope, action, crud, expectedBody) => {
  const {REQUEST: request, SUCCESS: success} = asyncActionsGenericKeys(scope, action, crud);
  return [
    {type: request},
    {type: success, body: expectedBody}
  ];
});

/**
 * Returns the expected sequence of failed actionTypes
 * {String} scope See asyncActionsGenericKeys
 * {String} action See asyncActionsGenericKeys
 * {String} crud See asyncActionsGenericKeys
 * {Object} expectedError The expected error value in the failure action
 */
module.exports.expectedFailedAsyncActions = R.curry((scope, action, crud, expectedError) => {
  const {REQUEST: request, FAILURE: failure} = asyncActionsGenericKeys(scope, action, crud);
  return [
    {type: request},
    {type: failure, error: expectedError}
  ];
});
