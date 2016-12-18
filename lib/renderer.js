'use strict';

var marked = require('marked');
var assign = require('object-assign');
var stripIndent = require('strip-indent');
var util = require('hexo-util');

var hljs = require('highlight.js');
var stripHTML = util.stripHTML;
var MarkedRenderer = marked.Renderer;

function Renderer() {
  MarkedRenderer.apply(this);

  this._catalog = {level:0, children: []};
  this._levels = [];

}

require('util').inherits(Renderer, MarkedRenderer);

// Add id attribute to headings
Renderer.prototype.heading = function(text, level) {
  var id = anchorId(stripHTML(text));
  var headingId = this._headingId;
  var levels = this._levels;
  var catalog = this._catalog;

  if (levels[level]) {
    levels[level]++;
  } else {
    levels[level] = 1;
  }
  var len = levels.length;
  for (var k = level + 1; k < len;k++) {
    if (levels[k]) {
      levels[k] = 0;
    }
  }

  var levelflag = '';

  // record from h1
  for (var i = 1;i <= level;i++) {
    levelflag += (levels[i] ? levels[i]: (levels[i] = 1)) + '.';;
  }

  // record title structure
  // find thr right object
  var cur = catalog;
  for (var j = 1; j < level; j++) {
    var index = (levels[j] || 1) - 1;
    if(!(cur.children[index])) {
      cur.children[index] = {level: j, children: []};
    }
    cur = cur.children[index];
  }
  
  var striptext = stripHTML(text);
  cur.children.push({
    level: level,
    flag: levelflag,
    text: striptext,
    children: []
  });

  // add headerlink
  return '<h' + level + ' id="' + levelflag + '"><a href="#' + levelflag + '" class="headerlink" title="' + striptext + '"></a>' + levelflag + ' ' + text + '</h' + level + '>';
};

hljs.configure({
  tabReplace: '    ',
  classPrefix: 'hljs-'
})

Renderer.prototype.code = function(code, language){
  return '<pre><code class="hljs ' + (language || '') + '">' + 
     hljs.highlightAuto(code).value +
    '</code></pre>';
};

function anchorId(str) {
  return util.slugize(str.trim());
}

marked.setOptions({
  langPrefix: ''
});

function genCata(catalog) {
  var len = catalog.children.length;
  if(len) {
    var res = catalog.flag ? '<li class="level-'+ catalog.level+'"><a href="#' +catalog.flag+'"><span class="tocnumber">'+catalog.flag+'</span>&nbsp<span class="toctext">'+catalog.text+'</span></a><ul>' : '<ul>';
    for(var i = 0;i < len;i++) {
      if (catalog.children[i]) {
        res += genCata(catalog.children[i]);
      }
    }
    res += '</ul>';
    if(catalog.flag) {
      res += '</li>';
    }
    return res;
  } else {
    return catalog.flag ? '<li class="level-'+ catalog.level+'">'+ '<a href="#' +catalog.flag+'"><span class="tocnumber">'+catalog.flag+'</span>&nbsp<span class="toctext">'+catalog.text+'</span></a></li>': '';
  }
}

module.exports = function(data, options) {
  var renderer = new Renderer();
  delete options.highlight
  var result = marked(data.text, assign({
    renderer: renderer
  }, this.config.marked, options));
  // generate catalog
  var fi = result.search(/<h[1-9]/i);
  if (fi !== -1) {
    result = result.substring(0, fi) + '<div class="toc">' + genCata(renderer._catalog) + '</div>' + result.substring(fi);
  }
  return result;
};
