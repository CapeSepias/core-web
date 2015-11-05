"use strict";


var glob = require('glob')
var fs = require('fs')
var gulp = require('gulp')
var del = require('del')
var minimist = require('minimist')
var replace = require('gulp-replace')
var ts = require('gulp-typescript');
var karmaServer = require('karma').Server

var config = {
  appProtocol: 'http',
  appHostname: 'localhost',
  appPort: 9000,
  proxyProtocol: 'http',
  proxyHostname: 'localhost',
  proxyPort: 8080,
  buildDir: './build',
  distDir: __dirname + '/dist',
  srcDir: './src',
  buildTarget: 'dev'

}
config.appHost = config.appProtocol + '://' + config.appHostname + ':' + config.appPort
config.proxyHost = config.proxyProtocol + '://' + config.proxyHostname + ':' + config.proxyPort


var minimistCliOpts = {
  string: ['open'],
  alias: {
    'open': ['o']
  },
  default: {
    open: false,
    env: process.env.NODE_ENV || 'production'
  }
};
config.args = minimist(process.argv.slice(2), minimistCliOpts)

var typescriptProject = ts.createProject(config.srcDir + '/tsconfig.json');

var project = {
  server: null,

  clean: function (cb) {
    console.log("Starting 'Clean'")
    del.sync([config.distDir, config.buildDir, './gh_pages'])
    console.log("Finished 'Clean'")
    cb()
  },

  compileJavascript: function (cb) {
    cb()
  },

  /**
   *
   */
  compileTypescript: function (cb) {
    var tsResult = typescriptProject.src().pipe(ts(typescriptProject));

    var x = tsResult.js.pipe(gulp.dest('build'))
    var y = tsResult.dts.pipe(gulp.dest('build/definitions'))

    // ignoring typscript definitions for now.
    x.on('finish', cb)
    x.on('error', cb)
  },

  compileStyles: function (cb) {
    var sass = require('gulp-sass')
    var sourcemaps = require('gulp-sourcemaps');
    gulp.src('./src/**/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass({outputStyle: config.buildTarget === 'dev' ? 'expanded' : 'compressed'}))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(config.buildDir)).on('finish', cb);
  },

  callbackOnCount: function (count, cb) {
    return function () {
      if (--count === 0) {
        cb()
      }
    }
  },

  compileStatic: function (cb) {

    var done = project.callbackOnCount(2, cb)
    var gitRev = require('git-rev')
    gulp.src('./src/**/*.{js,css,eot,svg,ttf,woff,woff2,png}').pipe(gulp.dest(config.buildDir)).on('finish', done);
    gitRev.short(function (rev) {
      gulp.src([config.srcDir + '/**/*.html'])
          .pipe(replace(/\$\{build.revision\}/, rev))
          .pipe(replace(/\$\{build.date\}/, new Date().toISOString()))
          .pipe(gulp.dest(config.buildDir)).on('finish', done);
    })
  },

  compile: function (cb) {
    var done = project.callbackOnCount(4, cb, 'compile')
    project.compileJavascript(done)
    project.compileTypescript(done)
    project.compileStyles(done)
    project.compileStatic(done)
  },

  packageRelease: function (done) {
    project.clean(function () {
      project.compile(function () {
        var outPath = config.distDir + '/core-web.zip'
        if (!fs.existsSync(config.distDir)) {
          fs.mkdirSync(config.distDir)
        }
        var output = fs.createWriteStream(outPath)
        var archiver = require('archiver')
        var archive = archiver.create('zip', {})

        output.on('close', function () {
          console.log("Archive Created: " + outPath + ". Size: " + archive.pointer() / 1000000 + 'MB')
          done()
        });

        archive.on('error', function (err) {
          done(err)
        });

        archive.pipe(output);

        archive.directory('./build', '.').finalize()

      })
    })
  },

  watch: function () {
    gulp.watch('./src/**/*.html', ['compile-templates']);
    gulp.watch('./src/**/*.js', ['compile-js']);
    gulp.watch('./src/**/*.ts', ['compile-ts']);
    return gulp.watch('./src/**/*.scss', ['compile-styles']);
  },

  /**
   * Configure the proxy and start the webserver.
   */
  startServer: function () {
    var http = require('http');
    var proxy = require('proxy-middleware');
    var connect = require('connect');
    var serveStatic = require('serve-static');
    var serveIndex = require('serve-index');
    var open = require('open');
    var url = require('url');

    var proxyBasePaths = [
      'admin',
      'html',
      'api',
      'c',
      'dwr',
      'DotAjaxDirector'
    ]

    var app = connect();

    // proxy API requests to the node server
    proxyBasePaths.forEach(function (pathSegment) {
      var target = config.proxyHost + '/' + pathSegment;
      var proxyOptions = url.parse(target)
      proxyOptions.route = '/' + pathSegment
      proxyOptions.preserveHost = true
      app.use(function (req, res, next) {
        if (req.url.indexOf('/' + pathSegment + '/') === 0) {
          console.log("Forwarding request: ", req.url)
          proxy(proxyOptions)(req, res, next)
        } else {
          next()
        }
      })
    })
    app.use(serveStatic('./'))
    app.use(serveIndex('./'))

    project.server = http.createServer(app)
        .listen(config.appPort)
        .on('listening', function () {
          console.log('Started connect web server on ' + config.appHost)
          if (config.args.open) {
            var openTo = config.args.open === true ? '/index-dev.html' : config.args.open
            console.log('Opening default browser to ' + openTo, config.args)
            open(config.appHost + openTo)
          }
          else {
            console.log("add the '-o' flag to automatically open the default browser")
          }
        })
  },

  stopServer: function (callback) {
    project.server.close(callback)
  },

  rewriteJspmConfigForUnitTests: function (cb) {
    var inFile = __dirname + '/config.js'
    var outFile = __dirname + '/config-karma.local.js'
    var fs = require('fs')
    fs.readFile(inFile, 'utf8', function (err, data) {
      if (err) {
        console.log("It broke: ", err);
        cb(err)
      }
      var result = data.replace(/baseURL/g, '// baseURL');

      fs.writeFile(outFile, result, 'utf8', function (err) {
        if (err) {
          console.log("It broke while writing: ", err);
          cb(err)
        }
        cb()
      });
    });

  },

  runTests: function (singleRun, intTests, callback) {
    var configFile = __dirname + (intTests === true ? '/karma-it.conf.js' : '/karma.conf.js')
    new karmaServer({
      configFile: configFile,
      singleRun: singleRun
    }, callback).start()
  }
}

gulp.task('test', [], function (done) {
  project.rewriteJspmConfigForUnitTests(function (err) {
    if (err) {
      done(err)
    }
    project.runTests(true, false, done)
  });
})

gulp.task('itest', function (done) {
  project.startServer()
  project.runTests(true, true, function () {
    project.stopServer(done)
  })
})


gulp.task('tdd', function () {
  project.watch(true, false)
  return project.runTests(false, false)
})

gulp.task('itdd', ['dev-watch'], function (done) {
  project.startServer()
  project.runTests(false, true, function () {
    project.stopServer(done)
  })
})

gulp.task('start-server', function (done) {
  project.startServer()
  done()
})


/**
 *  Deploy Tasks
 */
gulp.task('package', [], function (done) {
  project.packageRelease(done)
});

var generatePom = function (baseDeployName, groupId, artifactId, version, packaging, callback) {
  var pom = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<project xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd" xmlns="http://maven.apache.org/POM/4.0.0"',
    'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"> <modelVersion>4.0.0</modelVersion>',
    '<groupId>' + groupId + '</groupId>',
    '<artifactId>' + artifactId + '</artifactId>',
    '<version>' + version + '</version>',
    '<packaging>' + packaging + '</packaging>',
    '</project>']

  var outDir = config.distDir
  var outPath = outDir + '/' + artifactId + '.pom'
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir)
  }

  fs.writeFile(outPath, pom.join('\n'), function (err) {
    if (err) {
      callback(null, err)
      return
    }
    console.log('Wrote pom to ', outPath);
    callback(outPath)
  });

}

