import rootDispatcher from '../../modules/dispatcher/root-dispatcher';
import { Laps } from './lap-scenario';

export interface CurrentRaceRow {
    username: string;
}

export type CurrentRaces = CurrentRaceRow[];

export const updateRaceInfoView = (laps: Laps) => {
    const currentRaces = Object.keys(laps).reduce((races: CurrentRaces, uid: string) => {
        const lap = laps[uid];
        races.push({
            username: lap.user.firstname + ' ' + lap.user.lastname
        });

        return races;
    }, []);

    rootDispatcher.sendEvent('onCurrentRacesChanged', currentRaces);
};