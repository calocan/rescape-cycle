import {mockTimeSource} from '@cycle/time';
import xs from 'xstream';

import R from 'ramda';
import {taskToPromise} from 'rescape-ramda';
import {of} from 'folktale/concurrency/task';

const expectTask = task => expect(taskToPromise(task));

describe('research', () => {
  test('lift can be used with Task', async () => {
    const lift2 = R.liftN(2, (a, b) => {
      return R.add(a, b);
    });
    expect.assertions(1);
    // See if we can add to Tasks together using lift
    await expectTask(lift2(
      Task.of(2),
      new Task((rej, res) => setTimeout(() => res(3))))
    ).resolves.toEqual(5);
  });

  /*
  This is with most.js I don't know how to the same with xstream
  test('understanding concatMap', function (done) {
      const Time = mockTimeSource();

      Time.assertEqual(
          Time.diagram('1---3---|').concatMap(i => xs.of([i, i + 1])),
          Time.diagram('(12)(34)|')
      );

      // Execute the schedule and ensure no errors
      Time.run(err => {
          expect(err).toBeFalsy();
          done();
      });
  });
  */
});

