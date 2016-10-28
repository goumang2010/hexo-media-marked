'use strict';

var marked = require('marked');
var assign = require('object-assign');
var stripIndent = require('strip-indent');
var util = require('hexo-util');

var highlight = util.highlight;
var stripHTML = util.stripHTML;
var MarkedRenderer = marked.Renderer;

function Renderer() {
  MarkedRenderer.apply(this);

  this._headingId = {};
  this._levels = [];

}

require('util').inherits(Renderer, MarkedRenderer);

// Add id attribute to headings
Renderer.prototype.heading = function(text, level) {
  var id = anchorId(stripHTML(text));
  var headingId = this._headingId;
  var levels = this._levels;

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

  // record from h2
  for (var i = 2;i <= level;i++) {
    levelflag += (levels[i] ? levels[i]:'1') + '.';;
  }
  levelflag +=' ';
  // Add a number after id if repeated
  if (headingId[id]) {
    id += '-' + headingId[id]++;
  } else {
    headingId[id] = 1;
  }
  // add headerlink
  return '<h' + level + ' id="' + id + '"><a href="#' + id + '" class="headerlink" title="' + stripHTML(text) + '"></a>' + levelflag + text + '</h' + level + '>';
};

function anchorId(str) {
  return util.slugize(str.trim());
}

marked.setOptions({
  langPrefix: '',
  highlight: function(code, lang) {
    return highlight(stripIndent(code), {
      lang: lang,
      gutter: false,
      wrap: false
    });
  }
});

module.exports = function(data, options) {
  return marked(data.text, assign({
    renderer: new Renderer()
  }, this.config.marked, options));
};
