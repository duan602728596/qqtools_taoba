module.exports = function(api) {
  api.cache(true);

  return {
    plugins: [
      '@babel/plugin-proposal-class-properties' // class 相关
    ]
  };
};