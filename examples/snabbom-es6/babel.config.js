module.exports = (api) => {
  api.cache(false);

  const envConfig = {
    // 开发环境下
    main: {
      presets: [
        ['@babel/env', {
          targets: {
            browsers: ['last 2 versions', 'safari >= 7', 'not ie <= 8']
          },
          modules: false
        }]
      ]
    },
    // 外链用的
    browser: {
      presets: [
        ['@babel/env', {
          targets: {
            browsers: ['last 2 versions', 'safari >= 7', 'not ie <= 8']
          },
          modules: false
        }]
      ],
      plugins: [['@babel/plugin-transform-runtime', { corejs: 3 }]]
    },
    test: {
      presets: [
        ['@babel/env', { useBuiltIns: false }]
      ]
    }
  };

  return envConfig[process.env.BABEL_ENV];
};
