/**
 * Created by Andy Likuski on 2017.07.31
 * Copyright (c) 2017 Andy Likuski
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRA/ACNTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
import R from 'ramda';
import {assertSourcesSinks} from './helpers/jestCycleHelpers';
import {sampleCycleSources, actions, actionConfigs, actionTypeLookup} from 'unittest/sampleActions';
import {cities} from 'unittest/sampleCities';
import {reqPathThrowing} from 'rescape-ramda';
import {fetchRecordActionIntent, updateRecordActionIntent} from './cycleRecordsActionIntents';

describe('cycleRecordsIntents', () => {
  test('fetchRecordActionIntent', (done) => {
    // This is the expected Cycle act (short for action, so as not to confuse with React actions)
    // in response to the fetchCitiesRequest React action
    const fetchCitiesAct = {
      // Assume the model is the desired request path
      path: `/${actionConfigs.fetchCitiesRequest.model}`,
      // The verb here is always VERBS.FETCH
      verb: actionConfigs.fetchCitiesRequest.verb,
      // The React action type to identify the request when the response comes back
      type: actionTypeLookup.fetchCitiesRequest,
      // Pass all action keys except for type
      filters: R.omit(['type'], actions.fetchCitiesRequest(cities))
    };

    const testSources = {
      ACTION: {
        // User intends to fetch cities
        a: actions.fetchCitiesRequest(cities)
      },

      ACTION_CONFIG: {
        // Get the ACTION_CONFIG stream
        a: reqPathThrowing(['ACTION_CONFIG'], sampleCycleSources)
      }
    };
    const sinks = {
      // In response to fetchRecordActionIntent,
      // we expect the fetchCitiesRequest HTTP request body
      HTTP: {
        s: fetchCitiesAct
      }
    };
    // Wrap the method to make it match a cycle call so we can use assertSourceSinks
    const fakeCycle = sources => ({HTTP: fetchRecordActionIntent(sources)});
    // Override the source drivers with our fake sources
    assertSourcesSinks({
      ACTION: {'a|': testSources.ACTION},
      ACTION_CONFIG: {'a|': testSources.ACTION_CONFIG}
    }, {
      HTTP: {'s|': sinks.HTTP}
    }, fakeCycle, done, {interval: 200});
  });

  test('updateRecordActionIntent', (done) => {
    // This is the expected Cycle act (short for action, so as not to confuse with React actions)
    // in response to the fetchCitiesRequest React action
    const addCitiesAct = {
      // Assume the model is the desired request path
      path: `/${actionConfigs.addCitiesRequest.model}`,
      // Verbs.ADD
      verb: actionConfigs.addCitiesRequest.verb,
      // The React action type to identify the request when the response comes back
      type: actionTypeLookup.addCitiesRequest,
      // Pass all action keys except for type
      value: R.omit(['type'], actions.addCitiesRequest(R.values(cities)))
    };

    const testSources = {
      ACTION: {
        // User intends to add cities
        a: actions.addCitiesRequest(R.values(cities))
      },
      ACTION_CONFIG: {
        // Get the ACTION_CONFIG stream
        a: reqPathThrowing(['ACTION_CONFIG'], sampleCycleSources)
      }
    };
    const sinks = {
      // In response to fetchRecordActionIntent,
      // we expect the fetchCitiesRequest HTTP request body
      HTTP: {
        s: addCitiesAct
      }
    };
    // Wrap the method to make it match a cycle call so we can use assertSourceSinks
    const fakeCycle = sources => ({HTTP: updateRecordActionIntent(sources)});
    // Override the source drivers with our fake sources
    assertSourcesSinks({
      ACTION: {'a|': testSources.ACTION},
      ACTION_CONFIG: {'a|': testSources.ACTION_CONFIG}
    }, {
      HTTP: {'s|': sinks.HTTP}
    }, fakeCycle, done, {interval: 200});
  });
});

