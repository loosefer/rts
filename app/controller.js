'use strict';

//PROBLEMS:
//Участник с меткой остановился под антенной

const MainReader = require('../core/devices/mainreader');
const PortableReader = require('../core/devices/portablereader');
const { ipcMain } = require('electron');
const REG_EVENT = require('./reg/events.js');
const RACE_EVENT = require('./race/events.js');
const utils = require('./utils.js');
const READER = require('./readers.js');
const _ = require('lodash');
const fs = require('fs');


module.exports = class Controller {
    constructor(win) {
        this.win = win;
        this.mainReader = new MainReader();
        this.portableReader = new PortableReader();

        this.users = {};
        this.competitorsMap = {};
        this.sortedCompetitors = [];
        this.raceStartTime = null;
    }

    initRegEvents() {
        ipcMain.on(REG_EVENT.PAGE_READY, (event, arg) => {
            this._renderReaderStatus(READER.PORTABLE, 'wait', 'Connecting');
            this.portableReader.onConnected = this._onPorableReaderConnect.bind(this);
            this.portableReader.onTag = this._portableReaderTagHandler.bind(this);
            this.portableReader.open();

            this._renderReaderStatus(READER.MAIN, 'wait', 'Connecting');
            this.mainReader.onConnected = this._onMainReaderConnect.bind(this);
            this.mainReader.onTag = this._mainReaderTagHandler.bind(this);
            this.mainReader.open();
        });

        ipcMain.on(REG_EVENT.NEW_USER, (event, arg) => {
            this.users[arg.uid] = arg;
            fs.writeFile('./app/storage/users.json', JSON.stringify(this.users));
            this._renderUsers();
        })

        ipcMain.on(REG_EVENT.REMOVE_USER, (event, uid) => {
            delete this.users[uid];
            this._renderUsers();
        });

        ipcMain.on(REG_EVENT.SUBMIT, (event) => {
            this.win.loadFile('view/race.html');
            this._initRaceEvents();
        });
    }

    _initRaceEvents() {
        ipcMain.on(RACE_EVENT.PAGE_READY, (event) => {
            this._initCompetitors();
            this.win.webContents.send(RACE_EVENT.UPDATE_USERS, this.sortedCompetitors);
        });

        ipcMain.on(RACE_EVENT.START, (event) => {
            this.raceStartTime = new Date();;
            this.mainReader.startListen();
        });
    }

    _initCompetitors() {
        this.competitorsMap = _.clone(this.users);
        for (let key in this.competitorsMap) {
            const name = this.competitorsMap[key].firstname + ' ' +
                this.competitorsMap[key].lastname;
            const t = new Date();
            t.setHours(0, 0, 0, 0);
            const humanReadableTime = utils.toHumanReadableTime(t);
            this.competitorsMap[key].position = 0;
            this.competitorsMap[key].competitor = name;
            this.competitorsMap[key]._totaltime = t;
            this.competitorsMap[key].totaltime = humanReadableTime;
            this.competitorsMap[key].diff = humanReadableTime;
            this.competitorsMap[key].laps = 0;
            this.competitorsMap[key].besttime = '-';
        }

        this.sortedCompetitors = Object.values(this.competitorsMap);
    }

    _renderUsers() {
        this.win.webContents.send(REG_EVENT.RENDER_USERS, this.users);
    }

    _onPorableReaderConnect(error) {
        if (error) {
            this._renderReaderStatus(READER.PORTABLE, 'error', error);
            return;
        }

        this._renderReaderStatus(READER.PORTABLE, 'ok', 'Connected');
    }

    _portableReaderTagHandler(tag) {
        this.win.webContents.send(REG_EVENT.ON_TAG, tag);
    }

    _renderReaderStatus(type, status, message) {
        this.win.webContents.send(REG_EVENT.READER_DATA, {
            type,
            info: {
                status,
                message
            }
        });
    }

    _onMainReaderConnect(error) {
        if (error) {
            this._renderReaderStatus(READER.MAIN, 'error', error);
            return;
        }

        this._renderReaderStatus(READER.MAIN, 'ok', 'Connected');
    }

    _mainReaderTagHandler(tag) {
        const diff = new Date() - this.raceStartTime;
            if (this.competitorsMap[tag] && !this.competitorsMap[tag].isFinished) {
                if (!this.competitorsMap[tag].lastDetect) {
                    this._updateCompetitor(tag);
                    this._sortAndCalcCompetitorProps();
                    this.win.webContents.send(RACE_EVENT.UPDATE_USERS, this.sortedCompetitors);
                }
                const now = new Date();
                if (now - this.competitorsMap[tag].lastDetect > 5000) {
                    this._updateCompetitor(tag);
                    this._sortAndCalcCompetitorProps();
                    this.win.webContents.send(RACE_EVENT.UPDATE_USERS, this.sortedCompetitors);
                }
            }

            const raceIsOver = Object.values(this.competitorsMap)
                .every(competitor => competitor.isFinished);
            if (raceIsOver) {
                this.mainReader.kill();
                this.win.webContents.send(RACE_EVENT.OVER, null);
            }
    }

    _updateCompetitor(tag) {
        const now = new Date();
        this.competitorsMap[tag].lastDetect = now;
        //const totalTime = now - this.raceStartTime + Math.floor(Math.random() * 6000) + 1000;
        const totalTime = now - this.raceStartTime;
        this.competitorsMap[tag]._totaltime = totalTime;
        this.competitorsMap[tag].totaltime = utils.toHumanReadableTime(totalTime);
        this.competitorsMap[tag].laps++;
        // this.competitorsMap[tag].besttime = humanReadableTime;

        //calc additonal laps
        const timeIsOver = new Date(now - this.raceStartTime).getMinutes() >= 10;
        if (timeIsOver) {
            if (!Number.isInteger(this.competitorsMap[tag].additionalLaps)) {
                this.competitorsMap[tag].additionalLaps = 0;
            } else {
                this.competitorsMap[tag].additionalLaps++;
            }
        }
        
        const addLaps = this.competitorsMap[tag].additionalLaps;
        if (Number.isInteger(addLaps) && addLaps === 2) {
            this.competitorsMap[tag].isFinished = true;
        }
    }

    _sortAndCalcCompetitorProps() {
        const sorted = _.orderBy(this.competitorsMap, ['_totaltime'], ['asc']);
        sorted.forEach((_, index) => {
            //calc diff and pos
            if (index === 0) {
                sorted[index].diff = '-';
            }
            sorted[index].position = index + 1;
            if (sorted[index + 1]) {
                const diff = sorted[index + 1]._totaltime - sorted[0]._totaltime;
                sorted[index + 1].diff = utils.toHumanReadableTime(diff);
            }
        });
        this.sortedCompetitors = sorted;
    }

    killAll() {
        this.portableReader.kill();
        this.mainReader.kill();
    }
}