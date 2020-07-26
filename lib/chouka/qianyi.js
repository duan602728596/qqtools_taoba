const createConnection = require('./createConnection');
const { qqExists } = require('./bindId');
const storagecard = require('./function/storagecard');

/* 根据qq查信息 */
function query(connection, db, qq) {
  return new Promise((resolve, reject) => {
    connection.query(`SELECT record, points, _migrate from ${ db.table } WHERE qq=?`, [qq], (err, results, fields) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });

  });
}

/* 更新数据库数据 */
function update(connection, db, qq, record, points, migrate) {
  return new Promise((resolve, reject) => {
    connection.query(`UPDATE ${ db.table } SET record=?, points=?, _migrate=? WHERE qq=?`,
      [JSON.stringify(record), points, migrate, qq],
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

/* 旧表数据合并到新表 */
async function qianyi(command, coolQ, json) {
  const { dbConfig } = coolQ;

  // 查询旧表
  const oldDbConfig = { ...dbConfig, table: dbConfig.oldTable };
  const oldConnection = createConnection(oldDbConfig);
  const oldKaResult = await storagecard.query(oldConnection, oldDbConfig, command[1]);

  if (oldKaResult.length === 0) {
    await coolQ.sendMessage('旧表数据不存在！');
    oldConnection.end();

    return;
  }

  // 判断是否绑定了QQ
  const connection = createConnection(dbConfig);
  const kaResult = await query(connection, dbConfig, json.user_id);

  if (kaResult.length === 0) {
    await coolQ.sendMessage('请先绑定QQ号！');
    connection.end();

    return;
  }

  if (kaResult[0]._migrate) {
    await coolQ.sendMessage('数据已经迁移，请不要重复操作！');
    connection.end();

    return;
  }

  const record = kaResult.length === 0 ? {} : JSON.parse(kaResult[0].record);          // 卡牌结果
  const oldRecord = oldKaResult.length === 0 ? {} : JSON.parse(oldKaResult[0].record); // 旧卡牌结果
  const points = kaResult[0].points ?? 0;                                              // 积分
  const newPoints = (oldKaResult[0].points ?? 0) + points;                             // 新卡积分

  for (const key in oldRecord) {
    if (key in record) {
      record[key] += oldRecord[key];
    } else {
      record[key] = oldRecord[key];
    }
  }

  await update(connection, dbConfig, json.user_id, record, newPoints, 1);
  oldConnection.end();
  connection.end();

  await coolQ.sendMessage('数据迁移完毕！');
}

module.exports = qianyi;