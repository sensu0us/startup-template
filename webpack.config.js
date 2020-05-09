const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { resolve } = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const SvgSpritemapWebpackPlugin = require('svg-spritemap-webpack-plugin');

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production';

  const pages = fs.readdirSync('src')
    .filter((name) => name.includes('.html'))
    .reduce((acc, name) => {
      acc.push(new HtmlWebpackPlugin({
        filename: name,
        template: `src/${name}`,
        minify: false,
      }));

      return acc;
    }, []);

  const cfg = {
    entry: './src/js',
    output: {
      filename: 'js/[name]-[contenthash:5].js',
      path: resolve(__dirname, 'public'),
    },
    optimization: {
      splitChunks: {
        cacheGroups: {
          vendors: {
            name: 'vendors',
            test: /[\\/]node_modules[\\/]/,
            chunks: 'all',
          },
        },
      },
    },
    plugins: [
      new CleanWebpackPlugin(),
      new MiniCssExtractPlugin({
        filename: 'css/[name]-[contenthash:5].css',
      }),
      new SvgSpritemapWebpackPlugin('src/images/to-sprite/*.svg', {
        output: {
          filename: 'images/sprite.svg',
          svgo: {
            plugins: [
              {
                removeAttrs: {
                  attrs: 'fill|stroke|style',
                },
              },
            ],
          },
        },
        sprite: {
          prefix: false,
          generate: {
            title: false,
          },
        },
      }),
      new CopyWebpackPlugin([
        {
          from: 'src/favicons',
          to: 'favicons',
        },
      ]),
      ...pages,
    ],
    module: {
      rules: [
        {
          test: /\.html$/,
          loader: 'html-loader',
        },
        {
          test: /\.s?css$/,
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
              options: {
                publicPath: '../',
              },
            },
            'css-loader',
            {
              loader: 'clean-css-loader',
              options: {
                level: 2,
              },
            },
            {
              loader: 'postcss-loader',
              options: {
                ident: 'postcss',
                plugins: [
                  // eslint-disable-next-line global-require
                  require('autoprefixer')(),
                ],
              },
            },
            'sass-loader',
          ],
        },
        {
          test: /\.js$/,
          exclude: '/node_modules/',
          loader: 'babel-loader',
        },
        {
          test: /\.(gif|jpe?g|png|svg|webp)$/,
          loader: 'url-loader',
          options: {
            name: 'images/[name].[ext]',
            limit: 8192,
          },
        },
        {
          test: /\.woff2?$/,
          loader: 'file-loader',
          options: {
            name: 'fonts/[name].[ext]',
          },
        },
      ],
    },
  };

  if (isProd) return cfg;

  cfg.output.filename = 'js/[name].js';
  cfg.plugins[1] = new MiniCssExtractPlugin({
    filename: 'css/[name].css',
  });
  cfg.module.rules[1].use.splice(2, 2);
  cfg.devtool = 'eval-source-map';
  cfg.devServer = {
    open: true,
    port: 9090,
    compress: true,
    noInfo: true,
    overlay: true,
  };

  return cfg;
};
