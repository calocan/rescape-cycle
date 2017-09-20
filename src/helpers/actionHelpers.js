/**
 * Created by Andy Likuski on 2017.06.19
 * Copyright (c) 2017 Andy Likuski
 *
 * Permission is hereby granted, free of charge, to any location obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit locations to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

const R = require('ramda');
const {mapKeys, capitalize, camelCase} = require('rescape-ramda');
const {v} = require('rescape-validate');

module.exports.DRIVERS = {
  HTTP: 'HTTP'
};

/**
 * Verbs used to name actions. These are only used to create action names
 * Cycle.js uses them to figure out what driver function to call, for instance
 * for HTTP calls it sends GET or PATCH depending on the verb
 * These can be used by HTTP, POUCHDB, etc.
 * PATCH actions are based on the JSON PATCH standard https://tools.ietf.org/html/rfc6902
 * Examples from json-patch, which is used for testing and could be used for JSON based storage
 * https://github.com/bruth/jsonpatch-js
 */
const VERBS = module.exports.VERBS = {
  // Read values
  FETCH: 'FETCH',
  // Adds an array of values to a collection or key/values to an object
  /*
   // Add property, result: {foo: 'bar'}
   jsonpatch.apply({}, [{op: 'add', path: '/foo', value: 'bar'}]);

   // Add array element, result: {foo: [1, 2, 3]}
   jsonpatch.apply({foo: [1, 3]}, [{op: 'add', path: '/foo/1', value: 2}]);

   // Complex, result: {foo: [{bar: 'baz'}]}
   jsonpatch.apply({foo: [{}]}, [{op: 'add', path: '/foo/0/bar', value: 'baz'}]);
   */
  ADD: 'ADD',
  // Remove a value from a collection
  /*
   // Remove property, result: {}
   jsonpatch.apply({foo: 'bar'}, [{op: 'remove', path: '/foo'}]);

   // Remove array element, result: {foo: [1, 3]}
   jsonpatch.apply({foo: [1, 2, 3]}, [{op: 'remove', path: '/foo/1'}]);

   // Complex, result: {foo: [{}]}
   jsonpatch.apply({foo: [{bar: 'baz'}]}, [{op: 'remove', path: '/foo/0/bar'}]);
  */
  REMOVE: 'REMOVE',
  // Update a value of an existing
  /*
   // Replace property, result: {foo: 1}
   jsonpatch.apply({foo: 'bar'}, [{op: 'replace', path: '/foo', value: 1}]);

   // Replace array element, result: {foo: [1, 4, 3]}
   jsonpatch.apply({foo: [1, 2, 3]}, [{op: 'replace', path: '/foo/1', value: 4}]);

   // Complex, result: {foo: [{bar: 1}]}
   jsonpatch.apply({foo: [{bar: 'baz'}]}, [{op: 'replace', path: '/foo/0/bar', value: 1}]);
  */
  REPLACE: 'REPLACE',
  // SELECT is a shortcut to add an item to a list/object that represents a current selection
  // TODO we might be able to get rid of this and just use ADD, but SELECT is semantically
  // different than add, even if we always force the selection to be multiple values
  SELECT: 'SELECT',
  // Removes values from a selection list/object
  DESELECT: 'DESELECT',
  // Move a value from one location to another
  /*
   // Move property, result {bar: [1, 2, 3]}
   jsonpatch.apply({foo: [1, 2, 3]}, [{op: 'move', from: '/foo', path: '/bar'}]);
   */
  MOVE: 'MOVE',
  // Copy a value from one location to another
  /*
   // Copy property, result {foo: [1, 2, 3], bar: 2}
   jsonpatch.apply({foo: [1, 2, 3]}, [{op: 'copy', from: '/foo/1', path: '/bar'}]);
   */
  COPY: 'COPY',
  // Test that a value equals the stored value
  /*
   // Test equality of property to value, result: true
   jsonpatch.apply({foo: 'bar'}, [{op: 'test', path: '/foo', value: 'bar'}]
   */
  TEST: 'TEST'
};

// JSON PATCH verbs
module.exports.PATCH_VERBS = R.pick(['ADD', 'REMOVE', 'REPLACE', 'SELECT', 'DESELECT', 'MOVE', 'COPY'], VERBS);

/**
 * HTTP methods that are used.
 * @type {{GET: string, PATCH: string}}
 */
const HTTP = {
  GET: 'GET',
  PATCH: 'PATCH'
};

/**
 * HTTP implementation of VERBS
 * @type {{FETCH}}
 */
