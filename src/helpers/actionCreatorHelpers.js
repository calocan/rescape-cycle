/**
 * Created by Andy Likuski on 2017.06.19
 * Copyright (c) 2017 Andy Likuski
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import R from 'ramda';
import {actionType, actionName, PHASES, VERBS} from './actionHelpers';
import {v, vMergeScope} from 'rescape-validate';
import PropTypes from 'prop-types';

/**
 * Makes a simple synchronous actionCreator that accepts a single obj and returns an obj
 * @param {String} type The actionType string
 * @param {Object|String|Function} ret The object to return merged with type.
 * If a string is specified this will return {string: obj}.
 * If a function is specified the function will take scope, obj as arguments.
 * (Use R.merge to simply merge scope with obj)
 * To return nothing but the type specify an empty Object
 * @param {Object} scope An object whose keys contain ids that define the scope of the call.
 * These are somehow merged with obj to restrict or enhance obj.
 * For instance if scope is {user: 1, project: 2} and obj is [{name: 'Scenario A'}, {name: 'Scenario B'}]
 * for an addScenario call, the ret function might merge to yield and action body of
 * [{user: 1, project: 2, name: 'Scenario A'}, {user:1, project: 2, name: 'Scenario B'}.
 * Scope is automatically merged with obj if ret is not a function. If ret is a function,
 * scope is the first argument
 * @param {Object|Array} obj The unary argument to the action creator sent by the
 * action sender (e.g. a Component). This must be a functor, whether object or array. This matches
 * up a bit with the graphql syntax of using keys to make fragments or aliases.
 * @returns {Object} ret or {[ret as string]: obj} along with the type
 * creator:: s -> [<k,v] -> <k,v> -> {type: s, ...<k,v>}
 */
export const creator = v(R.curry((type, ret, scope, obj) =>
  // Merge the type with one of the conditionals
  R.merge(
    { type },
    R.cond([
      // If as string return [ret]: obj
      [R.is(String), k => ({[k]: R.merge(scope, obj)})],
      // If a function call it with obj
      [R.is(Function), func => func(scope, obj)],
      // Otherwise assume ret is an object and merge it with scope, ignoring obj
      [R.T, R.merge(scope)]
    ])(ret)
  )
), [
  ['type', PropTypes.string.isRequired],
  ['ret', PropTypes.oneOfType([PropTypes.shape(), PropTypes.string, PropTypes.func]).isRequired],
  ['scope', PropTypes.shape().isRequired],
  ['obj', PropTypes.oneOfType([PropTypes.shape(), PropTypes.array]).isRequired]
], 'creator');

/**
 * Returns standard async action handler functions,
 * one to crud the data, one to handle success, one to handle failure
 * @param {String} actionRoot The root concept being modeled (e.g 'location')
 * @param {String} model The subject of the async operation, such as 'city'
 * @param {String} verb 'FETCH', 'UPDATE', 'REMOVE' or anything else indicating the async action
 * @param {Object} rets Configuration of return values for each action creator in
 * addition to the type key, which is always returned. By default each action
 * creator will simply return the the unary object passed to it, merged with the scope.
 * You can override this behavior with this configuration. See creator() for the options of rets
 * @param {Object|String|Function} rets[PHASES.REQUEST] Default (scope, obj) => R.merge(obj, scope).
 * The configuration for the data actionCreator. See creator() for options
 * @param {Object|String|Function} rets[PHASES.SUCCESS] Default (scope, obj) => R.merge(obj, scope).
 * The configuration for the data actionCreator. See creator() for options
 * @param {Object|String|Function} rets[PHASES.FAILURE] Default (scope, obj) => R.merge(obj, scope).
 * The configuration for the data actionCreator. See creator() for options
 * @param {Object} scope Merged with the object of each actionCreator based on rets. See creator
 * @returns {Object} An object of curried functions that each take scope and obj,
 *  where the function somehow applies to scope to obj, based on the configuration in rets
 *  {
 *  `${upper(verb)}_${upper(model)}_REQUEST`: R.curry((scope, obj) => {
 *    type: `${actionRoot}/${model}/${verb}_${phase}`, // The action value
 *    ...rets[PHASES.REQUEST] // Default obj. Result of rets[PHASES.REQUEST] config
 *   })
 *  `${upper(verb)}_${upper(model)}_REQUEST`: R.curry((scope, obj) => {
 *    type: `${actionRoot}/${model}/${verb}_${phase}`, // The action value
 *    ...rets[PHASES.SUCCESS] // Default obj. Result of rets[PHASES.SUCCESS] config
 *   })
 *  `${upper(verb)}_${upper(model)}_REQUEST`: R.curry((scope, obj) => {
 *    type: `${actionRoot}/${model}/${verb}_${phase}`, // The action value
 *    ...rets[PHASES.FAILURE] // Default obj. Result of rets[PHASES.FAILURE] config
*    })
 */
