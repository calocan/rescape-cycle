/**
 * Created by Andy Likuski on 2017.12.03
 * Copyright (c) 2017 Andy Likuski
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import {getMockResponses} from './mockResponses';
import {ACTION_CONFIGS, MODELS, scopeValues} from './sampleActions';
import {cities} from './sampleCities';
import R from 'ramda';
import {projectLocations} from './sampleProjectLocations';
import {sampleConfig} from './sampleConfig';

describe('mockResponses', () => {
  test('getMockResponses', () => {
    const bodies = getMockResponses(
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
});
