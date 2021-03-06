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
import {makeActionCreatorsForConfig, actionCreatorNameForPhase} from './helpers/actionCreatorHelpers';
import {mapDefault} from 'rescape-ramda';
import xs, {Stream} from 'xstream';
import {PHASES} from './helpers/actionHelpers';
import {reqPathThrowing} from 'rescape-ramda';
import {v} from 'rescape-validate';
import PropTypes from 'prop-types';

const {SUCCESS, FAILURE} = PHASES;

/**
 * Convert incoming intents to cycle actions
 */

/**
 * Respond to success or failure HTTP sources
 * @param ACTION_CONFIG
 * @param HTTP
 * @return Stream The action stream of success and failures
 */
export const successFailureHttpIntent = v(({ACTION_CONFIG, HTTP}) => {
  const response$ = HTTP.select('all').flatten();
  return xs.combine(response$, ACTION_CONFIG).map(([response, actionConfigs]) => {
    return intent(response, actionConfigs);
  });
  // .debug(actionBody => console.log(`Success/Failure act with action body ${prettyPrint(actionBody)}`));
}, [
  ['arg1', PropTypes.shape({
    ACTION_CONFIG: PropTypes.shape({addListener: PropTypes.func.isRequired}).isRequired,
    HTTP: PropTypes.object.isRequired
  }).isRequired]
], 'successFailureHttpIntent');


/**
 * Process each response against the actionConfig
 * @param response
 * @param actionConfig
 */
const intent = v((response, actionConfigs) => {
  const actionConfig = actionConfigs.configByType[reqPathThrowing(['request', 'type'], response)];
  // Pass the request query in as scope. It has the same keys that the success/failure actionCreator
  const actionCreators = makeActionCreatorsForConfig(
    actionConfig,
    // We don't need the scope for SUCCESS and FAILURE actions
    {}
  );
  if (R.contains(response.status, R.range(200, 300))) {
    // If we get a 200 range status code, call the SUCCESS action creator
    // TODO not sure if the whole response should be sent
    return actionCreators[actionCreatorNameForPhase(actionConfig, SUCCESS)](
      // Omit the request and status from the action body. Request is HTTP-driver specific and shouldn't
      // concern the React action.
      R.omit(['status', 'request'], response)
    );
  }
  // Otherwise call the FAILURE action creator
  // response$.replaceError(() => xs.of(errorObject))
  // TODO not sure if the whole response should be sent
  return actionCreators[actionCreatorNameForPhase(actionConfig, FAILURE)](
    response
  );
}, [
  ['response', PropTypes.shape({
    status: PropTypes.number.isRequired
  }).isRequired],
  ['actionConfigs', PropTypes.shape({
    configByType: PropTypes.object.isRequired
  }).isRequired]
], 'intent');

