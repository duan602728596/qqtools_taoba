function timeDifference(endTime) {
  const endTimeDate = new Date(endTime);
  const nowTimeDate = new Date();
  // time
  const endTimeNumber = endTimeDate.getTime();
  const nowTimeNumber = nowTimeDate.getTime();

  let day = 0;
  let hour = 0;
  let minute = 0;
  let second = 0;

  if (nowTimeNumber >= endTimeNumber) {
    return '0秒';
  }

  const cha = parseInt((endTimeDate - nowTimeDate) / 1000);

  // 计算天数
  day = Math.floor(cha / 86400);

  // 计算小时
  const dayRemainder = cha % 86400;

  hour = Math.floor(dayRemainder / 3600);

  // 计算分钟
  const hourRemainder = dayRemainder % 3600;

  minute = Math.floor(hourRemainder / 60);

  // 计算秒
  second = hourRemainder % 60;

  let str = '';

  if (day > 0) str += `${ day }天${ hour }时${ minute }分`;

  else if (hour > 0) str += `${ hour }时${ minute }分`;

  else if (minute > 0) str += `${ minute }分`;

  str += `${ second }秒`;

  return str;
}

module.exports = timeDifference;