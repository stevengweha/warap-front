const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function(env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Gérer les fonts (ttf, woff, etc)
  config.module.rules.push({
    test: /\.(ttf|woff|woff2|eot)$/,
    use: [
      {
        loader: require.resolve('file-loader'),
        options: {
          name: '[name].[ext]',
          outputPath: 'fonts/',  // police copiée dans dist/fonts
          publicPath: '/fonts/', // accès via /fonts/
        },
      },
    ],
  });

  return config;
};
