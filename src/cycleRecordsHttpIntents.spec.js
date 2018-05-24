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
import {assertSourcesSinks} from './helpers/jestCycleHelpers';
import {successFailureHttpIntent} from './cycleRecordsHttpIntents';
import {actions, sampleCycleSources, mockResponses} from 'unittest/sampleActions';
import {cities} from 'unittest/sampleCities';
import xs from 'xstream';
import {reqPathThrowing} from 'rescape-ramda';

const {fetchCitiesSuccessBody, fetchCitiesFailureBody} = mockResponses;

describe('cycleRecordsIntents', () => {
  test('successFailureHttpIntent', (done) => {
    // Test the HTTP success and failure intents
    const testSources = {
      // In Response to the addCitiesRequest and fetchCitiesRequest actions
      // We get the following HTTP responses as sources
      HTTP: {
        // We ignore the argument to select, the category, since we only have one category
        select: () => ({
          g: xs.of(fetchCitiesSuccessBody),
          h: xs.of(fetchCitiesFailureBody)
        })
      },
      ACTION_CONFIG: {
        // Get the ACTION_CONFIG stream
        a: reqPathThrowing(['ACTION_CONFIG'], sampleCycleSources)
      }
    };
    const sinks = {
      // In response to successFailureHttpIntent,
      // we expect a success or failure action
      ACTION: {
        // User intends to store cities
        s: actions.fetchCitiesSuccess({data: cities}),

        // User intents to fetch cities
        t: actions.fetchCitiesFailure(fetchCitiesFailureBody)
      }
    };
    // Wrap the method to make it match a cycle call so we can use assertSourceSinks
    const fakeCycle = sources => ({ACTION: successFailureHttpIntent(sources)});
    // Override the source drivers with our fake sources
    assertSourcesSinks({
      HTTP: {'gh|': testSources.HTTP},
      ACTION_CONFIG: {'a-|': testSources.ACTION_CONFIG}
    }, {
      ACTION: {'st|': sinks.ACTION}
    }, fakeCycle, done, {interval: 200});
  });
}, 10000);