export const asyncActionCreators = v(R.curry((actionRoot, model, verb, rets) => {
  // Creates action type (e.g. 'location/cities/fetch_data')
  const typeMaker = actionType(actionRoot, model, verb);
  // Creates action key (e.g. 'FETCH_CITIES_REQUEST')
  const nameMaker = actionName(model, verb);
  const {REQUEST, SUCCESS, FAILURE} = PHASES;
  return {
    // Create each action creator of the async process.
    // The return value of the creator is the type: REQUEST|SUCCESS|FAILURE
    // as well as the configuration specified in rets. If rets is not configured
    // the merge function is used to tell creator to merge scope with the passed in obj
    // along with the action name
    [nameMaker(REQUEST)]: R.curry((scope, obj) => creator(typeMaker(REQUEST), rets[REQUEST] || R.merge, scope, obj)),
    [nameMaker(SUCCESS)]: R.curry((scope, obj) => creator(typeMaker(SUCCESS), rets[SUCCESS] || R.merge, scope, obj)),
    [nameMaker(FAILURE)]: R.curry((scope, obj) => creator(typeMaker(FAILURE), rets[FAILURE] || R.merge, scope, obj))
  };
}), [
  ['actionRoot', PropTypes.string.isRequired],
  ['model', PropTypes.string.isRequired],
  ['verb', PropTypes.string.isRequired],
  ['rets', PropTypes.shape().isRequired]
], 'asyncActionCreators');

/**
 * Creates actions for a given scope based on the configuration.
 * Each configured item in actionConfigs results in three actionCreators, one for initiating an async call,
 * one for success, and one for failure This could in the future be changed to accommodate open streams, retries, etc
 * @param {Object} actionConfig Configuration of available actions
 * @param {Object} actionConfig.scope A list of keys to be matched with the passed in scope. For instance,
 * if this is ['user', 'project'] and the passed in scope is {user, project, location}, then {user, project} will be
 * added passed to the configured actionCreators in addition to whatever is eventually sent to the action from a
 * Component
 * @param {String} actionConfig.root A string representing the root path of the action, e.g. 'locations'.
 * This is combined with the model string to make the action type, e.g. model 'cities' becomes for a fetch success
 * action yields the action type 'locations/cities/fetch_success'. The root could itself include slashes
 * to create a longer path
 * @param {String} actionConfig.model The model name for the concept that the action is handling. There can be multiple uses of the
 * same model, for instance for add and remove actionCreators
 * @param {String} actionConfig.verb Represents the type of action, such as 'fetch' or 'update' is handling. There can be multiple
 * uses of the same model, for instance for add and remove actionCreators
 * @param {Object} scope The actual scope values keyed by strings actionConfig.scope matches.
 * Values should always be ids, not objects. For example {user: '123', project: '456'}
 * @param {Object|Array} object The actual object sent by the caller to the actionCreator function. This will
 * always be passed by a Component or similar to the actionCreator. For standardization object is
 * always required to be a functor because we will call map on it and merge scope. This allows every
 * item of an array to merge in the scope (e.g. for an add) or every value of an object keyed by ids
 * (e.g. for a replace of the names of two users: {123: {name: 'Billy'}, 456: {name: 'Sally'}} the scope
 * merge results in {123: {name: 'Billy', ...scope}, 456: {name: 'Sally', ...scope}} )
 * @example
 *  // MODELS.CITIES is simply 'cities' and so on
 *  // FETCH is simply 'fetch' and so on
 *  // For ret configuration see asyncActionCreators
const ACTION_CONFIGS = [
 {scope, root: ACTION_ROOT, model: MODELS.CITIES, verb: FETCH, ret: ACTION_BODIES},
 {scope: projectScope, root: ACTION_ROOT, model: MODELS.PROJECT_LOCATIONS, verb: ADD, ret: ACTION_BODIES},
 {scope: projectScope, root: ACTION_ROOT, model: MODELS.PROJECT_LOCATIONS, verb: REMOVE, ret: ACTION_BODIES}
];
 * @param {Object} scope The scope object that matches the scope keys defined in the actionConfig
 * @returns {Object} All of the action key/functions merged together
 * @example
 * {
 * ...
 * fetchCitiesRequest: actionCreator(obj) => ({...obj, ...scope}) // Return value depends on 'ret' config
 * fetchCitiesSuccess: actionCreator(...
 * fetchCitiesFailure: actionCreator(...
 * ...
 * }
 */
export const makeActionCreators = v(R.curry((actionConfigs, scope) =>
  R.mergeAll(
    R.map(
      actionConfig => makeActionCreatorsForConfig(actionConfig, scope),
      actionConfigs
    )
  )
), [
  ['actionConfigs', PropTypes.array.isRequired],
  ['scope', PropTypes.shape().isRequired]
], 'makeActionCreators');

