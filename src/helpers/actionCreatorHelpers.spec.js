/**
 * Created by Andy Likuski on 2017.08.16
 * Copyright (c) 2017 Andy Likuski
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
import R from 'ramda';
import { VERBS, PHASES, actionType, actionName } from './actionHelpers';
import {ACTION_ROOT, MODELS, ACTION_CONFIGS} from '../unittest/sampleActions';
import { ACTION_BODIES, creator, asyncActionCreators, makeActionCreators, makeActionCreatorsForConfig, actionConfig } from './actionCreatorHelpers';
import { filterWithKeys, capitalize } from 'rescape-ramda';

describe('actionHelpers', () => {
  const scope = {user: 1};
  const actions = R.fromPairs(R.map(str => [str, str], ['FOO']));
  test('creator with ret as obj', () => {
    const fooCreator = creator(actions.FOO, {foo: 'foo', bar: 'bar'});
    expect(
      fooCreator(scope, {foo: 'foo', bar: 'bar', zar: 'zar'})
    ).toEqual(
      {type: actions.FOO, user: 1, foo: 'foo', bar: 'bar'}
    );
  });

  test('creator with ret as string', () => {
    const fooCreator = creator(actions.FOO, 'data');
    expect(
      fooCreator(scope, {foo: 'foo', bar: 'bar', zar: 'zar'})
    ).toEqual(
      {type: actions.FOO, data: {user: 1, foo: 'foo', bar: 'bar', zar: 'zar'}}
    );
  });

  test('creator with ret as function', () => {
    const fooCreator = creator(actions.FOO, R.merge);
    expect(
      fooCreator(scope, {foo: 'foo', bar: 'bar', zar: 'zar'})
    ).toEqual(
      {type: actions.FOO, user: 1, foo: 'foo', bar: 'bar', zar: 'zar'}
    );
  });

  test('asyncActionCreators', () => {
    const [root, model, verb] = [ACTION_ROOT, MODELS.CITIES, VERBS.FETCH];
    const {REQUEST, SUCCESS, FAILURE} = PHASES;
    // Makes a lookup of phase to actionType for test validation
    const actionNames = R.map(actionName(model, verb), PHASES);
    const actionTypes = R.map(actionType(root, model, verb), PHASES);
    const actionCreators = asyncActionCreators(root, model, verb, {
      [REQUEST]: 'payload',
      [SUCCESS]: R.merge,
      [FAILURE]: 'error'
    });
    const data = {name: 'Paris'};
    // Call the REQUEST action and expect data is mirrored in payload
    expect(
      actionCreators[actionNames[REQUEST]](scope, data)
    ).toEqual(
      {type: actionTypes[REQUEST], payload: R.merge({user: 1}, data)}
    );

    const success = {name: 'Paris', fullName: 'Paris, France', description: 'delicieux'};
    // Call the SUCCESS action and expect success is merged in
    expect(
      actionCreators[actionNames[SUCCESS]](scope, success)
    ).toEqual(
      R.merge({type: actionTypes[SUCCESS], user: 1}, success)
    );

    const error = {message: 'Closed for 100 year war'};
    // Call the FAILURE action and expect error in error key
    expect(
      actionCreators[actionNames[FAILURE]](scope, error)
    ).toEqual(
      {type: actionTypes[FAILURE], error: R.merge(error, {user: 1})}
    );
  });

  test('makeActionCreatorsForConfig', () => {
    const user = {name: 'Bill'};
    const actionCreators = makeActionCreatorsForConfig(
      {scope: ['user'], root: ACTION_ROOT, model: MODELS.PROJECT_LOCATIONS, verb: VERBS.FETCH, ret: ACTION_BODIES},
      {user}
    );

    // Should have the user in the scope
    expect(
      actionCreators.fetchProjectLocationsRequest({}).user
    ).toEqual(
      user
    );
  });

  test('makeActionCreators', () => {
    const user = {name: 'Bill'};
    const project = {name: 'Winnemucca'};
    const actionCreators = makeActionCreators(
      ACTION_CONFIGS,
      {user, project}
    );

    // Filter the actionCreator by PHASE (REQUEST, SUCCESS, or FAILURE)
    const filterByPhase = phase => filterWithKeys((actionCreator, key) => R.endsWith(capitalize(R.toLower(phase)), key), actionCreators);
    // All REQUEST actions should have the user in the scope
    expect(
      R.map(
        actionCreator => actionCreator({foo: {}}).foo.user,
        filterByPhase(PHASES.REQUEST)
      )
    ).toEqual(
      R.map(actionCreator => user, filterByPhase(PHASES.REQUEST))
    );
    // Some should have the project in the scope
    expect(
      actionCreators.removeProjectLocationsRequest({foo: {}}).foo.project
    ).toEqual(
      project
    );
  });

  test('action bodies', () => {
    // Currently all verbs have the same action body functions
    const actionBody = ACTION_BODIES[VERBS.ADD];

    // REQUEST actions merge scope into each item
    expect(actionBody[PHASES.REQUEST](scope, {cow: {type: 'critter', likes: 'grass'}})).toEqual(
      {cow: {user: 1, type: 'critter', likes: 'grass'}}
    );

    // SUCCESS actions don't apply scope. It's presumably already applied in the response
    expect(actionBody[PHASES.SUCCESS](
      scope,
      {
        type: 'ranch/critters/ADD_SUCCESS',
        request: {cow: {type: 'critter', likes: 'grass'}},
        data: {cow: {user: 1, type: 'critter', likes: 'grass'}}
      }
    )).toEqual(
      {
        type: 'ranch/critters/ADD_SUCCESS',
        request: {cow: {type: 'critter', likes: 'grass'}},
        data: {cow: {user: 1, type: 'critter', likes: 'grass'}}
      }
    );

    // FAILRE action's dont apply scope. It's in the original request
    expect(actionBody[PHASES.FAILURE](
      scope,
      {
        type: 'ranch/critters/ADD_FAILURE',
        request: {cow: {type: 'critter', likes: 'grass'}},
        error: {message: 'Critter already exists!'}
      }
    )).toEqual({
      type: 'ranch/critters/ADD_FAILURE',
      request: {cow: {type: 'critter', likes: 'grass'}},
      error: {message: 'Critter already exists!'}
    });
  });

  test('actionConfig', () => {
    expect(actionConfig('sample', ['user'], 'foo', VERBS.FETCH)).toEqual(
      {root: 'sample', model: 'foo', verb: VERBS.FETCH, scope: ['user'], ret: ACTION_BODIES[VERBS.FETCH]}
    );
  });
});
