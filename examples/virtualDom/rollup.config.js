import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import globals from 'rollup-plugin-node-globals';
import babel from 'rollup-plugin-babel';
import { uglify } from 'rollup-plugin-uglify';
import pkg from './package.json';

const pkgName = pkg.name.includes('/') ? pkg.name.split('/')[1] : pkg.name;

const commPlugins = [
  // so Rollup can find npm package
  resolve({
    mainFields: ['module', 'main', 'browser']
  }),
  // so Rollup can convert dependencies package to an ES module
  commonjs(),
  // Plugin to insert node globals including so code that works
  // with browserify should work even if it uses process or buffers.
  globals(),
  babel({
    exclude: ['node_modules/**'],
    runtimeHelpers: true
  })
];

const config = {
  umdTarget: {
    input: 'src/index.js',
    external: [], // dependencies package name
    output: {
      // package-name --> packageName
      name: pkgName.replace(/-\w/g, m => m[1].toUpperCase()),
      file: `dist/${pkgName}.umd.js`,
      format: 'umd'
    },
    plugins: [
      ...commPlugins
    ]
  },
  umdUglifyTarget: {
    input: 'src/index.js',
    external: [], // dependencies package name
    output: {
      // package-name --> packageName
      name: pkgName.replace(/-\w/g, m => m[1].toUpperCase()),
      file: `dist/${pkgName}.umd.min.js`,
      format: 'umd'
    },
    plugins: [
      ...commPlugins,
      uglify()
    ]
  },
  cjsTarget: {
    input: 'src/index.js',
    external: [], // dependencies package name
    output: [
      { file: `dist/${pkgName}.cjs.js`, format: 'cjs' }
    ],
    plugins: [
      ...commPlugins
    ]
  }
};

const babelEnv = process.env.BABEL_ENV;

const targets = [];
if (babelEnv === 'browser') {
  targets.push(config.umdTarget);
  targets.push(config.umdUglifyTarget);
} else if (babelEnv === 'main') {
  targets.push(config.cjsTarget);
}

export default targets;
