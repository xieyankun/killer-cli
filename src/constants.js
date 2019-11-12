const { version } = require('../package.json');

// 存储的模版的位置
let downloadDirectory = process.env[process.platform === 'darwin' ? 'HOME' : 'USERPROFILE'];
downloadDirectory = `${downloadDirectory}/.template`;
console.log(downloadDirectory)

module.exports = {
  version,
  downloadDirectory,
}