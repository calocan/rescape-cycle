/**
 * Created by Andy Likuski on 2017.11.28
 * Copyright (c) 2017 Andy Likuski
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

const {default: configureStore} = require('redux-mock-store');
const {default: thunk} = require('redux-thunk');
const middlewares = [thunk];
const {mergeDeep} = require('rescape-ramda');

/**
 * Makes a mock store with the given state and optional sampleUserSettings. If the sampleUserSettings
 * they are merged into the state with deepMerge, so make sure the structure matches the state
 * @param {Object} state The initial redux state
 * @param {Object} sampleUserSettings Merges in sample local settings, like those from a browser cache
 * @returns {Object} A mock redux store
 */
module.exports.makeMockStore = (state, sampleUserSettings = {}) => {
  const mockStore = configureStore(middlewares);
  // Creates a mock store that merges the initial state with local user settings.
  return mockStore(
    mergeDeep(
      state,
      sampleUserSettings
    )
  );
};