module.exports.HTTP = {
  [VERBS.FETCH]: { method: HTTP.GET },
  [VERBS.ADD]: { method: HTTP.PATCH },
  [VERBS.REMOVE]: { method: HTTP.PATCH },
  [VERBS.REPLACE]: { method: HTTP.PATCH },
  [VERBS.SELECT]: { method: HTTP.PATCH },
  [VERBS.DESELECT]: { method: HTTP.PATCH },
  [VERBS.MOVE]: { method: HTTP.PATCH },
  [VERBS.COPY]: { method: HTTP.PATCH },
  [VERBS.TEST]: { method: HTTP.PATCH }
};

/**
 * PHASES are used to construct action keys and values
 */
const PHASES = module.exports.PHASES = {
  REQUEST: 'REQUEST',
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE'
};

/**
 * Creates the action name that is used to call the actionCreator
 * @param {String} model The subject of the async operation, such as 'cities'
 * @param {String} verb Can be 'FETCH',  'UPDATE', 'REMOVE' or anything else
 * @param {String} phase One of 'REQUEST', 'SUCCESS', 'FAILURE'
 * @returns {String} the action value string:
 * `${toLower(camelCase(verb))}${capitalize(camelCase(MODEL))}${capitalize(camelCase(toLower(PHASE))}
 */
const actionKey = module.exports.actionKey = v(R.curry((model, verb, phase) =>
    `${R.toLower(camelCase(verb))}${capitalize(camelCase(model))}${capitalize(camelCase(R.toLower(phase)))}`),
[
  ['model', [String]],
  ['verb', [String]],
  ['phase', [String]]
], 'actionKey');

/**
 * Creates the unique type string of an action
 * @param {String} actionRoot The root concept being modeled (e.g 'location')
 * @param {String} model The subject of the async operation, such as 'cities'
 * @param {String} verb Can be 'FETCH',  'UPDATE', 'REMOVE' or anything else
 * @param {String} phase One of 'REQUEST', 'SUCCESS', 'FAILURE'
 * @returns {String} the action value string: `${actionRoot}/${camelize(model)}/${verb}_${phase}`
 */
const actionType = module.exports.actionType = v(R.curry((actionRoot, model, verb, phase) =>`${actionRoot}/${model}/${verb}_${phase}`),
[
  ['actionRoot', [String]],
  ['model', [String]],
  ['verb', [String]],
  ['phase', [String]]
], 'actionType');

/**
 * Async operations have three standard actionTypes for each verb type. Curryable.
 * Use this when you need generic action keys. Probably just for testing
 * @param {String} actionRoot The root concept being modeled (e.g 'location')
 * @param {String} model The subject of the async operation, such as 'cities'
 * @param {String} verb Can be 'FETCH', 'UPDATE', 'REMOVE' or anything else
 * @returns {Object} where keys are (REQUEST|SUCCESS|FAILURE) and value is scope/ACTION/verb_(REQUEST|SUCCESS|FAILURE)
 * e.g. {
 * [PHASES.REQUEST]: location/cities/FETCH_REQUEST,
 * [PHASES.SUCCESS]: location/cities/FETCH_SUCCESS,
 * [PHASES.ERROR]: location/cities/FETCH_ERROR
 * }
 */
const asyncActionsPhaseKeys = module.exports.asyncActionsGenericKeys = v(R.curry((actionRoot, model, verb) => {
    const actionValueMaker = actionType(actionRoot, model, verb);
    return R.compose(
        R.fromPairs,
        R.map(phase => R.pair(R.toUpper(phase), actionValueMaker(phase)))
    )(R.values(PHASES));
}), [
  ['actionRoot', [String]],
  ['model', [String]],
  ['verb', [String]]
], 'asyncActionsGenericKeys');

/**
 * Async operations have three standard actionTypes for each verb type. Curryable.
 * @param {String} actionRoot The root concept being modeled (e.g 'location')
 * @param {String} model The subject of the async operation, such 'cities'
 * @param {String} verb Any Crud type label such as 'FETCH', 'UPDATE', 'REMOVE' or anything else
 * @returns {Object} where keys are the match of the name of the actionCreator verbModel(Data|Success|Failure) and value is scope/ACTION/verb_(REQUEST|SUCCESS|FAILURE)
 * e.g. {fetchCitiesData: location/cities/FETCH_REQUEST, fetchUserSuccess: location/cities/FETCH_SUCCESS, fetchUserError: location/cities/FETCH_ERROR}
 */
