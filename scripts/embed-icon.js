const path = require('path');
const fs = require('fs');
const { rcedit } = require('rcedit');

async function embed(exePath) {
  const iconPath = path.resolve(__dirname, '..', 'build', 'icon.ico');
  const targetExe = path.resolve(exePath);

  if (!fs.existsSync(iconPath)) {
    throw new Error('Icon not found: ' + iconPath);
  }
  if (!fs.existsSync(targetExe)) {
    throw new Error('Target exe not found: ' + targetExe);
  }

  await rcedit(targetExe, {
    icon: iconPath,
    'version-string': {
      FileDescription: 'DOKIII',
      ProductName: 'DOKIII',
      LegalCopyright: 'DOKIII',
      OriginalFilename: 'DOKIII.exe',
    },
  });
  console.log('ICON_EMBEDDED_SUCCESSFULLY: ' + targetExe);
}

const exeArg = process.argv[2] || path.resolve(__dirname, '..', 'release', 'win-unpacked', 'DOKIII.exe');
embed(exeArg).catch((err) => {
  console.error(err);
  process.exit(1);
});
