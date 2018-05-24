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

import {makeScopeValues} from 'unittest/unittestHelpers';
import {VERBS, makeActionConfigLookup, makeActionTypesLookup} from '../helpers/actionHelpers';
import R from 'ramda';
import {overrideSources, overrideSourcesWithoutStreaming} from '../helpers/cycleActionHelpers';
import {camelCase} from 'rescape-ramda';
import {makeActionCreators, actionConfig} from '../helpers/actionCreatorHelpers';
import {sampleConfig} from './sampleConfig';
import {cities} from 'unittest/sampleCities';
import {projectLocations} from 'unittest/sampleProjectLocations';
import {getMockResponses} from 'unittest/mockResponses';

const {FETCH, ADD, REMOVE} = VERBS;
// Sample action root, representing a module full of related actions
export const ACTION_ROOT = 'sample';

// The various action keys that define something being modeled
// Models are various manifestations of the locations
const {CITIES, PROJECT_LOCATIONS} = R.mapObjIndexed((v, k) => camelCase(R.toLower(k)), {
  CITIES: '',
  PROJECT_LOCATIONS: ''
});
export const MODELS = {CITIES, PROJECT_LOCATIONS}


const scope = ['user'];
const projectScope = R.concat(scope, ['project']);
const rootedConfig = actionConfig(ACTION_ROOT);
const userConfig = rootedConfig(scope);
const projectConfig = rootedConfig(projectScope);
export const ACTION_CONFIGS = [
  userConfig(CITIES, FETCH),
  userConfig(CITIES, ADD),
  projectConfig(PROJECT_LOCATIONS, ADD),
  projectConfig(PROJECT_LOCATIONS, REMOVE)
];

/**
 * cycle.js sources that process sample async actions
 */
export const sampleCycleDrivers = overrideSources({
  // Supply the default configuration for values such as the API location.
  CONFIG: sampleConfig,
  // ACTION_CONFIG configures the generic cycleRecords to call/match the correct actions
  ACTION_CONFIG: {
    configByType: makeActionConfigLookup(ACTION_CONFIGS)
  }
});


/**
 * Get the actionConfigLookup so we can generate expected results
 * An object keyed by action type and valued by action config
 */
const actionConfigLookup = makeActionConfigLookup(ACTION_CONFIGS);

/**
 * cycle.js sources that process sample async actions without making streams of the constants.
 * This is used when we need to merge the sources with other before turning the configs into streams.
 * Also used for diagram tests, since they create their own stream diagram streams
 */
export const sampleCycleSources = overrideSourcesWithoutStreaming({
  CONFIG: sampleConfig,
  // ACTION_CONFIG configures the generic cycleRecords to call/match the correct actions
  ACTION_CONFIG: {
    configByType: actionConfigLookup
  }
});


export const scopeKeys = ['user', 'project'];
/**
 * A Sample scope for testing actions. The scope is merged into action bodies for
 * validation, security, and to fill in values that may not be passed in an action body
 * (e.g. and add project action might just have a project name--we need to add the user id)
 * @type {{user: string, project: string}}
 */
export const scopeValues = makeScopeValues(scopeKeys);

/**
 * Look up each action config for the action we are testing
 * an object keyed by action name and valued by action type
*/
export const actionTypeLookup = makeActionTypesLookup(ACTION_CONFIGS);
/**
 * Map action names to action configs
 * @returns {Object} keyed by action name and valued by action config
 */
export const actionConfigs = R.map(type => actionConfigLookup[type], actionTypeLookup);

/**
 * The actionCreators that produce the action bodies
 * @returns {Object} keyed by action name and valued by action function
 */
export const actions = makeActionCreators(ACTION_CONFIGS, scopeValues);

/**
 * Sample objects to use with getMockResponses
 * @type {{cities, projectLocations}}
 */
export const sampleObjs = {cities, projectLocations};

/**
 * Create sample request and response bodies
 */
export const mockResponses = getMockResponses(sampleConfig, ACTION_CONFIGS, scopeValues, sampleObjs);
