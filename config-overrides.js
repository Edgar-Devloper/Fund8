const webpack = require('webpack');
const path = require('path');

module.exports = function override(config, env) {
  // Polyfills para Node.js modules (ethers.js)
  config.resolve.fallback = {
    ...config.resolve.fallback,
    fs: false,
    net: false,
    tls: false,
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    url: require.resolve('url'),
    zlib: require.resolve('browserify-zlib'),
    http: require.resolve('stream-http'),
    https: require.resolve('https-browserify'),
    assert: require.resolve('assert'),
    os: require.resolve('os-browserify/browser'),
    path: require.resolve('path-browserify'),
    buffer: require.resolve('buffer'),
  };

  config.plugins.push(
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser.js',
    })
  );

  // Resolver para rutas de imágenes en SCSS
  config.resolve.alias = {
    ...config.resolve.alias,
    './images': path.resolve(__dirname, 'src/images'),
    '../images': path.resolve(__dirname, 'src/images'),
  };

  // Fix para Swiper y lightgallery - ignorar módulos de imágenes problemáticos
  config.plugins.push(
    new webpack.NormalModuleReplacementPlugin(
      /^\.\/images\/index\.js$/,
      (resource) => {
        if (resource.context && resource.context.includes('swiper')) {
          resource.request = path.resolve(__dirname, 'node_modules/swiper/core/images/index.js');
        }
      }
    ),
    new webpack.NormalModuleReplacementPlugin(
      /\.\.\/images\/loading\.gif$/,
      path.resolve(__dirname, 'src/images/1.jpg') // Usar una imagen existente como fallback
    )
  );

  // Alias para paths de TypeScript
  config.resolve.alias = {
    ...config.resolve.alias,
    '@': path.resolve(__dirname, 'src'),
  };

  // Configurar SVGR y Babel para permitir namespaces en SVG
  // Buscar regla oneOf que contiene las reglas de SVG
  const oneOfRule = config.module.rules.find((rule) => rule.oneOf);
  
  if (oneOfRule && oneOfRule.oneOf) {
    oneOfRule.oneOf.forEach((rule) => {
      if (rule.test && rule.test.toString().includes('svg')) {
        // Si la regla usa SVGR (múltiples loaders)
        if (rule.use && Array.isArray(rule.use)) {
          rule.use.forEach((use) => {
            if (use && use.loader && typeof use.loader === 'string' && use.loader.includes('@svgr/webpack')) {
              // Configurar SVGR para permitir namespaces
              if (!use.options) use.options = {};
              use.options.throwIfNamespace = false;
              
              // Configurar babel dentro de SVGR
              if (!use.options.babelConfig) {
                use.options.babelConfig = {};
              }
              if (!use.options.babelConfig.plugins) {
                use.options.babelConfig.plugins = [];
              }
              
              // Agregar plugin para desactivar validación de namespaces
              const existingPlugin = use.options.babelConfig.plugins.find(
                (p) => Array.isArray(p) && p[0] && p[0].includes('transform-react-jsx')
              );
              
              if (!existingPlugin) {
                use.options.babelConfig.plugins.push([
                  '@babel/plugin-transform-react-jsx',
                  { throwIfNamespace: false }
                ]);
              } else {
                existingPlugin[1] = existingPlugin[1] || {};
                existingPlugin[1].throwIfNamespace = false;
              }
            }
          });
        }
      }
    });
  }

  return config;
};

