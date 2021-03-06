import {mockTimeSource} from '@cycle/time';
import R from 'ramda';

// Modified from
// https://github.com/cyclejs-community/redux-cycles/blob/master/example/cycle/test/helpers.js

/**
 *
 * @param {Object} sources Diagram Mapping of the Cycle sources to assert in a form like this:
 * {
        ACTION: { 'ab|': actionSource },
        HTTP:   { '--|': httpSource }
   }
    where the key matches the source/sink Key, the inner key is the Time diagram string, and the inner
    value is a sourceOpts representation in form like this:
   {
        a: actions.requestReposByUser(user1), // returns a {} or func
        b: actions.requestReposByUser(user2)
   }
    where the key matches those in the diagram and the value an object result based
    on calling a Redux action or a func result like this for HTTP:
        () => ({
          r: xs.of({ body: { items: ['foo'] } })
        })
 * @param {Object} sinks A Diagram Mapping of expected Sinks in a form like:
 * {
 *  HTTP:   { 'xy|': httpSink }
 * }
 * where the key matches an expected sink key, the inner key is a diagram mapping keys to values
 * in the inner value, which is a Sync representation in a form like this:
 * {
    x: {
      url: `https://api.github.com/users/${user1}/repos`,
      category: 'users'
    },
    y: {
      url: `https://api.github.com/users/${user2}/repos`,
      category: 'users'
    }
  };
    where the keys match those in the diagram string, and the values are the expected doSync value
    to be produced by corresponding source
 * @param {Function} main The Cycle main function, which is called with sources and a mock timeSource
 * @param {Function} done Jest done() function to call after the assertion
 * @param {Object} [timeOpts] Supplied to mockTimeSource
 * @returns {undefined}
 */
export const assertSourcesSinks = (sources, sinks, main, done, timeOpts = {}) => {
    // Mock a Time Source
    const timeSource = mockTimeSource(timeOpts);
    const _sources = Object.keys(sources)
    // e.g. sourceKey is 'ACTION' or 'HTTP'
        .reduce((_theSources, sourceKey) => {
            // Extract the object, e.g.
            // {'ab|': {
            //  a: actions.requestReposByUser(user1),
            //  b: actions.requestReposByUser(user2)
            //  }} or
            //  '--|': {
            //      select: () => ({
            //          r: xs.of(response)
            //      })
            //  }}
            const sourceObj = sources[sourceKey];
            // Extract the source's only key to use in a Time diagram,
            // e.g. 'ab|'
            const diagramStr = Object.keys(sourceObj)[0];
            // Get the value associated with that key to use as options
            // e.g.
            // {
            //  a: actions.requestReposByUser(user1), (returns obj)
            //  b: actions.requestReposByUser(user2)
            // }
            // or
            // select: () => ({
            //  r: xs.of(response)
            // })
            const sourceOpts = sourceObj[diagramStr];

            let obj = {};
            // Take the first key of the sourceOpts e.g. 'a' or 'select'
            let firstKey = Object.keys(sourceOpts)[0];
            if (typeof sourceOpts[firstKey] === 'function') { // assume if one is func they all are
                // If the action call returns a function return an object with the Source key
                // valued by each key/func, the first sourceOpts key and valued by the Diagram call,
                // which itself is called with the Diagram key and key mappings
                // e.g.
                // {
                //  HTTP:
                //      {select: () => diagram('r-|', {r: xs.of(response)}}
                //      {put: () => diagram('--|', {r: xs.of(response)}}
                //  })
                obj = {
                    [sourceKey]:
                        R.map(
                            value => function () {
                                return timeSource.diagram(diagramStr, value(...arguments));
                                    // .tap( i => console.log(`Source: ${sourceKey}`, R.keys(i).join(',')) );
                            },
                            sourceOpts
                        )
                };
            } else {
                // Else the action call returns an object make an object keyed by the Source key and valued
                // by the Time Diagram, which itself is called with the Diagram key and key mappings
                // e.g.
                // {
                //  ACTIONS: diagram('ab|', {a: actions.requestReposByUser(user1)), b: actions.requestReposByUser(user2)})
                //  }
                obj = {
                    [sourceKey]: timeSource.diagram(diagramStr, sourceOpts)
                        // .tap( i => console.log(`Source: ${sourceKey}`, R.keys(i).join(',')) )
                };
            }

            // Reduce each Source object
            // Thus we return something like
            // {
            //  sourceA: sourceOpts1stKey: () => diagram(sourceASource1stKey1, sourceOptions1stValue)
            //  sourceB: sourceOpts1stKey: diagram(sourceASource1stKey1, sourceOptions)
            // }
            return Object.assign(_theSources, obj);
        }, {});

    // Reduce the sinks into an object in the following format
    // {
    //  sinkA: diagram(sinkAObj1stKey, sinkAObj1stValue)
    //  sinkB: diagram(sinkBObj1stKey, sinkBObj1stValue)
    // }
    const _sinks = Object.keys(sinks)
        .reduce((allSinks, sinkKey) => {
            const sinkObj = sinks[sinkKey];
            const diagram = Object.keys(sinkObj)[0];
            const sinkOpts = sinkObj[diagram];

            return Object.assign(allSinks, {[sinkKey]: timeSource.diagram(diagram, sinkOpts)});
        }, {});

    // Add TimeSource as a source
    _sources.Time = timeSource;

    // Call main with the mock sources to set up a main that
    // we can execute the time diagrams on
    const _main = main(_sources);

    // Assert that the time diagram streams of the main sink and the expect sink are equivalent
    Object.keys(sinks)
        .map(sinkKey => {
            timeSource.assertEqual(_main[sinkKey], _sinks[sinkKey]);
        });

    // Execute the schedule and ensure no errors
    timeSource.run(err => {
        expect(err).toBeFalsy();
        done();
    });
};
