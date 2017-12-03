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

const {expectedFailedAsyncActions, expectedSuccessfulAsyncActions} = require('unittest/unittestHelpers');
const {makeActionCreators} = require('helpers/actionCreatorHelpers');
const {createActionsAndSampleResponses, makeTestScopedActions, makeScopeValues} = require('unittest/unittestHelpers');
const {ACTION_CONFIGS, scopeValues, scopeKeys, sampleObjs, actionConfigs} = require('./sampleActions');
const R = require('ramda');
const {sampleConfig} = require('./sampleConfig');

describe('testHelpers', () => {

  test('makeScopeValues', () => {
    expect(R.values(makeScopeValues(['a', 'b']))).toEqual([10, 100]);
  });

  test('makeTestScopedActions', () => {
    const actionCreators = makeActionCreators(ACTION_CONFIGS);
    expect(R.keys(makeTestScopedActions(actionCreators, scopeValues))).toEqual(R.keys(actionCreators(scopeValues)));
  });


  test('createActionsAndSampleResponses', () => {
    const actionCreators = makeActionCreators(ACTION_CONFIGS);
    const {actions, responses, newObjs, savedObjs} = createActionsAndSampleResponses(
      ACTION_CONFIGS, actionCreators, scopeKeys, sampleConfig, sampleObjs
    );
    expect(R.keys(actions)).toEqual(R.keys(actionConfigs));
    expect(R.keys(responses)).toEqual(R.map(action => `${action}Body`, R.keys(actionConfigs)));
    const models = R.uniq(R.map(config => config.model, ACTION_CONFIGS));
    expect(R.keys(savedObjs)).toEqual(models);
    expect(R.keys(newObjs)).toEqual(models);
  });

  test('expectedSuccessfulAsyncActions', () => {
    expect(expectedSuccessfulAsyncActions('person', 'user', 'FETCH', 'Some response')).toMatchSnapshot();
  });

  test('expectedFailedAsyncActions', () => {
    expect(expectedFailedAsyncActions('person', 'user', 'FETCH', 'Some error')).toMatchSnapshot();
  });
});
