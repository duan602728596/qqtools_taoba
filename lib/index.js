const { cosmiconfig } = require('cosmiconfig');
const CoolQ = require('./coolQ/CoolQ');

const explorer = cosmiconfig('qqtools_taoba');

async function main() {
  const { config } = await explorer.search(); // 获取配置文件
  const coooQ = new CoolQ(config.qq, config.taoba, config.db, config.chouka);

  await coooQ.init();
}

main();