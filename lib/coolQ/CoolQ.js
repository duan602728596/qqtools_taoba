const WebSocket = require('ws');
const axios = require('axios');
const moment = require('moment');
const nunjucks = require('nunjucks');
const chalk = require('chalk');
const _ = require('lodash');
const { requestDetail, requestIdolsJoin, requestJoinRank } = require('../taoba/services');
const { callback } = require('./callback');
const timeDifference = require('./timeDiffenence');
const createConnection = require('../chouka/createConnection');
const { idExists } = require('../chouka/bindId');
const storagecard = require('../chouka/function/storagecard');
const { chouka } = require('../chouka/function/chouka');
const getLevelPoint = require('../chouka/function/getLevelPoint');
const bestCards = require('../chouka/function/bestCards');

const { renderString } = nunjucks;

class CoolQ {
  config = null;        // 酷Q的配置项
  taoBaConfig = null;   // 桃叭的配置
  dbConfig = null;      // 数据库的配置
  choukaConfig = null;  // 抽卡的配置

  coolqEdition = 'air'; // 酷Q的版本
  eventSocket = null;   // event socket
  apiSocket = null;     // api socket

  taobaInfo = null;     // 桃叭信息
  taobaTimer = null;    // 轮询监听
  lastTime = null;      // 记录最后拉取桃叭的信息

  /**
   * 初始化
   * @param { object } config: 酷Q的配置项
   * @param { object } taoBaConfig: 桃叭的配种
   * @param { object } dbConfig: 数据库的配置
   * @param { object } choukaConfig: 抽卡的配置
   */
  constructor(config, taoBaConfig, dbConfig, choukaConfig) {
    this.config = config;
    this.taoBaConfig = taoBaConfig;
    this.dbConfig = dbConfig;
    this.choukaConfig = choukaConfig;
  }

  // 发送单个抽卡信息
  async sendJiziOneItemMessage(item, args) {
    const {
      taoBaConfig,
      taobaInfo,
      datas,
      endTime,
      res1
    } = args;
    const { dbConfig, choukaConfig } = this;
    const { cards, money, multiple, sendImageLength, resetCardsToPoints } = choukaConfig;

    // 抽卡信息发送
    const choukaStr = [];    // 抽卡结果信息
    let cqImage = '\n';      // 抽卡图片
    let cardsPointsMsg = ''; // 抽卡积分信息

    // 抽卡相关逻辑
    const connection = createConnection(dbConfig);
    const userExists = await idExists(connection, dbConfig.table, item.userid);  // 判断是否绑定了QQ号
    const kaResult = await storagecard.query(connection, dbConfig, item.userid); // 数据库查询结果
    const record = kaResult.length === 0 ? {} : JSON.parse(kaResult[0].record);  // 卡牌结果
    const choukaResult = chouka(cards, money, Number(item.money), multiple);     // 抽卡结果
    const levelPoint = cards ? getLevelPoint(cards) : {};                        // 格式化等级对应的分数
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

    if (this.coolqEdition === 'pro') {
      // 发送所有图片
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

      cqImage = sendArr.join('[qqtools:stage]');
    }

    // 抽卡字符串拼接
    let choukaSend = '';

    if (choukaStr.length > 0) {
      if (!userExists?.[0]?.qq) {
        choukaSend += '【当前桃叭用户未绑定QQ号，请及时绑定QQ号。】\n';
      }

      choukaSend += '抽卡结果：\n';
      choukaSend += `${ choukaStr.join('\n') }${ cardsPointsMsg }${ cqImage }`;
    }

    // 把卡存入数据库
    if (kaResult.length === 0) {
      await storagecard.insert(connection, dbConfig, item.userid, item.nick, record, cardsPoints);
    } else {
      await storagecard.update(
        connection,
        dbConfig,
        item.userid,
        item.nick,
        record,
        (kaResult[0].points ?? 0) + cardsPoints
      );
    }

    connection.end();

    const msg = renderString(taoBaConfig.template, {
      nickname: item.nick,
      title: taobaInfo.title,
      money: item.money,
      taobaid: taoBaConfig.id,
      donation: datas.donation,
      amount: datas.amount,
      amountdifference: datas.amount - datas.donation,
      juser: res1.data.juser,
      expire: endTime.format('YYYY-MM-DD HH:mm:ss'),
      timedifference: timeDifference(endTime.valueOf()),
      chouka: choukaSend
    });

    await this.sendMessage(msg);
  }