const asyncActions = module.exports.asyncActions = v(R.curry((actionRoot, model, verb) => {
    const keyMaker = actionKey(model, verb);
    return mapKeys(phase => keyMaker(phase), asyncActionsPhaseKeys(actionRoot, model, verb));
}), [
  ['actionRoot', [String]],
  ['model', [String]],
  ['verb', [String]]
], 'asyncActions');


/**
 * Creates actions for a given scope based on the configuration
 * @param {Object} actionConfigs Configuration of available actions
 * @example
 * // MODELS.BLOCKNAMES is simply 'blocknames' and so on
 * // FETCH is simply 'fetch' and so on
 * // For ret configuration see asynActionCreators
 *
 * const ACTION_CONFIGS = [
 * {model: MODELS.BLOCKNAMES, verb: FETCH, ret: {...}},
 * {model: MODELS.CITIES, verb: FETCH, ret: {...}},
 * {model: MODELS.REQUESTPOINTS, verb: FETCH, ret: {...}},
 * {model: MODELS.REQUESTPOINT_PROFILES, verb: FETCH, ret: {...}},
 * {model: MODELS.PROJECT_PROFILES, verb: FETCH, ret: {...}},
 * {model: MODELS.PROJECT_LOCATIONS, verb: ADD, ret: {...}},
 * {model: MODELS.PROJECT_LOCATIONS, verb: REMOVE, ret: {...}}
 ];
 * @returns {Object} All of the action key/type merged together
 * @example
 * {
 * ...
 * FETCH_CITIES_REQUEST: location/cities/FETCH_REQUEST,
 * FETCH_CITIES_SUCCESS: location/cities/FETCH_SUCCESS,
 * FETCH_CITIES_ERROR: location/cities/FETCH_ERROR
 * ...
 * }
 */
module.exports.makeActionTypesLookup = v(actionConfigs =>
  R.mergeAll(
    R.map(
      actionConfig => asyncActions(actionConfig.root, actionConfig.model, actionConfig.verb),
      actionConfigs)
  ),
[
  ['actionConfigs', [Object]]
], 'makeActionTypesLookup');

/**
 * Like makeActionTypesLookup but returns the action configs keyed by the action's type.
 * Also adds the phase into the resulting config as phase: 'REQUEST|SUCCESS|FAILURE'
 * This makes it easy for cycle.js to look up config information about actions that stream in.
 * @param {Object} actionConfigs Configuration of available actions
 * @example
 * // MODELS.BLOCKNAMES is simply 'blocknames' and so on
 * // FETCH is simply 'fetch' and so on
 * // For ret configuration see asynActionCreators
 *
 * const ACTION_CONFIGS = [
 * {model: MODELS.BLOCKNAMES, verb: FETCH, ret: {...}},
 * {model: MODELS.CITIES, verb: FETCH, ret: {...}},
 * {model: MODELS.REQUESTPOINTS, verb: FETCH, ret: {...}},
 * {model: MODELS.REQUESTPOINT_PROFILES, verb: FETCH, ret: {...}},
 * {model: MODELS.PROJECT_PROFILES, verb: FETCH, ret: {...}},
 * {model: MODELS.PROJECT_LOCATIONS, verb: ADD, ret: {...}},
 * {model: MODELS.PROJECT_LOCATIONS, verb: REMOVE, ret: {...}}
 ];
 * @returns {Object} Copy of ACTION_CONFIGS with actions added
 * @example
 * {
 * location/cities/FETCH_REQUEST: {model: MODELS.BLOCKNAMES, verb: FETCH, ret: {...}
 * location/cities/FETCH_SUCCESS: {model: MODELS.BLOCKNAMES, verb: FETCH, ret: {...}
 * location/cities/FETCH_FAILURE: {model: MODELS.BLOCKNAMES, verb: FETCH, ret: {...}
 * ...
 * ]
 */
module.exports.makeActionConfigLookup = v(actionConfigs =>
    R.mergeAll(
      R.map(
        actionConfig =>
          R.fromPairs(R.map(
            // map pairs to <actionType, actionConfig with phase added>
            ([phase, type]) => [type, R.merge(actionConfig, {phase})],
            // actionConfig to <phase, actionType> to [phase, actionType]
            R.toPairs(asyncActionsPhaseKeys(actionConfig.root, actionConfig.model, actionConfig.verb))
          )),
        actionConfigs)
    ),
  [
    ['actionConfigs', [Object]]
  ], 'makeActionConfigLookup');
