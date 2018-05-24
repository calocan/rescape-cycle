import path from 'path';
import webpack from 'webpack';

module.exports = {
    devtool: 'inline-source-map',
    entry: [
      path.resolve(path.join(__dirname, '/index.js'))
    ],
    resolve: {
      modules: [

        'node_modules'
      ],
    },
    output: {
      path: path.join(__dirname, '/dist/'),
      filename: 'index.js',
      publicPath: '/'
    }
};
