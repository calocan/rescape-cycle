/**
 * Created by Andy Likuski on 2017.07.31
 * Copyright (c) 2017 Andy Likuski
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
const R = require('ramda');
const {mapDefault} = require('rescape-ramda');
const {xs, Stream} = mapDefault('xs', require('xstream'));
const {
  VERBS: {FETCH, ADD, REMOVE, REPLACE, SELECT, DESELECT, MOVE, COPY},
  PHASES: {REQUEST, SUCCESS, FAILURE},
  PATCH_VERBS
} = require('./helpers/actionHelpers');
const {v} = require('rescape-validate');
const PropTypes = require('prop-types');
const prettyFormat = require('pretty-format');

/**
 * Convert incoming intents to cycle actions
 */

/**
 * Internal function to filter the action based on the predicates given
 * @param {Object} ACTION_CONFIG Stream of the configuration of all actions
 * @param {Object} ACTION Steam of React Actions
 * @param {[Function]} predicates Predicate functions of single arity expecting the
 * specific action config of the action. Example R.propEq('verb', VERBS.UPDATE)
 * to only accept an actionConfig with the verb VERBS.UPDATE
 */
const actionFilter = v(({ACTION_CONFIG, ACTION}, predicates) =>
    xs.combine(ACTION, ACTION_CONFIG)

    // The specific Action config for this type
      .map(([action, actionConfigs]) => ({
        action,
        actionConfig: actionConfigs.configByType[action.type]
      }))
      .filter(
        // Respond to only this configuration
        ({action, actionConfig}) => R.allPass(predicates)(actionConfig)
      )
      // .debug(({action, actionConfigs}) => {
      //  console.log(`action: ${prettyFormat(action)}`);
      // })
  , [
    ['arg1', PropTypes.shape({
      ACTION_CONFIG: PropTypes.instanceOf(Stream).isRequired,
      ACTION: PropTypes.instanceOf(Stream).isRequired
    }).isRequired],
    ['predicates', PropTypes.arrayOf(PropTypes.func).isRequired]
  ], 'actionFilter');

/**
 * Filter for fetch actions to create a stream of fetch actions.
 * @param {Object} ACTION_CONFIG Driver source to configure ACTION source handling
 * @param {Object} ACTION React Action Driver source
 * @returns {Stream} Intent of record fetch, which is a mapping to a fetchAction stream,
 * which configures the fetch for the intended params
 */
module.exports.fetchRecordActionIntent = v(({ACTION_CONFIG, ACTION}) => {
    return actionFilter({ACTION_CONFIG, ACTION}, [
      R.propEq('verb', FETCH),
      R.propEq('phase', REQUEST),
      R.identity
    ])
    // Map to the action's params
      .map(({action, actionConfig}) => ({
        // Assume the model is the desired request path
        path: `/${actionConfig.model}`,
        // The verb here is always VERBS.FETCH
        verb: actionConfig.verb,
        // The React action type to identify the request when the response comes back
        type: action.type,
        // Pass all action keys except for type
        filters: R.omit(['type'], action)
      }));
     // .debug(act => { console.log(`Fetch records for action ${prettyFormat(act)}`) })
  },
[
  ['arg1', PropTypes.shape({
    ACTION_CONFIG: PropTypes.instanceOf(Stream).isRequired,
    ACTION: PropTypes.instanceOf(Stream).isRequired
  }).isRequired]
], 'fetchRecordActionIntent');

/**
 * Filter for update actions to create a stream of update actions.
 * @param {Object} ACTION_CONFIG driver source config for processing the ACTION driver source
 * @param {Object} ACTION React Action driver source
 * @returns {Stream} Intent of record update, which is a mapping to an updateAction stream,
 * which configures the update for the intended params
 */
module.exports.updateRecordActionIntent = v(({ACTION_CONFIG, ACTION}) =>
    actionFilter({ACTION_CONFIG, ACTION}, [
      R.propSatisfies(verb => R.contains(verb, R.keys(PATCH_VERBS)), 'verb'),
      R.propEq('phase', REQUEST)
    ])
    // Map to the action's params
      .map(({action, actionConfig}) => ({
        // Assume the model is the desired request path
        path: `/${actionConfig.model}`,
        // The type of patch, e.g. VERBS.REPLACE
        verb: actionConfig.verb,
        // The React action type to identify the request when the response comes back
        type: action.type,
        // Pass all action keys except for type
        value: R.omit(['type'], action)
      }))
      // .debug(act => console.log(`Update records intent ${prettyFormat(act)}`))
, [
  ['arg1', PropTypes.shape({
    ACTION_CONFIG: PropTypes.instanceOf(Stream).isRequired,
    ACTION: PropTypes.instanceOf(Stream).isRequired
  }).isRequired]
], 'updateRecordActionIntent');

/**
 * Selection intent means the intention to select something which has already been fetched
 * It should result in immediate success or failure and sink an update instruction to update
 * an external state to the selection. For instance, if the user updates a preference
 * the local state can be immediately updated and then an update can go to the external state
 * TODO, this should be generalized for anything that has an immediate local store persistence,
 * unlike updateRecordActionIntent, which must go to server before anything changes in the store
 * @param ACTION_CONFIG
 * @param ACTION
 */
module.exports.selectRecordActionIntent = v(({ACTION_CONFIG, ACTION}) =>
  actionFilter({ACTION_CONFIG, ACTION}, [
    R.propEq('verb', SELECT),
    R.propEq('phase', REQUEST)
  ])
    // Map to the action's params
    .map(({action, actionConfig}) => ({
      // Assume the model is the desired request path
      path: `/${actionConfig.model}`,
      // The type of patch, e.g. VERBS.REPLACE
      verb: actionConfig.verb,
      // Pass all action keys except for type, which we already used
      filters: R.omit(['type'], action)
    }))
    // .debug(intent => console.log(`Fetch records intent ${intent}`))
, [
  ['arg1', PropTypes.shape({
    ACTION_CONFIG: PropTypes.instanceOf(Stream).isRequired,
    ACTION: PropTypes.instanceOf(Stream).isRequired
  }).isRequired]
], 'selectRecordActionIntent');