  /**
   * 发送抽卡信息
   * @param { Array<object> } result: 要发送的集资信息
   */
  async sendJiziMessage(result) {
    const { taoBaConfig, taobaInfo } = this;
    const [res0, res1] = await Promise.all([
      requestDetail(taoBaConfig.id),
      requestJoinRank(taoBaConfig.id)
    ]);
    const { datas } = res0.data;
    const endTime = moment.unix(datas.expire);

    for (let i = result.length - 1; i >= 0; i--) {
      await this.sendJiziOneItemMessage(result[i], {
        taoBaConfig,
        taobaInfo,
        datas,
        endTime,
        res1
      });
    }
  }

  // 桃叭轮询函数
  handleTaobaTimer = async () => {
    try {
      const { id } = this.taoBaConfig;
      const result = [];
      let continue0 = true;
      let page = 0;

      while (continue0) {
        const res = await requestIdolsJoin(id, page);
        const { list } = res.data;
        const sendData = list.filter((o) => o.stime > this.lastTime);

        if (sendData.length > 0) {
          result.push(...sendData);
          page += 1;
        } else {
          continue0 = false;
        }
      }

      if (result.length > 0) {
        this.lastTime = result[0].stime; // 记录时间

        // 发送集资信息和抽卡数据
        await this.sendJiziMessage(result);
      }
    } catch (err) {
      console.error(err);
    }

    this.taobaTimer = setTimeout(this.handleTaobaTimer, 15000);
  };

  // 初始化桃叭
  async taobaInit() {
    // 集资信息
    const { id } = this.taoBaConfig;
    const res0 = await requestDetail(id);
    const { datas } = res0.data;

    this.taobaInfo = {
      title: datas.title,       // 项目名称
      donation: datas.donation, // 已集资金额
      amount: datas.amount,     // 集资总金额
      expire: datas.expire      // 项目结束时间（时间戳，秒）
    };

    // 订单信息
    const res1 = await requestIdolsJoin(id);
    const { list } = res1.data;

    this.lastTime = list.length > 0 ? list[0].stime : moment().unix();
    console.log(chalk.green(`获取项目信息：【${ datas.title }】`));
  }

  /**
   * 发送信息
   * @param { string } messageStr: 发送的信息
   */
  sendMessage(messageStr) {
    const messages = messageStr.split(/\[qqtools:stage\]/g); // 分段发送

    for (const message of messages) {
      this.apiSocket.send(JSON.stringify({
        action: 'send_group_msg',
        params: {
          group_id: this.config.group,
          message
        }
      }));
    }
  }

  // event socket监听信息
  handleEventMessage = (data) => {
    const json = JSON.parse(data);
    const { number, group } = this.config;

    // 群信息
    if ('group_id' in json && json.group_id === group && json.self_id === number) {
      if (json.message_type === 'group') {
        const content = json?.raw_message ?? json?.message;
        const command = content.split(/\s+/)
          .filter((o) => o !== '');

        if (command.length > 0) {
          callback(command, this, json);
        }
      }
    }
  };

  // api socket监听信息
  handleApiMessage = (data) => {
    const json = JSON.parse(data);
  };

  // 获取酷Q的信息
  async getCoolQInfo() {
    const { host, httpPort } = this.config;
    const res = await axios.get(`http://${ host }:${ httpPort }/get_version_info/`);
    const { coolq_edition, plugin_version } = res.data.data;

    this.coolqEdition = coolq_edition;
    console.log(chalk.blue(`酷Q版本：${ this.coolqEdition } ${ plugin_version }`));
  }

  // 初始化event socket
  eventSocketInit() {
    return new Promise((resolve, reject) => {
      const { host, wsPort } = this.config;

      this.eventSocket = new WebSocket(`ws://${ host }:${ wsPort }/event/`);
      this.eventSocket.on('open', () => resolve());
      this.eventSocket.on('message', this.handleEventMessage);
    });
  }

  // 初始化api socket
  apiSocketInit() {
    return new Promise((resolve, reject) => {
      const { host, wsPort } = this.config;

      this.apiSocket = new WebSocket(`ws://${ host }:${ wsPort }/api/`);
      this.apiSocket.on('open', () => resolve());
      this.apiSocket.on('message', this.handleApiMessage);
    });
  }

  // 初始化
  async init() {
    // 初始化socket
    await this.getCoolQInfo();
    await Promise.all([this.eventSocketInit(), this.apiSocketInit()]);
    console.log(chalk.green('WebSocket连接成功'));

    // 初始化桃叭
    await this.taobaInit();
    this.taobaTimer = setTimeout(this.handleTaobaTimer, 15000);
  }
}

module.exports = CoolQ;