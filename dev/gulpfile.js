'use strict';

const gulp = require('gulp'),
      del = require('del'),
      addsrc = require('gulp-add-src'),
      notify = require('gulp-notify'),
      plumber = require('gulp-plumber'),
      sourcemaps = require('gulp-sourcemaps'),
      uglify = require('gulp-uglify'),
      compass = require('gulp-compass'),
      postcss = require('gulp-postcss'),
        autoprefixer = require('autoprefixer'),
        cssnano = require('cssnano'),
        pixrem = require('pixrem'),
      csslint = require('gulp-csslint'),
      concat = require('gulp-concat'),
      babel = require('gulp-babel'),
      jshint = require('gulp-jshint'),
      jscs = require('gulp-jscs'),
        stylish = require('gulp-jscs-stylish'),
      imagemin = require('gulp-imagemin'),
      pngquant = require('imagemin-pngquant'),
      imageDataURI = require('gulp-image-data-uri');


const dir = {
  input: {
    sass: {
      all: 'src/sass',
      plugins: 'src/sass/plugins/**/*.scss',
      custom: 'src/sass/**/*.scss'
    },
    js: {
      all: 'src/js',
      plugins: 'src/js/plugins/*.js',
      helpers: 'src/js/plugins/helpers/*.js',
      custom: ['src/js/blocks/**/*.js', 'src/js/main.js']
    },
    img: 'src/img'
  },
  output: {
    css: '../assets/css',
    js: '../assets/js',
    sourcemaps: '.',
    img: '../assets/img'
  },
  config: 'config/'
};

gulp.task('css', function() {
  del(dir.output.css);
  return gulp.src([dir.input.sass.custom])
    .pipe(plumber({errorHandler: notify.onError()}))
    .pipe(sourcemaps.init())
      .pipe(compass({
        sass: dir.input.sass.all,
        css: dir.output.css,
        image:  'testimg',
        style: 'expanded',
        relative: true,
        sourcemap: true
      }))
      .pipe(csslint())
      .pipe(postcss([
        pixrem(),
        autoprefixer({
          browsers: [
            'last 3 version',
            'ie 8',
            'ff 3.6',
            'opera 11.1',
            'ios 4',
            'android 2.3',
          ]
        }),
        cssnano({
          convertValues: false,
          zindex: false
        })
      ]))
      .pipe(concat('main.css'))
    .pipe(sourcemaps.write(dir.output.sourcemaps))
    .pipe(gulp.dest(dir.output.css));
});

gulp.task('js', function() {
  return gulp.src(dir.input.js.custom)
    .pipe(plumber({errorHandler: notify.onError()}))
    .pipe(sourcemaps.init())
    .pipe(jshint(dir.config + '.jshintrc'))
    .pipe(jscs({configPath: dir.config + '.jscsrc'}))
    .pipe(stylish.combineWithHintResults())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(babel({
      presets: ['es2015']
    }))
  
    .pipe(addsrc([dir.input.js.plugins, dir.input.js.helpers]))
    .pipe(concat('scripts.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write(dir.output.sourcemaps))
    .pipe(gulp.dest(dir.output.js));
});

gulp.task('img', function() {
  del(dir.output.img);
  gulp.src(dir.input.img + '/**/*.*', {since: gulp.lastRun('img')})
    .pipe(imagemin({
      progressive: true,
      use: [pngquant()],
      interlaced: true
    }))
    .pipe(gulp.dest(dir.output.img));
  
  return gulp.src(dir.input.img + '/base64/*.*', {since: gulp.lastRun('img')})
    .pipe(imageDataURI({
      template: {
        file: dir.config + 'data-uri-template.css'
      }
    })) 
    .pipe(concat('_base64.scss'))
    .pipe(gulp.dest(dir.input.sass.all));
});


gulp.task('build', gulp.parallel('css', 'js', 'img'));

gulp.task('watch', function(){
  gulp.watch(dir.input.sass.all + '/**/*.*', gulp.series('css')).on('unlink', deleteFiles);
  gulp.watch(dir.input.js.all + '/**/*.*', gulp.series('js')).on('unlink', deleteFiles);

  function deleteFiles(filepath) {
    var filePathFromSrc = path.relative(path.resolve('src'), filepath);
    // Concatenating the 'build' absolute path used by gulp.dest in the scripts task
    var destFilePath = path.resolve('build', filePathFromSrc);
    del.sync(destFilePath);
  };
});

gulp.task('default', gulp.parallel('build', 'watch'));