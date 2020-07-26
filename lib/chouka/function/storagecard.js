/* 根据id查找信息 */
function query(connection, db, userid) {
  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT id, userid, nickname, record, points from ${ db.table } WHERE userid=?`,
      [userid],
      (err, results, fields) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      }
    );
  });
}

function query2(connection, db, useridOrNickname) {
  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT id, userid, nickname, record, points from ${ db.table } WHERE userid=? OR nickname=?`,
      [useridOrNickname, useridOrNickname],
      (err, results, fields) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      }
    );
  });
}

/* 插入数据库信息 */
function insert(connection, db, userid, nickname, record, points) {
  return new Promise((resolve, reject) => {
    connection.query(`INSERT INTO ${ db.table } (userid, nickname, record, points) VALUES (?, ?, ?, ?)`,
      [userid, nickname, JSON.stringify(record), points],
      (err, results, fields) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      }
    );
  });
}

/* 更新数据库数据 */
function update(connection, db, userid, nickname, record, points) {
  return new Promise((resolve, reject) => {
    connection.query(`UPDATE ${ db.table } SET nickname=?, record=?, points=? WHERE userid=?`,
      [nickname, JSON.stringify(record), points, userid],
      (err, results, fields) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      }
    );
  });
}

/* 补卡时更新的数据库 */
function update2(connection, db, userid, record, points) {
  return new Promise((resolve, reject) => {
    connection.query(`UPDATE ${ db.table } SET record=?, points=? WHERE userid=?`,
      [JSON.stringify(record), points, userid],
      (err, results, fields) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      }
    );
  });
}

exports.query = query;
exports.query2 = query2;
exports.insert = insert;
exports.update = update;
exports.update2 = update2;