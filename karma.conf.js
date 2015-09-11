module.exports = function(config) {
  config.set({

    // web server port
    port: 9876,

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jspm', 'jasmine'],


    jspm: {
      loadFiles: ['src/**/*.spec.js'],
      serveFiles: ['src/*/{*.ts,!(spec)/**/*.ts}',
        'src/*/{*.js,!(it|spec)/**/*.js}'],
      paths: {
        "coreweb/api/*": "src/api/*",
        "rule-engine/*": "src/view/components/rule-engine/*",
        "src/*": "src/*.js"
      }
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', 'junit'],

    // Configure the output for the junit reporter.
    junitReporter: {
      outputDir: 'build/karma', // results will be saved as $outputDir/$browserName.xml
      outputFile: undefined, // if included, results will be saved as $outputDir/$browserName/$outputFile
      suite: '' // suite will become the package name attribute in xml testsuite element
    },

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    client: {
      // Use the debug console.
      captureConsole: false
    },

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: [
      'ChromeSized'
    ],
    customLaunchers: {
      ChromeSized: {
        base: 'Chrome',
        flags: ['--window-size=1500,1000']
      }
    },


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,
    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,
    autoWatchBatchDelay: 2000,

    // may cause issues on some operating systems
    usePolling: false

  });
};