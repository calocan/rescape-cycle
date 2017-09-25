/**
 * Created by Andy Likuski on 2017.08.16
 * Copyright (c) 2017 Andy Likuski
 *
 * Permission is hereby granted, free of charge, to any ACTION_ROOT obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit ACTION_ROOTs to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
const R = require('ramda');
const {asyncActions, asyncActionsPhaseKeys, makeActionTypesLookup, makeActionConfigLookup, resolveActionConfig}  = require('./actionHelpers');
const {capitalize} = require('rescape-ramda');
const {ACTION_ROOT, MODELS, ACTION_CONFIGS, actionConfigLookup} = require('../test/sampleActions');
const {VERBS, PHASES} = require('./actionHelpers');
const {FETCH} = VERBS;
const {REQUEST, SUCCESS, FAILURE} = PHASES;

describe('actionHelpers', () => {
  test('asyncActionsPhaseKeys', () => {
    expect(asyncActionsPhaseKeys(ACTION_ROOT, MODELS.CITIES, FETCH)).toEqual(
      {
        REQUEST: `${ACTION_ROOT}/${MODELS.CITIES}/${FETCH}_REQUEST`,
        SUCCESS: `${ACTION_ROOT}/${MODELS.CITIES}/${FETCH}_SUCCESS`,
        FAILURE: `${ACTION_ROOT}/${MODELS.CITIES}/${FETCH}_FAILURE`
      }
    );
  });

  test('asyncActions', () => {
    expect(asyncActions(ACTION_ROOT, MODELS.CITIES, FETCH)).toEqual(
      {
        [`${R.toLower(FETCH)}${capitalize(MODELS.CITIES)}Request`]: `${ACTION_ROOT}/${MODELS.CITIES}/${FETCH}_REQUEST`,
        [`${R.toLower(FETCH)}${capitalize(MODELS.CITIES)}Success`]: `${ACTION_ROOT}/${MODELS.CITIES}/${FETCH}_SUCCESS`,
        [`${R.toLower(FETCH)}${capitalize(MODELS.CITIES)}Failure`]: `${ACTION_ROOT}/${MODELS.CITIES}/${FETCH}_FAILURE`
      }
    );
  });

  test('makeActionTypesLookup', () => {
    expect(makeActionTypesLookup([
        {scope: {}, root: ACTION_ROOT, model: MODELS.BLOCKNAMES, verb: FETCH},
        {scope: {}, root: ACTION_ROOT, model: MODELS.CITIES, verb: FETCH}
      ])
    ).toEqual({
      [`${R.toLower(FETCH)}${capitalize(MODELS.BLOCKNAMES)}Request`]: `${ACTION_ROOT}/${MODELS.BLOCKNAMES}/${FETCH}_REQUEST`,
      [`${R.toLower(FETCH)}${capitalize(MODELS.BLOCKNAMES)}Success`]: `${ACTION_ROOT}/${MODELS.BLOCKNAMES}/${FETCH}_SUCCESS`,
      [`${R.toLower(FETCH)}${capitalize(MODELS.BLOCKNAMES)}Failure`]: `${ACTION_ROOT}/${MODELS.BLOCKNAMES}/${FETCH}_FAILURE`,
      [`${R.toLower(FETCH)}${capitalize(MODELS.CITIES)}Request`]: `${ACTION_ROOT}/${MODELS.CITIES}/${FETCH}_REQUEST`,
      [`${R.toLower(FETCH)}${capitalize(MODELS.CITIES)}Success`]: `${ACTION_ROOT}/${MODELS.CITIES}/${FETCH}_SUCCESS`,
      [`${R.toLower(FETCH)}${capitalize(MODELS.CITIES)}Failure`]: `${ACTION_ROOT}/${MODELS.CITIES}/${FETCH}_FAILURE`
    });
  });

  test('makeActionWithinConfigs', () => {
    expect(makeActionConfigLookup([
        {scope: {}, root: ACTION_ROOT, model: MODELS.BLOCKNAMES, verb: FETCH},
        {scope: {}, root: ACTION_ROOT, model: MODELS.CITIES, verb: FETCH}
      ])
    ).toEqual({
      [`${ACTION_ROOT}/${MODELS.BLOCKNAMES}/${FETCH}_REQUEST`]: {
        scope: {},
        root: ACTION_ROOT,
        model: MODELS.BLOCKNAMES,
        verb: FETCH,
        phase: REQUEST
      },
      [`${ACTION_ROOT}/${MODELS.BLOCKNAMES}/${FETCH}_SUCCESS`]: {
        scope: {},
        root: ACTION_ROOT,
        model: MODELS.BLOCKNAMES,
        verb: FETCH,
        phase: SUCCESS
      },
      [`${ACTION_ROOT}/${MODELS.BLOCKNAMES}/${FETCH}_FAILURE`]: {
        scope: {},
        root: ACTION_ROOT,
        model: MODELS.BLOCKNAMES,
        verb: FETCH,
        phase: FAILURE
      },
      [`${ACTION_ROOT}/${MODELS.CITIES}/${FETCH}_REQUEST`]: {
        scope: {},
        root: ACTION_ROOT,
        model: MODELS.CITIES,
        verb: FETCH,
        phase: REQUEST
      },
      [`${ACTION_ROOT}/${MODELS.CITIES}/${FETCH}_SUCCESS`]: {
        scope: {},
        root: ACTION_ROOT,
        model: MODELS.CITIES,
        verb: FETCH,
        phase: SUCCESS
      },
      [`${ACTION_ROOT}/${MODELS.CITIES}/${FETCH}_FAILURE`]: {
        scope: {},
        root: ACTION_ROOT,
        model: MODELS.CITIES,
        verb: FETCH,
        phase: FAILURE
      }
    });
  });

  test('resolveActionConfig', () => {
    expect(
      R.pick(['model', 'verb', 'phase'],
        resolveActionConfig(MODELS.CITIES, FETCH, PHASES.REQUEST, R.values(actionConfigLookup))
      )
    ).toEqual(
      {
        model: MODELS.CITIES,
        verb: FETCH,
        phase: PHASES.REQUEST
      }
    );
  })
});

