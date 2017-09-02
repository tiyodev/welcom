// Sass configuration
const gulp = require('gulp');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');

gulp.task('sass', () => {
  gulp.src('./public/scss/main.scss')
    .pipe(sass())
    .pipe(autoprefixer())
    .pipe(gulp.dest(f => `${f.base}\\..\\css\\`));
});

gulp.task('default', ['sass'], () => {
  gulp.watch(['./public/scss/*.scss'], ['sass']);
});
