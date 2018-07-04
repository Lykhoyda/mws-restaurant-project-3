const gulp = require("gulp");
const autoprefixer = require("gulp-autoprefixer");
const concat = require("gulp-concat");
const cssnano = require("gulp-cssnano");
const uglify = require("gulp-uglify");
const babel = require("gulp-babel");
const sourcemaps = require("gulp-sourcemaps");
const imageresize = require("gulp-image-resize");
const pngquant = require("imagemin-pngquant");
const rename = require("gulp-rename");
const del = require("del");
const imagemin = require("imagemin");
const imageminWebp = require("imagemin-webp");
const jimp = require("gulp-jimp-resize");

gulp.task("default", ["styles", "scripts", "images"]);

/* STYLES */
gulp.task("styles", () => {
  return gulp
    .src(["./css/normalize.css", "./css/styles.css"])
    .pipe(autoprefixer("last 2 version"))
    .pipe(cssnano())
    .pipe(concat("style.min.css"))
    .pipe(gulp.dest("./dist/css/"));
});

/* SCRIPTS */
gulp.task("scripts", () => {
  gulp
    .src(["js/offline.js", "lib/idb.js", "js/dbhelper.js", "js/main.js"])
    .pipe(babel({ presets: ["es2015"] }))
    .pipe(concat("main.min.js"))
    .pipe(
      uglify().on("error", e => {
        console.log(e);
      })
    )
    .pipe(gulp.dest("dist/js"));

  gulp
    .src([
      "js/offline.js",
      "lib/rater/index.js",
      "lib/idb.js",
      "js/dbhelper.js",
      "js/restaurant_info.js"
    ])
    .pipe(babel({ presets: ["es2015"] }))
    .pipe(concat("restaurant_info.min.js"))
    .pipe(
      uglify().on("error", e => {
        console.log(e);
      })
    )
    .pipe(gulp.dest("dist/js"));
});

/* IMAGES */
gulp.task("images", () => {
  del(["dist/img/*"]);

  gulp
    .src("img/*.{jpg,png}")
    .pipe(
      jimp({
        sizes: [{ suffix: "md", width: 600 }, { suffix: "sm", width: 320 }]
      })
    )
    .pipe(gulp.dest("dist/"));

  imagemin(["dist/img/*.{jpg,png}"], "dist/img/", {
    use: [imageminWebp({ quality: 80 })]
  }).then(() => {
    console.log("Images optimized");
  });
});
