import { connect } from 'react-redux';
import { Ipc } from '../../../common/ipc';
import { IPC_RESULTS } from '../../../server/ipc/ipc-events';
import { UserData } from '../../../server/modules/database/tables/users';
import { selectContest } from '../contest/selectors';
import { ResultsInfo, ResultsInfoProps } from './results-info';
import { store, RootState } from '../../store';
import {
    setRaceHistory,
    setUsers,
    setTotalInfo,
} from '../../store/results-info-store';
import { RaceHistory } from '../../../server/view-data/results/updater';
import { TotalInfo } from '../../../server/view-data/results/updater';

const mapStateToProps = (state: RootState): ResultsInfoProps => ({
    history: state.resultsInfo.history,
    users: state.resultsInfo.users,
    total: state.resultsInfo.total,
    selectedContest: selectContest(state),
    deleteRace: (id: number) => Ipc.send(IPC_RESULTS.ON_RACE_DELETE, id),
});

const { dispatch } = store;
Ipc.on<RaceHistory>(IPC_RESULTS.RACE_HISTORY_UPDATE, (history) => {
    dispatch(setRaceHistory(history));
});

Ipc.on<UserData[]>(IPC_RESULTS.USERS_DATA_UPDATE, (users) => {
    dispatch(setUsers(users));
});

Ipc.on<TotalInfo>(IPC_RESULTS.TOTAL_INFO_UPDATE, (info) => {
    dispatch(setTotalInfo(info));
});

export const ResultsInfoContainer = connect(mapStateToProps)(ResultsInfo);
