const mysql = require('mysql');

/**
 * 创建数据库实例
 * @param { object } dbConfig: 数据库配置
 */
function createConnection(dbConfig) {
  const connection = mysql.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database
  });

  connection.connect();

  return connection;
}

module.exports = createConnection;