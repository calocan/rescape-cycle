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
const R = require('ramda');
const {apiUri} = require('./helpers/configHelpers');
const { actions, actionConfigs, actionTypeLookup } = require('test/sampleActions');
const {cities} = require('test/testCities');
const {fetchRecordHttpInterpret, updateRecordHttpInterpret} = require('./cycleRecordsHttpInterprets');
const {API_CONFIG} = require('./helpers/configHelpers');
const {config} = require('test/testConfig');
const {reqPath} = require('rescape-ramda').throwing;

describe('cycleRecordsHttpInterprets', () => {
  test('fetchRecordHttpInterpret', () => {
    const fetchCitiesAct = {
      // Assume the model is the desired request path
      path: actionConfigs.fetchCitiesRequest.model,
      // The verb here is always VERBS.FETCH
      verb: actionConfigs.fetchCitiesRequest.verb,
      // The React action type to identify the request when the response comes back
      type: actionTypeLookup.fetchCitiesRequest,
      // Pass all action keys except for type
      filters: R.omit(['type'], actions.fetchCitiesRequest(R.values(cities)))
    };
    const apiConfig = reqPath(API_CONFIG, config);
    expect(fetchRecordHttpInterpret({
      apiConfig: apiConfig,
      act: fetchCitiesAct
    })).toEqual({
      request: {
        url: `${apiUri(apiConfig)}${fetchCitiesAct.path}`,
        // We process all responses in the same place for now,
        // so use a catch-all category name
        category: 'all',
        type: actionTypeLookup.fetchCitiesRequest,
        filters: fetchCitiesAct.filters
      }
    });
  });

  test('updateRecordHttpInterpret', () => {
    const addCitiesAct = {
      // Assume the model is the desired request path
      path: actionConfigs.addCitiesRequest.model,
      // Verbs.ADD
      verb: actionConfigs.addCitiesRequest.verb,
      // The React action type to identify the request when the response comes back
      type: actionTypeLookup.addCitiesRequest,
      // Pass all action keys except for type
      value: R.omit(['type'], actions.addCitiesRequest(R.values(cities)))
    };
    const apiConfig = reqPath(API_CONFIG, config);
    expect(updateRecordHttpInterpret({
      apiConfig: apiConfig,
      act: addCitiesAct
    })).toEqual(
      R.merge({
        // All updates go to the URI without a path
        // The path is in the PATCH payload below, following JSON PATCH standards
        url: apiUri(apiConfig),
        method: 'PATCH',
        type: addCitiesAct.type,
        query: {
          // Create the patch payload based on the JSON PATCH spec
          // https://tools.ietf.org/html/rfc6902
          // 'add', 'remove', 'replace', etc
          op: R.toLower(addCitiesAct.verb),
          // The path to the object to act on. Even if this is updating a relational
          // database rather than JSON, we use this format for uniformity
          // e.g. /users/ for an add or /users/12345/ for a replace
          path: addCitiesAct.path,
          // The value of the add, replace, etc
          // This will normally be the object passed by the actionCreator caller merged
          // with scoping values such as the user and project
          // e.g. for an addFoo action {name: 'Foo', description: 'Foo!!!', user: 123, project: 456}
          value: addCitiesAct.value
        },
        // We process all responses in the same place for now,
        // so use a catch-all category name
        category: 'all'
      },
      addCitiesAct.filters)
    );
  });
});
