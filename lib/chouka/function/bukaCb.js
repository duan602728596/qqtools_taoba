/* 补卡 */
const _ = require('lodash');
const storagecard = require('./storagecard');
const { chouka } = require('./chouka');
const bestCards = require('./bestCards');
const getLevelPoint = require('./getLevelPoint');
const createConnection = require('../createConnection');
const { idExists } = require('../bindId');

async function bukaCb(command, coolQ, json) {
  const { choukaConfig, dbConfig } = coolQ;
  const { bukaQQNumber, cards, money, multiple, sendImageLength, resetCardsToPoints } = choukaConfig;

  if (!bukaQQNumber.includes(json.user_id) || !command[1] || !/^[0-9]+$/.test(command[1])) {
    return;
  }

  try {
    const levelPoint = getLevelPoint(cards); // 格式化等级对应的分数
    const choukaStr = [];
    let cqImage = '';
    let cardsPointsMsg = '';

    // 把卡存入数据库
    const connection = createConnection(dbConfig);
    const userExists = await idExists(connection, dbConfig.table, command[1]);  // 判断是否绑定了QQ号
    const kaResult = await storagecard.query(connection, dbConfig, command[1]); // 数据库查询结果
    const record = kaResult.length === 0 ? {} : JSON.parse(kaResult[0].record); // 卡牌结果
    const choukaResult = chouka(cards, money, null, multiple, command[2] ? Number(command[2]) : 1); // 抽卡结果
    let cardsPoints = 0; // 积分

    for (const key in choukaResult) {
      const item2 = choukaResult[key];
      const str = `【${ item2.level }】${ item2.name } * ${ item2.length }`;

      choukaStr.push(str);

      if (resetCardsToPoints) {
        // 转换成积分
        if (item2.id in record) {
          // 有重复的卡片
          cardsPoints += levelPoint[item2.level] * item2.length;
        } else {
          // 新卡片
          record[item2.id] = 1;
          cardsPoints += levelPoint[item2.level] * (item2.length - 1);
        }
      } else {
        // 不转换成积分
        if (item2.id in record) {
          // 有重复的卡片
          record[item2.id] += item2.length;
        } else {
          // 新卡片
          record[item2.id] = item2.length;
        }
      }
    }

    if (resetCardsToPoints) {
      cardsPointsMsg = `\n已经将重复的卡片转换成积分：${ cardsPoints }。`;
    }

    if (coolQ.coolqEdition === 'pro') {
      const cqArr = [];

      if (sendImageLength === undefined || sendImageLength === null) {
        for (const key in choukaResult) {
          cqArr.push(`[CQ:image,file=${ choukaResult[key].image }]`);
        }
      } else {
        cqArr.push(...bestCards(cards, sendImageLength === 0 ? Object.values(choukaResult).length : sendImageLength));
      }

      const chunkArr = _.chunk(cqArr, 10);
      const sendArr = [];

      for (const item of chunkArr) {
        sendArr.push(item.join(''));
      }

      cqImage += sendArr.join('[qqtools:stage]');
    }

    // 把卡存入数据库
    if (kaResult.length === 0) {
      await storagecard.insert(connection, dbConfig, command[1], '', record, cardsPoints);
    } else {
      await storagecard.update2(
        connection,
        dbConfig,
        command[1],
        record,
        (Number(kaResult[0].points) ?? 0) + cardsPoints
      );
    }

    connection.end();

    // 抽卡字符串拼接
    const nickname = kaResult?.[0]?.nickname;
    let choukaSend = '';

    if (!userExists?.[0]?.qq) {
      choukaSend += '【当前桃叭用户未绑定QQ号，请及时绑定QQ号。】\n';
    }

    choukaSend += `[${ nickname && nickname !== '' ? nickname : command[1] }]的补卡结果为：`
      + `\n${ choukaStr.join('\n') }${ cardsPointsMsg }${ cqImage }`;
    await coolQ.sendMessage(choukaSend);
  } catch (err) {
    console.error(err);
  }
}

module.exports = bukaCb;