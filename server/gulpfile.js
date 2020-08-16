const { src, dest, series, parallel } = require('gulp');
const fs = require('fs');
const zip = require('gulp-zip');
const log = require('fancy-log');
var exec = require('child_process').exec;

const paths = {
  prod_build: '../prod-build',
  server_file_name: 'server.bundle.js',
  react_src: '../client/build/**/*',
  react_dist: '../prod-build/client/build',
  node_src: '../server/dist/**/*',
  node_dist: '../prod-build/dist',
  zipped_file_name: 'react-nodejs.zip'
};

function clean()  {
  log('removing the old files in the directory')
  if(fs.existsSync(paths.prod_build)) fs.rmdirSync(paths.prod_build, { recursive: true })
  return Promise.resolve();
}

function createProdBuildFolder() {

  const dir = paths.prod_build;
  log(`Creating the folder if not exist  ${dir}`)
  if(!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
    log('📁  folder created:', dir);
  }

  return Promise.resolve('the value is ignored');
}

function buildNodeCodeTask(cb) {
  log('building server code')
  return exec('yarn build', function(err, stdout, stderr) {
    log(stdout);
    log(stderr);
    cb(err);
  })
}

function buildReactCodeTask(cb) {
  log('building React code into the directory')
  return exec('cd ./../client && yarn build', function (err, stdout, stderr) {
    log(stdout);
    log(stderr);
    cb(err);
  })
}

function copyReactCodeTask() {
  log('copying React code into the directory')
  return src(`${paths.react_src}`)
        .pipe(dest(`${paths.react_dist}`));
}

function copyNodeJSCodeTask() {
  log('copying server code into the directory')
  return src(`${paths.node_src}`)
        .pipe(dest(`${paths.node_dist}`));
}

function copyServerPackage() {
  log('copying server package into the directory')
  return src(['package.json'])
        .pipe(dest(`${paths.prod_build}`))
}

function zippingTask() {
  log('zipping the code ')
  return src(`${paths.prod_build}/**`)
      .pipe(zip(`${paths.zipped_file_name}`))
      .pipe(dest(`${paths.prod_build}`))
}

exports.default = series(
  clean,
  createProdBuildFolder,
  buildNodeCodeTask,
  buildReactCodeTask,
  parallel(copyReactCodeTask, copyNodeJSCodeTask, copyServerPackage),
  zippingTask
);