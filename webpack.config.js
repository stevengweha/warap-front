const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function(env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Ajout d'un loader pour les fichiers de polices (.ttf, .woff, etc)
  config.module.rules.push({
    test: /\.(ttf|woff|woff2|eot)$/,
    use: [
      {
        loader: 'file-loader',
        options: {
          name: '[name].[ext]',
          outputPath: 'fonts/',    // dossier où les fonts seront copiées
          publicPath: '/fonts/',   // chemin public utilisé dans la build
        },
      },
    ],
  });

  return config;
};
