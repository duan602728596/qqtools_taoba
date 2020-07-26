module.exports = {
  qq: {
    number: 519951426,
    group: 16443222,
    host: '10.211.55.3',
    httpPort: 5700,
    wsPort: 17000
  },
  taoba: {
    id: 5354,
    template: `@{{ nickname }} 刚刚在【{{ title }}】打赏了{{ money }}元，感谢这位聚聚！
{{ chouka }}项目地址：https://www.taoba.club/#/pages/idols/detail?id={{ taobaid }}
当前进度：￥{{ donation }} / ￥{{ amount }}
相差金额：￥{{ amountdifference }}
集资参与人数：{{ juser }}人
项目截止时间：{{ expire }}
距离项目截止还有：{{ timedifference }}`,
    urlTemplate: `桃叭：{{ title }}
https://www.taoba.club/#/pages/idols/detail?id={{ taobaid }}`
  },
  db: {
    host: '10.211.55.3',
    port: 3306,
    user: '',
    password: '',
    database: 'test-chouka',
    table: 'chouka_taoba',
    oldTable: 'chouka'
  },
  chouka: {
    bukaQQNumber: [602728596],
    cards: [
      {
        level: 'r',
        length: 5,
        data: [
          { id: 'r1', name: 'r卡1', image: 'r\\r1.jpg' },
          { id: 'r2', name: 'r卡2', image: 'r\\r2.jpg' }
        ],
        point: 0
      },
      {
        level: 'sr',
        length: 3,
        data: [
          { id: 'sr1', name: 'sr卡1', image: 'sr\\sr1.jpg' },
          { id: 'sr2', name: 'sr卡2', image: 'sr\\sr2.jpg' }
        ],
        point: 0
      }
    ],
    money: 0.1,
    multiple: 5,
    sendImageLength: 2,
    resetCardsToPoints: false
  }
};