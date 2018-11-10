const gulp = require("gulp");
const sass = require("gulp-sass");
const gulpIf = require('gulp-if');
const autoprefixer = require("gulp-autoprefixer");
const browserSync = require("browser-sync").create();
const concat = require("gulp-concat");
const eslint = require('gulp-eslint');

gulp.task("default", ["copy-manifest", "copy-html", "copy-images", "styles", "lint-fix", "scripts-dist", 'copy-js', 'copy-swjs'], function() {
  gulp.watch("js/**/*.js", ["lint-fix", "scripts"]);
  gulp.watch("/*.html", ["copy-html"]);
  gulp.watch("sass/**/*.scss", ["styles"]);

  browserSync.init({
    server: "./dist"
  });
});

gulp.task('dist', [
  'copy-html',
  'copy-images',
  'styles',
  'lint',
  'scripts-dist'
]);

gulp.task("copy-js", function() {
  gulp
    .src(['js/main.js', 'js/restaurant_info.js', 'js/idb.js', 'js/store.js'])
    .pipe(gulp.dest('dist/js'));
});

gulp.task("copy-swjs", function() {
  gulp
    .src(['sw.js'])
    .pipe(gulp.dest('dist/'));
});

// https://github.com/adametry/gulp-eslint/blob/master/example/fix.js
// November 10th, 2018
function isFixed(file) {
  return file.eslint != null && file.eslint.fixed;
}

gulp.task('lint-fix', function() {
  return (
    gulp
      .src(['js/**/*.js'])
      // eslint() attaches the lint output to the eslint property
      // of the file object so it can be used by other modules.
      .pipe(eslint({fix: true}))
      // eslint.format() outputs the lint results to the console.
      // Alternatively use eslint.formatEach() (see Docs).
      .pipe(eslint.format())
      .pipe(gulpIf(isFixed, gulp.dest('js/')))
      // To have the process exit with an error code (1) on
      // lint error, return the stream and pipe to failOnError last.
      .pipe(eslint.failOnError())
  );
});

gulp.task('lint', function() {
  return (
    gulp
      .src(['js/**/*.js'])
      // eslint() attaches the lint output to the eslint property
      // of the file object so it can be used by other modules.
      .pipe(eslint())
      // eslint.format() outputs the lint results to the console.
      // Alternatively use eslint.formatEach() (see Docs).
      .pipe(eslint.format())
      // To have the process exit with an error code (1) on
      // lint error, return the stream and pipe to failOnError last.
      .pipe(eslint.failOnError())
  );
});

gulp.task("copy-manifest", function() {
  gulp
    .src('./manifest.json')
    .pipe(gulp.dest('dist/'));
});

gulp.task("copy-html", function() {
  gulp
    .src('./*.html')
    .pipe(gulp.dest('dist/'));
});

gulp.task("copy-images", function() {
  gulp
    .src('img/*')
    .pipe(gulp.dest('dist/img'));
});

gulp.task("scripts-dist", function() {
  gulp
    .src(['js/**/*.js', '!js/main.js', '!js/restaurant_info.js', '!js/idb.js', '!js/store.js'])
    .pipe(concat('all.js'))
    .pipe(gulp.dest('dist/js'));
});

gulp.task("styles", function() {
  gulp
    .src("sass/**/*.scss")
    .pipe(sass().on("error", sass.logError))
    .pipe(
      autoprefixer({
        browsers: ["last 2 versions"]
      })
    )
    .pipe(gulp.dest("dist/css"))
    .pipe(browserSync.stream());
});
