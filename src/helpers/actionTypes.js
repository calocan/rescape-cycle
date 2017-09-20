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

const {fromPairsMap} = require('rescape-ramda');

// This format is used to eliminate redundant strings but
// still support an IDE's autocomplete/goto declaration
module.exports = fromPairsMap((_, str) => [str, str], {
  // browseDataActions
  SET_SELECTED_BLOCK: '',
  SHOW_ALL_BLOCKS: '',

  // forecastActions
  SET_SELECTED_FORECAST_SCENARIO: '',
  UPDATE_FORECAST_MODEL: '',

  // mainActions
  RECEIVED_DATAPOINT_PROFILE: '',
  SOP_INDEX_CHANGED: '',
  PROJECT_PROFILE_RECEIVED: '',
  RESET_SOP_INDEX: '',
  SET_SELECTED_PROJECT: '',
  SET_DEFINITION_SCROLL_TO: '',
  MUST_RESIZE: '',

  // myProjectActions
  PROJECT_MODAL_OPEN: '',
  RECEIVE_PROJECTS: '',
  PROJECT_CREATED: '',
  REQUEST_PROJECTS: '',
  PROJECT_UPDATED: '',
  UPDATE_SELECTED_PROJECT_IF_CORRESPONDS: '',
  UPDATE_SELECTED_PROJECT_AFTER_DELETE_IF_CORRESPONDS: '',
  PROJECT_DELETED: '',

  // prioritizationActions
  SET_SELECTED_BLOCK_PRIORITIZATION: '',
  SHOW_ALL_BLOCKS_PRIORITIZATION: '',
  RECEIVE_GOALS: '',
  OPEN_FEASIBILITY_MODAL: '',
  REMOVE_GOAL_FROM_SELECTED_PROJECT: '',
  ADD_GOAL_TO_SELECTED_PROJECT: '',
  START_PRIORITIZING: '',
  FINISH_PRIORITIZING: '',
  FINISH_PRIORITIZING_PROJECT: '',
  CHANGE_FEASIBILITY: '',

  // scenarioActions
  SET_SELECTED_BLOCK_SCENARIOS: '',
  SHOW_ALL_BLOCKS_SCENARIOS: '',
  SCENARIO_NAME_ERROR: '',
  SCENARIO_CREATED: '',
  SCENARIO_EDITED: '',
  SCENARIO_CREATED_RECEIVED: '',
  SET_SELECTED_BLOCK_SCENARIO_EDIT: '',
  SET_SCENARIO_LOCATION_VARIABLE: '',
  UPDATE_NUMBER_EDIToED_VARIABLES: '',
  SET_SCENARIO_LOCATION_MULTIPLE_VARIABLE: '',
  UPDATE_SCENARIO_PROFILE_ERROR: '',
  PROJECT_SCENARIOS_RECEIVED: '',
  SET_SELECTED_SCENARIO: '',
  SCENARIO_ANALYZED: '',
  SHOW_SCENARIO_INDEX_SIDEBAR: '',

  // setLocationActions
  FETCH_CITIES_SUCCESS: '',
  SELECT_CITY_SUCESS: '',
  FETCH_CITY_DATAPOINTS_SUCCESS: '',
  FETCH_BLOCKNAMES_SUCCESS: '',
  NEIGHBORHOODS_SELECTED: '',
  STREETS_SELECTED: '',
  INTERSC1S_SELECTED: '',
  INTERSC2S_SELECTED: '',
  LOCATIONS_SELECTED: '',
  ADDED_TO_PROJECT: '',
  ADD_LOCATION_TO_SELECTED_PROJECT: '',
  REMOVE_LOCATION_TO_SELECTED_PROJECT: '',
  CLEAN_SELECTED_STREETS: '',
  CLEAN_SELECTED_NEIGHBORHOOD: '',
  SET_COORDINATES: '',
  SET_MARKER: '',
  SET_ZOOM: '',
  CLEAN_MARKERS: '',
  SET_BOUNDS: ''
});
