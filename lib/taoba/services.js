const axios = require('axios');
const { encodeData, decodeData } = require('./crawler');

/**
 * 请求详细数据
 * @param { string } id: 项目id
 */
async function requestDetail(id) {
  const time = new Date().getTime();
  const data = await encodeData(`{"id":"${ id }","requestTime":${ time },"_version_":1,"pf":"h5"}`);
  const res = await axios({
    method: 'POST',
    url: 'https://www.taoba.club/idols/detail',
    data
  });
  const responseData = await decodeData(res.data);

  return { status: res.status, data: JSON.parse(responseData), response: res };
}

/**
 * 请求集资数据
 * @param { string } id: 项目id
 * @param { number } page: 分页
 */
async function requestIdolsJoin(id, page = 0) {
  const time = new Date().getTime();
  const offset = page * 20;
  const data = await encodeData(`{"ismore":${ page === 0 ? 'true' : 'false' },"limit":20,`
    + `"id":"${ id }","offset":${ offset },"requestTime":${ time },"_version_":1,"pf":"h5"}`);
  const res = await axios({
    method: 'POST',
    url: 'https://www.taoba.club/idols/join',
    data
  });
  const responseData = await decodeData(res.data);

  return { status: res.status, data: JSON.parse(responseData), response: res };
}

/**
 * 请求人数
 * @param { string } id: 项目id
 */
async function requestJoinRank(id) {
  const time = new Date().getTime();
  const data = await encodeData(`{"id":"${ id }","iscoopen":0,"requestTime":${ time },"_version_":1,"pf":"h5"}`);
  const res = await axios({
    method: 'POST',
    url: 'https://www.taoba.club/idols/join/rank',
    data
  });
  const responseData = await decodeData(res.data);

  return { status: res.status, data: JSON.parse(responseData), response: res };
}

exports.requestDetail = requestDetail;
exports.requestIdolsJoin = requestIdolsJoin;
exports.requestJoinRank = requestJoinRank;