gulp.task('publish-snapshot', ['package'], function (done) {
  var artifactoryUpload = require('gulp-artifactory-upload');
  var getRev = require('git-rev')
  var config = require('./deploy-config.js').artifactory.snapshot

  var mvn = {
    group: 'com.dotcms',
    artifactId: 'core-web',
    version: require('./package.json').version
  }

  getRev.short(function (rev) {
    var versionStr = mvn.version + '-SNAPSHOT';
    var baseDeployName = 'core-web-' + versionStr
    var deployName = baseDeployName + ".zip"
    var artifactoryUrl = config.url + '/' + mvn.group.replace('.', '/') + '/' + mvn.artifactId + '/' + versionStr

    console.log("Deploying artifact: PUT ", artifactoryUrl + '/' + deployName)

    var pomPath;

    generatePom(baseDeployName, mvn.group, mvn.artifactId, versionStr, 'zip', function (path, err) {
      if (err) {
        done(err)
        return;
      }
      console.log('setting pomPath to: ', path)
      pomPath = path
      gulp.src(['./dist/core-web.zip', pomPath])
          .pipe(artifactoryUpload({
            url: artifactoryUrl,
            username: config.username,
            password: config.password,
            rename: function (filename) {
              return filename.replace(mvn.artifactId, baseDeployName)
            }
          }))
          .on('error', function (err) {
            throw err
          }).on('end', function () {
        console.log("All done.")
      })
    })
  })

});

