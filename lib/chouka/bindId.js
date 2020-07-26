const createConnection = require('./createConnection');

/* 查询ID是否存在 */
function idExists(connection, table, userid) {
  return new Promise((resolve, reject) => {
    connection.query(`SELECT qq from ${ table } WHERE userid=?`, [userid], (err, results, fields) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
}

/* 查询QQ是否存在 */
function qqExists(connection, table, qq) {
  return new Promise((resolve, reject) => {
    connection.query(`SELECT qq from ${ table } WHERE qq=?`, [qq], (err, results, fields) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
}

/* 添加或更新id */
function updateId(connection, table, qq, taobaId, isAdd) {
  return new Promise((resolve, reject) => {
    const query = isAdd
      ? `INSERT INTO ${ table } (userid, qq, nickname, record) VALUES (?, ?, ?, ?)`
      : `UPDATE ${ table } SET userid=? WHERE qq=?`;
    const values = isAdd ? [taobaId, qq, '', '{}'] : [taobaId, qq];

    connection.query(query, values, (err, results, fields) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
}

/* 绑定QQ和桃叭ID */
async function bindId(command, coolQ, json) {
  if (!(command[1] && /^[0-9]+$/.test(command[1]))) {
    return;
  }

  const { dbConfig } = coolQ;
  const connection = createConnection(dbConfig);
  const result = await qqExists(connection, dbConfig.table, json.user_id);
  const isAdd = result.length === 0;

  await updateId(connection, dbConfig.table, json.user_id, command[1], isAdd);
  connection.end();
  coolQ.sendMessage(`将桃叭ID【${ command[1] }】绑定到QQ【${ json.user_id }】。`);
}

exports.idExists = idExists;
exports.qqExists = qqExists;
exports.bindId = bindId;