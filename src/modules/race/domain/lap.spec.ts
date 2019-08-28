import { sleep } from '../../../lib/functions';
import { createFakeTag } from '../../../lib/readers/main-reader.spec';
import { TRACE_FILLING_TIMEOUT } from '../../../lib/rssi-trace';
import { UserData } from '../../database/database';
import Lap from './lap';

jest.setTimeout(10000);

describe('lap', () => {
    const fakeUser: UserData = {
        uid: '123',
        alreadyRegistred: true,
    };

    it('should be called onStart', (done) => {
        const lap = new Lap(fakeUser);
        lap.onStart = (lap: Lap) => {
            expect(lap.startTrace.getHighestPoint().tag).toEqual({
                uid: '123',
                rssi: 999,
            });
            done();
        };
        lap.appendTag(createFakeTag('123', 666));
        lap.appendTag(createFakeTag('123', 999));
    });

    it('should be called onFinish', async (done) => {
        const lap = new Lap(fakeUser);
        lap.onFinish = (lap: Lap) => {
            expect(lap.user).toBe(fakeUser);
            done();
        };

        lap.appendTag(createFakeTag('123', 666));
        lap.appendTag(createFakeTag('123', 999));
        await sleep(TRACE_FILLING_TIMEOUT + 100);
        lap.appendTag(createFakeTag('123', 123));
        lap.appendTag(createFakeTag('123', 321));
    });

    it('should be approx 5s between both timestamps', async (done) => {
        const lap = new Lap(fakeUser);
        lap.onFinish = (lap: Lap) => {
            expect(lap.user).toBe(fakeUser);
            expect(lap.getTotalTime()).toBeGreaterThanOrEqual(4999);
            expect(lap.getTotalTime()).toBeLessThanOrEqual(5001);
            done();
        };

        lap.appendTag(createFakeTag('123', 666));
        await sleep(5000);
        lap.appendTag(createFakeTag('123', 123));
    });
});
