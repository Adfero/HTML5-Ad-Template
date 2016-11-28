const jsdom = require('jsdom');
const fs = require('fs-extra');
const async = require('async');
const path = require('path');
const log4js = require('log4js');
const logger = log4js.getLogger();
const pkg = require('./package');

const argv = require('minimist')(process.argv.slice(2),{
  'default': {
    'in': null,
    'out': 'ad',
    'border': false,
    'configure': true,
    'background': 'white',
    'title': null
  }
});

if (!argv.in || !argv.out) {
  console.error('Please provide --in and --out arguments!');
} else {
  const inFile = path.resolve(argv.in);
  const inDir = path.dirname(argv.in);

  async.waterfall([
    function(next) {
      logger.info('Importing HTML file ' + inFile);
      fs.readFile(inFile,'UTF-8',next);
    },
    function(fileContents,next) {
      jsdom.env(fileContents,[],next);
    },
    function(window,next) {
      async.parallel({
        'importedCss': function(next1) {
          captureImportedCSS(inFile,inDir,window,next1);
        },
        'embeddedCss': function(next1) {
          captureEmbeddedCSS(inFile,inDir,window,next1);
        },
        'html': function(next1) {
          captureHTML(inFile,inDir,window,next1);
        }
      },function(err,parts) {
        next(err,window,parts);
      });
    },
    function(window,parts,next) {
      async.parallel({
        'css': function(next1) {
          outputCSS(parts.importedCss.concat(parts.embeddedCss),next1);
        },
        'html': function(next1) {
          outputHTML(parts.html,next1);
        }
      },function(err) {
        next(err,window);
      });
    },
    function(window,next) {
      const imagesSrc = path.join(inDir,'assets');
      const imagesDest = path.join(__dirname,'assets',argv.out);
      logger.info('Importing assets from ' + imagesSrc + ' to ' + imagesDest);
      fs.copy(imagesSrc,imagesDest,function(err) {
        next(err,window);
      });
    },
    function(window,next) {
      if (argv.configure) {
        buildConfiguration(window,function(err) {
          next(err);
        });
      } else {
        next();
      }
    }
  ],function(err) {
    if (err) {
      console.error(err);
      process.exit(-1);
    } else {
      console.log(inFile + ' successfully imported to ' + argv.out + '.');
      process.exit(0);
    }
  });
}

function captureImportedCSS(inFile,inDir,window,done) {
  async.parallel(
    makeArray(window.document.querySelectorAll('link[rel="stylesheet"]')).map(function(domElement) {
      return function(next) {
        if (domElement.href.indexOf('http') == 0) {
          next(null,{
            'source': domElement.href,
            'contents': '@import url("' + domElement.href + '");'
          });
        } else {
          const styleSheetPath = path.join(inDir,domElement.href);
          logger.info('Importing stylesheet ' + styleSheetPath);
          fs.readFile(styleSheetPath,'UTF-8',function(err,contents) {
            next(err,{
              'source': domElement.href,
              'contents': contents
            });
          });
        }
      }
    }),
    done
  )
}

function captureEmbeddedCSS(inFile,inDir,window,done) {
  const styles = makeArray(window.document.querySelectorAll('style[type="text/css"]')).map(function(domElement,i) {
    logger.info('Importing embedded stylesheet ' + i);
    return {
      'source': 'HTML',
      'contents': domElement.textContent
    }
  });
  done(null,styles);
}

function captureHTML(inFile,inDir,window,done) {
  done(null,window.document.querySelector('#page1').outerHTML);
}

function outputCSS(cssArray,done) {
  const cssPath = path.join(__dirname,'scss',argv.out+'.scss');
  logger.info('Exporting CSS to ' + cssPath);
  var css = cssArray
    .map(function(css) {
      return '/* ' + css.source + ' */\n' + css.contents;
    })
    .join('\n\n')
    .replace(/\.gwd-play-animation/g,'');
  fs.writeFile(cssPath,css,done);
}

function outputHTML(adHtml,done) {
  var html = [
    '<!DOCTYPE html>',
    '<html>',
    '<head>',
    '  <meta charset="utf-8" />',
    '  <meta name="viewport" content="width=device-width, initial-scale=1" />',
    '  <script src="scripts/EBLoader.js"></script>',
    '  <script src="scripts/script.js"></script>',
    '  <style type="text/css"><%if (size.border) { %>#ad{border: 1px solid #000000;}<% } %>#ad,#banner {width:<%= size.border ? size.width-2 : size.width; %>px;height:<%= size.border ? size.height-2 : size.height; %>px;}</style>',
    '  <link href="styles/styles.css" rel="stylesheet" />',
    '</head>',
    '<body>',
    '  <div id="ad">',
    adHtml,
    '  </div>',
    '</body>',
    '</html>'
  ];
  const htmlPath = path.join(__dirname,'ejs',argv.out+'.ejs');
  logger.info('Exporting HTML to ' + htmlPath);
  var htmlTxt = html
    .join('\n')
    .replace(/assets\//g,'assets/' + argv.out + '/')
    .replace(/source="/g,'src="');
  fs.writeFile(htmlPath,htmlTxt,done);
}

function makeArray(domArray) {
  var array = [];
  for(var i = 0 ; i < domArray.length; i++) {
    array[i] = domArray[i];
  }
  return array;
}

function buildConfiguration(window,done) {
  const width = parseInt(window.document.querySelector('#page1[data-gwd-width]').getAttribute('data-gwd-width'));
  const height = parseInt(window.document.querySelector('#page1[data-gwd-height]').getAttribute('data-gwd-height'))
  logger.info('Updating package.json');
  var configuration = {
    'name': argv.out,
    'files': {
      'ejs': argv.out+'.ejs',
      'scss': argv.out+'.scss',
      'js': 'script.js'
    },
    'size': {
      'width': width,
      'height': height,
      'border': argv.border
    },
    'background': argv.background,
    'title': argv.title ? argv.title : ('Imported from ' + argv.in)
  };
  var index = pkg.ads.findIndex(function(ad) {
    return ad.name == argv.out;
  });
  if (index >= 0) {
    pkg.ads[index] = configuration;
  } else {
    pkg.ads.push(configuration);
  }
  fs.writeFile('./package.json',JSON.stringify(pkg,null,'  '),done);
}
