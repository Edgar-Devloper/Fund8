const webpack = require('webpack');
const path = require('path');
const packageJson = require('./package.json');

module.exports = function override(config, env) {
  // Inyectar versión del package.json como variable de entorno
  config.plugins.push(
    new webpack.DefinePlugin({
      'process.env.REACT_APP_VERSION': JSON.stringify(packageJson.version),
    })
  );
  // Deshabilitar warnings para compilacion mas rapida
  config.ignoreWarnings = [
    /Failed to parse source map/,
    /Module not found/,
    /Can't resolve/,
    /Critical dependency/,
    /export .* was not found in/,
  ];

  // Reducir verbosidad de webpack - usar preset minimal para menos output
  config.stats = 'minimal';

  // Deshabilitar ESLint durante compilacion para mas velocidad
  const eslintRuleIndex = config.module.rules.findIndex(
    rule => rule.enforce === 'pre' && rule.use && rule.use.some(use => use.loader && use.loader.includes('eslint-loader'))
  );
  if (eslintRuleIndex !== -1) {
    config.module.rules.splice(eslintRuleIndex, 1);
  }

  // Deshabilitar source maps en desarrollo para compilacion mas rapida (opcional)
  if (env === 'development') {
    config.devtool = false; // o 'eval-cheap-module-source-map' para algo mas rapido
  }

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

