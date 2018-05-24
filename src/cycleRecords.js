/**
 * Created by Andy Likuski on 2017.07.31
 * Copyright (c) 2017 Andy Likuski
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
import R from 'ramda';
import {fetchRecordActionIntent, updateRecordActionIntent} from './cycleRecordsActionIntents';
import {successFailureHttpIntent} from './cycleRecordsHttpIntents';
import {fetchRecordHttpInterpret, updateRecordHttpInterpret} from './cycleRecordsHttpInterprets';
import {mapDefault} from 'rescape-ramda';
import xs from 'xstream';
import {VERBS, PATCH_VERBS} from './helpers/actionHelpers';
import {reqPathThrowingPropEq, reqPathThrowing} from 'rescape-ramda';
import {v} from 'rescape-validate';
import PropTypes from 'prop-types';
import {CYCLE_API_KEY, API_CONFIG} from './helpers/configHelpers';
const {FETCH} = VERBS;

/**
 * Combines Redux ACTION Driver with Pouch ACTION Driver to perform CRUD operations
 * against a PouchDb.
 * @param {Stream} CONFIG Application Configuration
 * @param {Stream} ACTION_CONFIG Configuration of actions to match in the following format:
 * @param {String} ACTION_CONFIG.actionPath 'scope/actionName' Used to name the PouchDb Design Doc
 * @param {String} ACTION_CONFIG.actionUpdateName React Action name to perform updates
 * @param {String} ACTION_CONFIG.actionFetchName React Action name to perform fetches
 * @param {Object} ACTION_CONFIG.configByType A map of action types to actionConfigs. actoinConf
 * @param {Stream} ACTION The React Action driver source
 * @param {Stream} HTTP The Cycle.js HTTP driver
 * @returns {Object} The cycle.js sink containing ACTION and POUCHDB sinks
 */
module.exports.cycleRecords = v(({CONFIG, ACTION_CONFIG, ACTION, HTTP}) => {
    // Input intent of user, drivers, etc into internal acts (normally called in actions in cylce.js)

    // We call the following acts to distinguish them from React actions
    // Stream of fetch record intentions
    const fetchAct$ = fetchRecordActionIntent({ACTION_CONFIG, ACTION});
    // Stream of update record intentions
    const updateAct$ = updateRecordActionIntent({ACTION_CONFIG, ACTION});

    // Results in SUCCESS or FAILURE React action sink
    const successFailureActionSink$ = successFailureHttpIntent({ACTION_CONFIG, ACTION, HTTP});

    // Output instructions to async drivers
    const asyncSinks = {
      HTTP: R.reduce(
        // Merge each stream
        (accumStream$, stream$) => accumStream$ ? xs.merge(accumStream$, stream$) : stream$,
        null,
        // Map each act stream and its instruction function to a sink stream for async drivers like HTTP
        R.map(([act$, interpretFunc, verbs]) =>
            xs.combine(act$, CONFIG).map(([act, config]) => {
              return R.cond([
                // If the value is 'HTTP'
                [reqPathThrowingPropEq(
                  CYCLE_API_KEY,
                  'HTTP'),
                  R.always(interpretFunc({apiConfig: reqPathThrowing(API_CONFIG, config), act}))
                ],
                // Anything else is disallowed right now
                [R.T, () => {
                  throw new Error(`Unsupported driver key ${reqPathThrowing(CYCLE_API_KEY, config)}`);
                }]
              ])(config);
            }),
          // .debug(obj => `Interpreting ${R.join(', ', verbs)}`),
          [[fetchAct$, fetchRecordHttpInterpret, [FETCH]], [updateAct$, updateRecordHttpInterpret, R.keys(PATCH_VERBS)]])
      )
    };

    return R.merge({
      ACTION: successFailureActionSink$
    }, asyncSinks);
  },
  [
    ['arg1', PropTypes.shape({
      CONFIG: PropTypes.shape({addListener: PropTypes.func.isRequired}).isRequired,
      ACTION_CONFIG: PropTypes.shape({addListener: PropTypes.func.isRequired}).isRequired,
      ACTION: PropTypes.shape({addListener: PropTypes.func.isRequired}).isRequired,
      HTTP: PropTypes.shape({}).isRequired
    }).isRequired]
  ], 'cycleRecords');