gulp.task('ghPages-clone', ['package'], function (done) {
  var exec = require('child_process').exec;

  var options = {
    cwd: __dirname,
    timeout: 300000
  }
  if (fs.existsSync(__dirname + '/gh_pages')) {
    del.sync('./gh_pages')
  }
  exec('git clone -b gh-pages git@github.com:dotCMS/core-web.git gh_pages', options, function (err, stdout, stderr) {
    console.log(stdout);
    if (err) {
      done(err)
      return;
    }
    del.sync(['./gh_pages/**/*', '!./gh_pages/.git'])
    gulp.src('./dist/**/*').pipe(gulp.dest('./gh_pages')).on('finish', function () {
      done()
    })
  })
})

gulp.task('publish-github-pages', ['ghPages-clone'], function (done) {
  var exec = require('child_process').exec;

  var options = {
    cwd: __dirname + '/gh_pages',
    timeout: 300000
  }

  var gitAdd = function (opts) {
    console.log('adding files to git.')
    exec('git add .', opts, function (err, stdout, stderr) {
      console.log(stdout);
      if (err) {
        console.log(stderr);
        done(err);
      } else {
        gitCommit(opts)
      }

    })
  }

  var gitCommit = function (opts) {
    exec('git commit -m "Autobuild gh-pages..."', opts, function (err, stdout, stderr) {
      console.log(stdout);
      if (err) {
        console.log(stderr);
        done(err);
      } else {
        gitPush(opts)
      }
    })
  }

  var gitPush = function (opts) {
    exec('git push -u  origin gh-pages', opts, function (err, stdout, stderr) {
      if (err) {
        console.log(stderr);
        done(err);
      } else {
        done()
      }
    })
  }
  gitAdd(options)
})


gulp.task('copy-dist-main', [], function (done) {
  var gitRev = require('git-rev')

  gitRev.short(function (rev) {
    console.log("Revision is: ", rev)
    var result = gulp.src([config.buildDir + '/index.html'])
        .pipe(replace(/\$\{build.revision\}/, rev))
        .pipe(replace(/\$\{build.date\}/, new Date().toISOString()))
        .pipe(gulp.dest(config.distDir))
    done()
  })

})


gulp.task('copy-dist-all', ['copy-dist-main'], function () {
  return gulp.src(['./build/*.js', './build/*.map']).pipe(replace("./dist/core-web.sfx.js", './core-web.sfx.js')).pipe(gulp.dest(config.distDir))
})

gulp.task('compile-ts', function (cb) {
  project.compileTypescript(cb)
});


gulp.task('compile-styles', function (done) {
  project.compileStyles(done)
});

gulp.task('compile-js', function (done) {
  project.compileJavascript(done)
})

gulp.task('compile-templates', [], function (done) {
  project.compileStatic(done)
})

gulp.task('compile', [], function (done) {
  project.compile(done)
})

gulp.task('watch', ['package'], function () {
  return project.watch()
});

gulp.task('publish', ['publish-github-pages', 'publish-snapshot'], function (done) {
  done()
})

//noinspection JSUnusedLocalSymbols
gulp.task('play', ['serve'], function (done) {
  console.log("This task will be removed in the next iteration, use 'gulp serve' instead.")
})

gulp.task('serve', ['start-server', 'watch'], function (done) {
  // if 'done' is not passed in this task will not block.
})

gulp.task('build', ['package'], function (done) {
})

gulp.task('clean', [], function (done) {
  project.clean(done)
})

gulp.task('default', function (done) {
  done()
});