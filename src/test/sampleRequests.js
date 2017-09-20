/**
 * Created by Andy Likuski on 2017.09.18
 * Copyright (c) 2017 Andy Likuski
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

const R = require('ramda');
const {apiUri} = require('helpers/configHelpers');
const { actions, actionConfigs, actionTypeLookup} = require('test/sampleActions');
const {cities} = require('test/testCities');
const {reqPath} = require('rescape-ramda').throwing;
const {config} = require('test/testConfig');
const {
  VERBS: { FETCH, UPDATE, ADD, REMOVE, SELECT, DESELECT }
} = require('helpers/actionHelpers');

const fetchCitiesRequestBody = module.exports.fetchCitiesRequestBody = {
  request: {
    url: `${apiUri(reqPath(['settings', 'api'], config))}/${actionConfigs.fetchCitiesRequest.model}`,
    type: actionTypeLookup.fetchCitiesRequest,
    filters: R.omit(['type'], actions.fetchCitiesRequest(cities)),
    // We process all responses in the same place for now,
    // so use a catch-all category name
    category: 'all'
  }
};

// HTTP Driver Responses. including the request since that is what the Cycle.js HTTP driver does
module.exports.fetchCitiesResponseSuccess = R.merge(
  fetchCitiesRequestBody, {
    status: 200,
    data: cities
  }
);

module.exports.fetchCitiesResponseError = R.merge(
  fetchCitiesRequestBody, {
    status: 500,
    message: 'Internal Server Error'
  }
);

const addCitiesRequestBody = module.exports.addCitiesRequestBody = {
  // PATCH calls don't have a URL path, since the path is in the standarized
  // JSON query
  url: apiUri(reqPath(['settings', 'api'], config)),
  method: 'PATCH',
  type: actionTypeLookup.addCitiesRequest,
  query: {
    op: R.toLower(ADD),
    path: `/${actionConfigs.addCitiesRequest.model}`,
    value: R.omit(['type'], actions.addCitiesRequest(R.values(cities)))
  },
  // We process all responses in the same place for now,
  // so use a catch-all category name
  category: 'all'
};

// HTTP Driver Responses. including the request since that is what the Cycle.js HTTP driver does
module.exports.addCitiesResponseSuccess = {
  status: 200,
  request: addCitiesRequestBody,
  data: cities
};
