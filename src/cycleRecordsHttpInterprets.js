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
const {mapDefault} = require('rescape-ramda');
const {xsm} = mapDefault('xs', require('xstream'));
const {apiUri} = require('helpers/configHelpers');
const {v} = require('rescape-validate');
const PropTypes = require('prop-types');

/**
 * Convert cycle actions to sink instructions
 */

/**
 * Convert the action to an HTTP request instruction
 * @param {Object} api The api configuration
 * @param {Object} act The fetchAct is an object indicating a fetch act
 * @param {Object} act.params The params of the act
 * @param {String} act.path The request path for the api
 * @returns {Object} a Complete HTTP request for the HTTP driver
 */
module.exports.fetchRecordHttpInterpret = v(({apiConfig, act}) => (
  // Map the params to a HTTP source for the params
  {
    request: {
      url: `${apiUri(apiConfig)}${act.path}`,
      // We process all responses in the same place for now,
      // so use a catch-all category name
      category: 'all',
      type: act.type,
      filters: act.filters
    }
  }
), [
  ['arg1', PropTypes.shape({
    apiConfig: PropTypes.shape({}).isRequired,
    act: PropTypes.shape({
      filters: PropTypes.shape({}).isRequired,
      type: PropTypes.string.isRequired
    }).isRequired
  }).isRequired]
], 'fetchRecordHttpInterpret');

/**
 * Convert the action to an HTTP request instruction
 * @param {Object} apiConfig The api params, 'host', 'protocol', and 'port'
 * @param {Object} act The updateAct is an object indicating an update act
 * @param {Object} act.params The params of the act
 * @param {String} act.verb The type of PATCH command
 * @param {String} act.path The API path
 * @param {*} act.value The value being patched
 * @returns {Object} The HTTP Driver fetch sink body
 */
module.exports.updateRecordHttpInterpret = v(({apiConfig, act}) =>
  ({
    // All updates go to the URI without a path
    // The path is in the PATCH payload below, following JSON PATCH standards
    url: apiUri(apiConfig),
    method: 'PATCH',
    type: act.type,
    query: {
      // Create the patch payload based on the JSON PATCH spec
      // https://tools.ietf.org/html/rfc6902
      // 'add', 'remove', 'replace', etc
      op: R.toLower(act.verb),
      // The path to the object to act on. Even if this is updating a relational
      // database rather than JSON, we use this format for uniformity
      // e.g. /users/ for an add or /users/12345/ for a replace
      path: act.path,
      // The value of the add, replace, etc
      // This will normally be the object passed by the actionCreator caller merged
      // with scoping values such as the user and project
      // e.g. for an addFoo action {name: 'Foo', description: 'Foo!!!', user: 123, project: 456}
      value: act.value
    },
    // We process all responses in the same place for now,
    // so use a catch-all category name
    category: 'all',
  })
, [
  ['arg1', PropTypes.shape({
    apiConfig: PropTypes.shape({}).isRequired,
    act: PropTypes.shape({
      verb: PropTypes.string.isRequired,
      path: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      value: PropTypes.shape({}).isRequired
    }).isRequired
  }).isRequired]
], 'updateRecordHttpInterpret');
