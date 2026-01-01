module.exports = {
  https: false,
  host: '127.0.0.1',
  port: 4010,
  cors: true,
  multiplex: false,
  validateRequest: true,
  validateResponse: true,
  checkSecurity: true,
  errors: {
    mock: true, // 返回详细的错误信息
  },
};
