const path = require('path');
const webpack = require('webpack');

module.exports = {
   entry: './public/javascripts/site.js',
   output: {
       path: path.resolve(__dirname, 'public/javascripts/build'),
       filename: 'site.bundle.js'
   },
   module: {
    loaders: [
       {
         test: /\.js$/,
         loader: 'babel-loader',
         query: {
           presets: ['es2015']
         }
       }
    ]
  }
};