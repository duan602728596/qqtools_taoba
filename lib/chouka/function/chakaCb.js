const createConnection = require('../createConnection');
const storagecard = require('./storagecard');

/* 查卡 */
async function chakaCb(command, coolQ, json) {
  const { dbConfig, choukaConfig } = coolQ;
  const { cards, resetCardsToPoints } = choukaConfig;
  const connection = createConnection(dbConfig);
  const user = command[1] ?? json.user_id; // 用户
  const kaResult = await storagecard.query2(connection, dbConfig, user);

  connection.end();

  if (kaResult.length === 0) {
    await coolQ.sendMessage(`[${ user }]：暂无卡片。`);

    return;
  }

  const record = JSON.parse(kaResult[0].record);
  const strArr = [];

  for (let i = cards.length - 1; i >= 0; i--) {
    const item = cards[i];
    const strData = [];

    for (const item2 of item.data) {
      if (item2.id in record && record[item2.id] > 0) {
        strData.push(`${ item2.name } * ${ record[item2.id] }`);
      }
    }

    if (strData.length > 0) {
      let str = `【${ item.level }】`;

      str += `(${ strData.length }/${ item.data.length })：`;
      str += `\n${ strData.join('\n') }`;
      strArr.push(str);
    }
  }

  if (strArr.length === 0) {
    await coolQ.sendMessage(`[${ user }] 的查卡结果：暂无卡片。`);

    return void 0;
  } else {
    const nickname = kaResult[0].nickname;
    let msg = `[${ nickname && nickname !== '' ? nickname : user }] 的查卡结果：\n${ strArr.join('\n') }`;

    if (resetCardsToPoints) {
      msg += `\n★积分：${ Number(kaResult[0].points) }`;
    }

    await coolQ.sendMessage(msg);
  }
}

module.exports = chakaCb;