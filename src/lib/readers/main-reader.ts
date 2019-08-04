import { ChildProcess, spawn } from 'child_process';
import * as fs from 'fs';
import { RFIDTag } from '../types';
import BaseReader, { ProtocolMessages } from './base-reader';

const Q_VALUE = {
    _1: '1',
    _2: '2',
    _3: '3',
    _4: '4',
    _5: '5',
    _6: '6',
    _7: '7',
    _8: '8',
    _9: '9',
    _10: '10',
    _11: '11',
    _12: '12',
    _13: '13',
    _14: '14',
    _15: '15',
};

const SESSION = {
    _0: '0',
    _1: '1',
    _2: '2',
    _3: '3',
    AUTO: '255',
};

const M_READER_MSG: ProtocolMessages = {
    START_LISTEN: 'start_listen\r\n',
};

class MainReader extends BaseReader {
    constructor(path: string) {
        super(path);
        this.type = 'MAIN_READER';
        this.PROTOCOL = M_READER_MSG;
    }

    public open(): Promise<string> {
        this.emit('connectingStart');
        if (!fs.existsSync(this.exeFilePath)) {
            const msg = `${this.exeFilePath} not found`;
            return Promise.reject(msg);
        }

        return new Promise((resolve, reject) => {
            const scantime = '20';
            const args = [Q_VALUE._4, SESSION.AUTO, scantime];
            this.process = spawn(this.exeFilePath, args);
            this.process.stdout.on('data', (data: string) => {
                if (!this.isConnected) {
                    const [status, message] = data.toString().trim().split(':');

                    if (status === 'found') {
                        this.emit('onIpReceived', message);
                    }

                    if (status === 'error') {
                        this.emit('connectingFailed', message);
                        reject(`Connected to main reader failed, message: ${message}`);
                        return;
                    }

                    if (status === 'ok' && message === 'connected') {
                        this.isConnected = true;
                        this.emit('connected');
                        resolve();

                        return;
                    }
                } else {
                    const chunk = data.toString().trim().split('\n');
                    chunk.forEach((line: string) => {
                        const status = line.split(':')[0];

                        if (status === 'tag') {
                            this.emit('tag', this.parseTag(line));
                        } else {
                            // TODO: logger
                            throw new Error('Something went wrong with tag, line: ' + line);
                        }
                    });
                }
            });

            // TODO: Catch error if reader disconnected
            this.process.on('close', (code, signal) => {
                console.log('Main reader process was closed', code, signal);
            });
        });
    }

    // TODO: replace string to RFIDTag, add rssi and other props of main reader tag
    private parseTag(data: string): string {
        const [_, uid, rssi] = data.replace('\r', '')
            .split(':');
        return uid;
    }
}

export default MainReader;
