const path = require('path');
const { embed } = require('./embed-icon');

module.exports = async function afterPack(context) {
  if (context.electronPlatformName !== 'win32') return;
  await embed(path.join(context.appOutDir, 'DOKIII.exe'));
};
