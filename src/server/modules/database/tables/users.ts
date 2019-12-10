// import { Database } from 'sqlite3';
import { databaseCache } from '../cache';
import { dbMorda } from '../database';

const database = dbMorda.database;

export interface UserData {
    uid: string;
    firstname: string;
    lastname: string;
    alreadyRegistred: boolean;
}

// export interface UserMethods {
//     get: (uid: string) => void;
// }

// export const getUserMethods = (database: Database): UserMethods => {
//     return {
//         // getUser
//
//             // select u.uid as "uid",
//             // u.firstname as "firstname",
//             // u.lastname as "lastname",
//             // count(r.uid) as "count",
//             // min(r.time) as "besttime"
//             // from race r
//             // join users u
//             // on r.uid = u.uid
//             // group by r.uid
//             // order by besttime asc
//
//         get(uid: string) {
//         //     const query = `select user_id from tags where uid = (?)`;
//         //     const user: UserData = {
//         //         firstname: '',
//         //         lastname: '',
//         //         uid,
//         //         alreadyRegistred: false,
//         //     };
//         //
//         //     return new Promise((resolve, reject) => {
//         //         database.get(query, [uid], (err, row) => {
//         //             if (err) {
//         //                 reject(err);
//         //             }
//         //
//         //             if (!row) {
//         //                 resolve(user);
//         //                 return;
//         //             }
//         //
//         //             user.alreadyRegistred = true;
//         //             resolve(Object.assign(user, row));
//         //         });
//         //     });
//         // }
//     }
// }

export const getUser = async (uid: string): Promise<UserData> => {
    const query = `select * from users where uid = (?)`;
    const user: UserData = {
        firstname: '',
        lastname: '',
        uid,
        alreadyRegistred: false,
    };

    return new Promise((resolve, reject) => {
        database.get(query, [uid], (err, row) => {
            if (err) {
                reject(err);
            }

            if (!row) {
                resolve(user);
                return;
            }

            user.alreadyRegistred = true;
            resolve(Object.assign(user, row));
        });
    });
};

export const getUsers = async (): Promise<UserData[]> => {
    const query = 'select * from users';
    const cache = databaseCache[query];
    if (cache) {
        return Promise.resolve(cache);
    }

    return new Promise((resolve, reject) => {
        database.all(query, (err: any, rows: any) => {
            if (err) {
                reject(err);
            }

            databaseCache[query] = rows;
            resolve(rows);
        });
    });
};

export const updateUser = (user: UserData): Promise<string> => {
    const {uid, firstname, lastname} = user;
    return new Promise((resolve, reject) => {
        database.run(`
            update users
            set
            firstname = (?),
            lastname = (?)
            where uid = (?)
        `, [
            firstname,
            lastname,
            uid,
        ], (err: any) => {
            if (err) {
                reject(`Something went wrong with user update: ${err.message}`);
            }

            databaseCache.clear();
            resolve('User updated');
        });
    });
};

export const insertUser = (user: UserData): Promise<string> => {
    const {uid, firstname, lastname} = user;
    return new Promise((resolve, reject) => {
        database.run(`
        insert into users(
            uid,
            firstname,
            lastname
        ) values (?, ?, ?)`, [
            uid,
            firstname,
            lastname,
        ], (err: any) => {

            const isUserAlreadyExist = err &&
                err.message === 'SQLITE_CONSTRAINT: UNIQUE constraint failed: users.uid';
            if (isUserAlreadyExist) {
                reject(`User with uid ${uid} already exist`);
            }

            databaseCache.clear();
            resolve(`A row has been inserted with uid ${uid}`);
        });
    });
};

export const deleteUser = (uid: string): Promise<void> => {
    const query = `delete from users where uid = (?);`;
    return new Promise((resolve, reject) => {
        database.run(query, uid, (err: Error) => {
            if (err) {
                reject(err);
            }

            databaseCache.clear();
            resolve();
        });
    });
};
