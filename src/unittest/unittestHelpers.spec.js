/**
 * Created by Andy Likuski on 2017.09.26
 * Copyright (c) 2017 Andy Likuski
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

const {makeActionCreators} = require('helpers/actionCreatorHelpers');
const {createActionsAndSampleResponses, makeMockStore, makeTestScopedActions, makeScopeValues, testBodies} = require('unittest/unittestHelpers');
const {ACTION_CONFIGS, MODELS, scopeValues, scopeKeys, sampleObjs, actionConfigs} = require('./sampleActions');
const {cities} = require('./sampleCities');
const R = require('ramda');
const {projectLocations} = require('./sampleProjectLocations');
const {sampleConfig} = require('./sampleConfig');

describe('testHelpers', () => {
  test('testBodies', () => {
    const bodies = testBodies(
      sampleConfig,
      ACTION_CONFIGS,
      scopeValues,
      {[MODELS.CITIES]: cities, [MODELS.PROJECT_LOCATIONS]: projectLocations}
    );
    expect(R.keys(bodies)).toEqual([
      'fetchCitiesRequestBody',
      'fetchCitiesSuccessBody',
      'fetchCitiesFailureBody',
      'addCitiesRequestBody',
      'addCitiesSuccessBody',
      'addCitiesFailureBody',
      'addProjectLocationsRequestBody',
      'addProjectLocationsSuccessBody',
      'addProjectLocationsFailureBody',
      'removeProjectLocationsRequestBody',
      'removeProjectLocationsSuccessBody',
      'removeProjectLocationsFailureBody'
    ]);
    // Just make sure the body looks reasonable
    expect(R.keys(R.pick(['url', 'type', 'filters', 'category'], bodies.fetchCitiesRequestBody.request))).toEqual(
      ['url', 'type', 'filters', 'category']
    );
    expect(R.keys(R.pick(['op', 'path', 'value'], bodies.addCitiesRequestBody.query))).toEqual(
      ['op', 'path', 'value']
    );
  });

  test('makeScopeValues', () => {
    expect(R.values(makeScopeValues(['a', 'b']))).toEqual([10, 100]);
  });

  test('makeTestScopedActions', () => {
    const actionCreators = makeActionCreators(ACTION_CONFIGS);
    expect(R.keys(makeTestScopedActions(actionCreators, scopeValues))).
    toEqual(R.keys(actionCreators(scopeValues)))
  });

  test('makeMockStore', () => {
    expect(makeMockStore(sampleConfig).getState()).toEqual(sampleConfig);
  });

  test('createActionsAndSampleResponses', () => {
    const actionCreators = makeActionCreators(ACTION_CONFIGS);
    const {actions, responses} = createActionsAndSampleResponses(ACTION_CONFIGS, actionCreators, scopeKeys, sampleConfig, sampleObjs)
    expect(R.keys(actions)).toEqual(R.keys(actionConfigs));
    expect(R.keys(responses)).toEqual(R.map(action => `${action}Body`, R.keys(actionConfigs)));
  });
});