// Like makeActionCreators but for a single actionConfig
export const makeActionCreatorsForConfig = v(R.curry((actionConfig, scope) =>
  R.map(
    // Enhance the actionCreator with the configured scope parameters
    // Pick the configured scope properties from the passed in the scope
    // This returns a function expecting an obj from the action caller
    actionCreator => actionCreator(R.pick(actionConfig.scope, scope)),
    asyncActionCreators(actionConfig.root, actionConfig.model, actionConfig.verb, actionConfig.ret)
  )
), [
  ['actionConfig', PropTypes.shape().isRequired],
  ['scope', PropTypes.shape().isRequired]
], 'makeActionCreatorsForConfig');

/**
 * Returns the name of the actionCreator for the given actionConfig and phase
 * This is used when an actionCreator needs to be called in response to a previous actionCreator call,
 * namely calling a SUCCESS or FAILURE phase actionCreator REQUEST
 * @param {Object} actionConfig The action config
 * @param {String} phase The phase, such as PHASES.REQUEST
 * @returns {String} The action name
 */
export const actionCreatorNameForPhase = v((actionConfig, phase) =>
  actionName(actionConfig.model, actionConfig.verb, phase)
, [
  ['actionConfig', PropTypes.shape({
    model: PropTypes.string.isRequired,
    verb: PropTypes.string.isRequired
  }).isRequired],
  ['phase', PropTypes.string.isRequired]
], 'actionCreatorNameForPhase');

/**
 * All action PHASES have the same success and failure action bodies by default.
 * These can be overriden for particular actions
 * @param {String} verb The verb of the action, such as VERBS.FETCH or VERBS.REPLACE.
 * This is merged into REQUEST phase action body to identify the action verb in the cycleRecords code
 * @type {{}}
 */
const DEFAULT_ACTION_BODIES = {
  /**
   * Request Actions can use this function by default, which maps any passed objects to ids,
   * if they aren't already ids, after validating that each object matches the scope
   * @param {Object} scope The scope object to merge into each functor
   * @param {Object|Array} functor Must be an object or array that can be mapped and have scope
   * applied to each value
   * @returns {Object} The mapped functor with each value merged with scope
   */
  [PHASES.REQUEST]: v(R.curry((scope, functor) =>
      // Map the object to an id if it has an id, otherwise assume it's an id and leave it alone.
      R.map(R.ifElse(
        R.prop('id'),
        // If it is an object validate that the val's scope matches scope and then merge scope
        vMergeScope(R.__, scope),
        // Otherwise just merge
        R.merge(R.__, scope)),
        functor)
    ),
    [
      ['scope', PropTypes.shape().isRequired],
      ['functor', PropTypes.oneOfType([PropTypes.array, PropTypes.shape()]).isRequired]
    ], 'DEFAULT_ACTION_BODIES.REQUEST'),

  /**
   * Success Actions ignore the scope since presumably each object in the response will be scoped
   * to that used for the REQUEST action
   * @param {Object} scope The same scope object as the original Request action. TODO
   * We could check this against each object returned in the response to insure a matching scope
   * @param {Object} response A response object that presumably has a body property with results
   * or something similar, depending on the driver supplying the data
   * @returns {Object} The response.
   */
  [PHASES.SUCCESS]: v(R.curry((scope, response) =>
      response
    ),
    [
      ['scope', PropTypes.shape().isRequired],
      ['response', PropTypes.shape().isRequired]
    ], 'DEFAULT_ACTION_BODIES.SUCCESS'),

  /**
   * Failure also ignores scope since the original request body will contain the scoped objects
   * that were requested
   * @param {Object} scope The same scope object as the original Request action
   * @param {Object} response A response object containing an error
   * @returns {Object} The response.
   */
  [PHASES.FAILURE]: v(R.curry((scope, response) =>
      response
    ),
    [
      ['scope', PropTypes.shape().isRequired],
      ['response', PropTypes.shape().isRequired]
    ], 'DEFAULT_ACTION_BODIES.FAILURE')
};

// By default have all actionCreators return action bodies made by these functions
export const ACTION_BODIES = R.map(R.always(DEFAULT_ACTION_BODIES), VERBS);

/**
 * Creates a action config object
 * @param {String} root. The parent concept of the model, such as 'location' for model 'CITY'
 * @param {Array} scope. Array of keys representing keys of the scope object that
 * @param {String} model. The concept being modeled
 * @param {String} verb. One of VERBS.FETCH, VERBS.ADD, VERBS.REMOVE, etc.
 * will be merged into each object passed to the action. These are just the keys.
 * The current scope object will be passed to the actionCreator before the action
 * is called
 */
export const actionConfig = v((root, scope, model, verb) =>
    ({root, model, verb, scope, ret: ACTION_BODIES[verb]})
  , [
    ['root', PropTypes.string.isRequired],
    ['scope', PropTypes.arrayOf(PropTypes.string).isRequired],
    ['model', PropTypes.string.isRequired],
    ['verb', PropTypes.string.isRequired]
  ], 'actionConfig');
