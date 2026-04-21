'use strict';

const gulp = require('gulp');
const through2 = require('through2');
const JavaScriptObfuscator = require('javascript-obfuscator');
const { src, dest, watch, series } = require('gulp');
const concat = require('gulp-concat');
const terser = require('gulp-terser');
const cleanCSS = require('gulp-clean-css');
const rename = require('gulp-rename');
const purgecss = require('gulp-purgecss');

const paths = {
  customJs: ['src/js/zid-compat.js'],
  assetsOut: 'assets',
  css: [
    'assets/icomoon.css',
    'assets/animate.css',
    'assets/jquery-ui.min.css',
    'assets/jquery-ui.structure.min.css',
    'assets/jquery-ui.theme.min.css',
    'assets/slick.css',
    'assets/slick-theme.css',
    'assets/swiper-bundle.min.css',
    'assets/main.css',
    'assets/custom.css'
  ],
  js: [
    'assets/jquery-3.6.0.min.js',
    'assets/jquery-ui.min.js',
    'assets/popper.min.js',
    'assets/bootstrap.min.js',
    'assets/slick.min.js',
    'assets/swiper-bundle.min.js'
  ],
  twig: [
    'views/**/*.twig'
  ]
};

const obfuscatorConfig = {
  compact: true,
  simplify: true,
  stringArray: true,
  stringArrayThreshold: 1,
  stringArrayEncoding: ['rc4'],
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 2,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersParametersMaxCount: 4,
  stringArrayWrappersType: 'function',
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.15,
  transformObjectKeys: true,
  numbersToExpressions: true,
  splitStrings: true,
  splitStringsChunkLength: 15,
  selfDefending: true,
  target: 'browser',
  seed: 0,
  renameGlobals: false,
  renameProperties: false,
  debugProtection: false,
  disableConsoleOutput: false
};

function obfuscateCustomJs() {
  return gulp.src(paths.customJs, { base: 'src/js' })
    .pipe(through2.obj(function (file, enc, cb) {
      if (file.isNull()) return cb(null, file);
      if (!file.isBuffer()) return cb(new Error('Only Buffers are supported'));
      try {
        const result = JavaScriptObfuscator.obfuscate(String(file.contents), obfuscatorConfig);
        file.contents = Buffer.from(result.getObfuscatedCode());
      } catch (err) {
        return cb(err);
      }
      cb(null, file);
    }))
    .pipe(gulp.dest(paths.assetsOut));
}

// Old tasks
function purgeCSSTask() {
  return src(paths.css)
    .pipe(purgecss({
      content: paths.twig,
      safelist: ['.keep-this-class'],
    }))
    .pipe(cleanCSS())
    .pipe(rename({ suffix: '.min' }))
    .pipe(dest('assets/'));
}

function cssTask() {
  return src(paths.css)
    .pipe(concat('shift-styles.css'))
    .pipe(purgecss({
      content: paths.twig,
      safelist: ['.keep-this-class'],
    }))
    .pipe(cleanCSS())
    .pipe(dest('assets/'));
}

function jsTask() {
  return src(paths.js)
    .pipe(concat('scripts.js'))
    .pipe(rename({ suffix: '.bundle.min' }))
    .pipe(dest('assets/'));
}

function watchFiles() {
  gulp.watch('src/js/**/*.js', obfuscateCustomJs);
  watch(paths.css, cssTask);
  watch(paths.js, jsTask);
  watch(paths.twig, cssTask);
}

const build = series(obfuscateCustomJs, cssTask, jsTask);

exports.default = series(build, watchFiles);
exports.build = build;
exports.watch = watchFiles;
exports['obfuscate-js'] = obfuscateCustomJs;
