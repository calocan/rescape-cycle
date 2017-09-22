/**
 * Created by Andy Likuski on 2017.08.19
 * Copyright (c) 2017 Andy Likuski
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 *
 * Sample actions fro testing
 */

const {VERBS, makeActionConfigLookup, makeActionTypesLookup} = require('helpers/actionHelpers');
const R = require('ramda');
const {REPLACE, FETCH, ADD, REMOVE} = VERBS;
const {overrideSources, overrideSourcesWithoutStreaming} = require('helpers/cycleActionHelpers');
const {reqPath} = require('rescape-ramda').throwing;
const {scopeActionCreators, ACTION_BODIES} = require('helpers/actionCreatorHelpers');
const {testConfig} = require('test/testConfig');
const {v} = rquire

// Sample action root, representing a module full of related actions
const ACTION_ROOT = module.exports.ACTION_ROOT = 'sample';

// The various action keys that define something being modeled
// Models are various manifestations of the locations
const MODELS = module.exports.MODELS = R.mapObjIndexed((v, k) => R.toLower(k), {
  CITIES: '',
  DATAPOINTS: '',
  BLOCKNAMES: '',
  DATAPOINT_PROFILES: '',
  PROJECT_PROFILES: '',
  PROJECT_LOCATIONS: ''
});

const scope = ['user'];
const projectScope = R.concat(scope, ['project']);
const ACTION_CONFIGS = module.exports.ACTION_CONFIGS = R.map(R.merge({scope, root: ACTION_ROOT}, [
  {model: MODELS.BLOCKNAMES, verb: FETCH, ret: ACTION_BODIES[FETCH]},
  {model: MODELS.CITIES, verb: FETCH, ret: ACTION_BODIES[FETCH]},
  {model: MODELS.CITIES, verb: ADD, ret: ACTION_BODIES[FETCH]},
  {model: MODELS.DATAPOINTS, verb: FETCH, ret: ACTION_BODIES[FETCH]},
  {model: MODELS.DATAPOINT_PROFILES, verb: FETCH, ret: ACTION_BODIES[FETCH]},
  {scope: projectScope, model: MODELS.PROJECT_PROFILES, verb: FETCH, ret: ACTION_BODIES[FETCH]},
  {scope: projectScope, model: MODELS.PROJECT_LOCATIONS, verb: ADD, ret: ACTION_BODIES[ADD]},
  {scope: projectScope, model: MODELS.PROJECT_LOCATIONS, verb: REMOVE, ret: ACTION_BODIES[REMOVE]}
]));

/**
 * cycle.js sources that process sample async actions
 */
module.exports.sampleCycleSources = overrideSources({
  CONFIG: testConfig,
  // ACTION_CONFIG configures the generic cycleRecords to call/match the correct actions
  ACTION_CONFIG: {
    configByType: makeActionConfigLookup(ACTION_CONFIGS)
  }
});

/**
 * cycle.js sources that process sample async actions without making streams of the constants,
 * since diagram test do this themselves with the diagram streams
 */
const sampleCycleSourcesForDiagramTests = module.exports.sampleCycleSourcesForDiagramTests = overrideSourcesWithoutStreaming({
  // ACTION_CONFIG configures the generic cycleRecords to call/match the correct actions
  ACTION_CONFIG: {
    configByType: makeActionConfigLookup(ACTION_CONFIGS)
  }
});

/**
 * A Sample scope for testing actions. The scope is merged into action bodies for
 * validation, security, and to fill in values that may not be passed in an action body
 * (e.g. and add project action might just have a project name--we need to add the user id)
 * @type {{user: string, project: string}}
 */
const scopeValues = module.exports.scopeValues = {
  user: '123',
  project: '456'
};

/**
 * The actions used for testing. Add more as needed
 * @type {[*]}
 */
const testActions = ['addCitiesRequest', 'fetchCitiesRequest'];
/**
 * Get the actionConfigLookup so we can generate expected results
 * An object keyed by action type and valued by action config
 */
const actionConfigLookup = module.exports.actionConfigLookup = reqPath(['ACTION_CONFIG', 'configByType'], sampleCycleSourcesForDiagramTests);
/**
 * Look up each action config for the action we are testing
 * an object keyed by action key and valued by action type
*/
const actionTypeLookup = module.exports.actionTypeLookup = makeActionTypesLookup(ACTION_CONFIGS);
/**
 * Get the action configs for the actions we are testing
 * @returns {Object} keyed by action key and valued by action config
 */
module.exports.actionConfigs = R.fromPairs(R.map(actionKey => [actionKey, actionConfigLookup[actionTypeLookup[actionKey]]], testActions));

/**
 * The actionCreators that produce the action bodies
 * @returns {Object} keyed by action key and valued by action function
 */
module.exports.actions = v(scopeActionCreators(ACTION_CONFIGS, scopeValues)
, [
  ['actionConfigs', [Array]],
  ['scope', [Object]]
], 'actions');


