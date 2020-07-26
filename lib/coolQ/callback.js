const nunjucks = require('nunjucks');
const { bindId } = require('../chouka/bindId');
const chakaCb = require('../chouka/function/chakaCb');
const bukaCb = require('../chouka/function/bukaCb');
const qianyi = require('../chouka/qianyi');

const { renderString } = nunjucks;

/* 发送集资信息 */
function taobaUrl(command, coolQ) {
  const { taobaInfo: { title }, taoBaConfig: { urlTemplate, id } } = coolQ;
  const msg = renderString(urlTemplate, { title, taobaid: id });

  coolQ.sendMessage(msg);
}

/**
 * 信息的回调函数
 * @param { Array<string> } command: 命令
 * @param { CoolQ } coolQ: 酷Q实例
 * @param { object } json: qq相关信息
 */
function callback(command, coolQ, json) {
  switch (command[0]) {
    case 'taoba':
    case '桃叭':
    case 'jz':
    case 'jizi':
    case '集资':
      taobaUrl(command, coolQ);
      break;

    case '绑定桃叭':
      bindId(command, coolQ, json);
      break;

    case '查卡':
      chakaCb(command, coolQ, json);
      break;

    case '补卡':
      bukaCb(command, coolQ, json);
      break;

    case '旧数据迁移':
      qianyi(command, coolQ, json);
      break;
  }
}

exports.callback = callback;