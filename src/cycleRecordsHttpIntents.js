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
const R = require('ramda');
const {makeActionCreatorsForConfig, actionCreatorNameForPhase} = require('./helpers/actionCreatorHelpers');
const {mapDefault} = require('rescape-ramda');
const {xs, Stream} = mapDefault('xs', require('xstream'));
const {
  PHASES: {SUCCESS, FAILURE}
} = require('./helpers/actionHelpers');
const {reqPath} = require('rescape-ramda').throwing;
const {v} = require('rescape-validate');
const PropTypes = require('prop-types');
const {SCOPE_FROM_REQUEST} = require('helpers/configHelpers');

/**
 * Convert incoming intents to cycle actions
 */

/**
 * Respond to success or failure HTTP sources
 * @param ACTION_CONFIG
 * @param HTTP
 * @return Stream The action stream of success and failures
 */
module.exports.successFailureHttpIntent = v(({ACTION_CONFIG, HTTP}) => {
  const response$ = HTTP.select('all').flatten();
  return xs.combine(response$, ACTION_CONFIG).map(([response, actionProps]) => {
    const actionConfig = actionProps.configByType[reqPath(['request', 'type'], response)];
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
  });
  // .debug(actionBody => console.log(`Success/Failure act with action body ${prettyPrint(actionBody)}`));
}, [
  ['arg1', PropTypes.shape({
    ACTION_CONFIG: PropTypes.instanceOf(Stream).isRequired,
    HTTP: PropTypes.object.isRequired
  }).isRequired]
], 'successFailureHttpIntent');

