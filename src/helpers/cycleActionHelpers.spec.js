/**
 * Created by Andy Likuski on 2017.08.19
 * Copyright (c) 2017 Andy Likuski
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
const {streamConfigSources, overrideSources, overrideSourcesWithoutStreaming, mergeCycleSources} = require('./cycleActionHelpers');
const xs = require('xstream').default;
const {makeHTTPDriver} = require('@cycle/http');
const {actionConfig} = require('./actionCreatorHelpers');
const {sampleCycleSources} = require('unittest/sampleActions');
const {VERBS: {FETCH}, makeActionConfigLookup} = require('./actionHelpers');
const {sampleConfig} = require('unittest/sampleConfig');
const {cycleRecords} = require('cycleRecords');
const R = require('ramda');
const {run} = require('@cycle/run');

describe('cycleActionHelpers', () => {
  const apple = 'apple';
  test('streamConfigSources', () => {
    expect(R.mapObjIndexed(
      // For equality testing, expose the underlying xs.of(apple) and the keys of the HTTP Driver
      (source, key) => key === 'ACTION_CONFIG' ? source() : R.keys(source),
      streamConfigSources(
        { ACTION_CONFIG: apple,
          HTTP: makeHTTPDriver() }
      )
    )).toEqual(
      { ACTION_CONFIG: xs.of(apple),
        HTTP: R.keys(makeHTTPDriver())
      }
    );
  });

  test('overrideSources', () => {
    // Make sure our ACTION_CONFIG overrides the default and makes it a stream
    expect(
      overrideSources(
        { ACTION_CONFIG: apple }).ACTION_CONFIG()
    ).toEqual(
      xs.of(apple)
    );
  });

  test('mergeCycleSources', () => {
    const ACTION_CONFIGS = [
      actionConfig('foo', ['user'], 'bar', FETCH)
    ];

    /**
     * cycle.js sources that process sample async actions
     */
    const moreCycleSources = overrideSourcesWithoutStreaming({
      // Supply the default configuration for values such as the API location.
      CONFIG: sampleConfig,
      // ACTION_CONFIG configures the generic cycleRecords to call/match the correct actions
      ACTION_CONFIG: {
        configByType: makeActionConfigLookup(ACTION_CONFIGS)
      }
    });
    // Make sure the action types merge
    const sources = [sampleCycleSources, moreCycleSources];
    expect(
      R.keys(mergeCycleSources(sources).ACTION_CONFIG.configByType)
    ).toEqual(
      // The action keys of each source
      R.reduce(R.concat, [],
        R.map(({ACTION_CONFIG}) => R.keys(ACTION_CONFIG.configByType),
          sources
        )
      )
    );

    // Make sure we can run once we convert the sources to drivers
    expect(
      run(
        cycleRecords,
        streamConfigSources(
          mergeCycleSources(sources)
        )
      )
    ).toBeTruthy();
  });
});
