'use strict';

const adjNoun = require('adj-noun');
const fs = require('fs');
const dateFns = require('date-fns');
const packageFile = require('./packageFile');
const semver = require('semver');

const versionFile = './src/app/core/version/version.ts';

function getBumpType() {
  const lastArg = process.argv[process.argv.length - 1];
  if (['prerelease', 'prepatch', 'preminor', 'premajor', 'patch', 'minor', 'major'].includes(lastArg)) {
    return lastArg;
  }
  return 'prerelease';
}

function writeVersionFile(pkg) {
  adjNoun.seed(dateFns.getTime(new Date()));
  fs.writeFileSync(versionFile, '// NOTE: do not edit this file manually\n');
  fs.appendFileSync(versionFile, '//       it is updated by the release tool\n');
  fs.appendFileSync(versionFile, 'export const version = {\n');
  fs.appendFileSync(versionFile, `  version: '${pkg.version}',\n`);
  fs.appendFileSync(versionFile, `  name: '${adjNoun().join(' ')}',\n`);
  fs.appendFileSync(versionFile, `  date: '${dateFns.format(new Date(), 'yyyy-MM-dd')}'\n`);
  fs.appendFileSync(versionFile, `};\n`);
}

const type = getBumpType();
const pkg = packageFile.read();
pkg.version = semver.inc(pkg.version, type);
packageFile.write(pkg);
writeVersionFile(pkg);
