import path from 'path'
import ts from 'rollup-plugin-typescript2'
import replace from '@rollup/plugin-replace'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import vue from 'rollup-plugin-vue'
import scss from 'rollup-plugin-scss'
import chalk from 'chalk'
import pkg from './package.json'

const banner = `/*!
  * ${pkg.name} v${pkg.version}
  * (c) ${new Date().getFullYear()} ${pkg.author}
  * @license ${pkg.license}
  */`

// ensure TS checks only once for each build
let hasTSChecked = false

let styleIsGenerated = false

const outputConfigs = {
  // each file name has the format: `dist/${pkg.name}.${format}.js`
  // format being a key of this object
  cjs: {
    file: pkg.main,
    format: 'cjs',
  },
  'esm-bundler': {
    file: pkg.module,
    format: 'es',
  },
  // global: {
  //   file: pkg.unpkg,
  //   format: 'iife',
  // },
  // esm: {
  //   file: pkg.browser || pkg.module.replace('bundler', 'browser'),
  //   format: 'es',
  // },
}

const allFormats = Object.keys(outputConfigs)
// in vue-router there are not that many
const packageFormats = allFormats
const packageConfigs = packageFormats.map(format =>
  createConfig(format, outputConfigs[format])
)

// only add the production ready if we are bundling the options
packageFormats.forEach(format => {
  if (format === 'cjs') {
    packageConfigs.push(createProductionConfig(format))
  } /*else if (format === 'global') {
    packageConfigs.push(createMinifiedConfig(format))
  }*/
})

export default packageConfigs

function createConfig(format, output, plugins = []) {
  if (!output) {
    console.log(chalk.yellow(`invalid format: "${format}"`))
    process.exit(1)
  }

  output.sourcemap = !!process.env.SOURCE_MAP
  output.banner = banner
  output.externalLiveBindings = false
  output.globals = {
    vue: 'Vue',
    // devtools are not global in iife
    // '@vue/devtools-api': 'VueDevtoolsApi',
  }

  const isProductionBuild = /\.prod\.js$/.test(output.file)
  // const isGlobalBuild = format === 'global'
  const isRawESMBuild = format === 'esm'
  const isNodeBuild = format === 'cjs'
  const isBundlerESMBuild = /esm-bundler/.test(format)

  // if (isGlobalBuild) output.name = 'HelloModule'

  const shouldEmitDeclarations = !hasTSChecked

  const tsPlugin = ts({
    check: !hasTSChecked,
    tsconfig: path.resolve(__dirname, 'tsconfig.json'),
    cacheRoot: path.resolve(__dirname, 'node_modules/.rts2_cache'),
    tsconfigOverride: {
      compilerOptions: {
        sourceMap: output.sourcemap,
        declaration: shouldEmitDeclarations,
        declarationMap: shouldEmitDeclarations,
      },
      exclude: [ '__tests__', 'test-dts' ],
    },
  })
  // we only need to check TS and generate declarations once for each build.
  // it also seems to run into weird issues when checking multiple times
  // during a single build.
  hasTSChecked = true

  // generate styles only for first build
  const scssOptions = {}
  if (styleIsGenerated === false)
    styleIsGenerated = true
  else
    scssOptions.output = false

  const external = [ 'vue' ]
  // if (!isGlobalBuild) {
  //   external.push('@vue/devtools-api')
  // }

  const nodePlugins = [ resolve(), commonjs() ]

  return {
    input: 'src/index.ts',
    // Global and Browser ESM builds inlines everything so that they can be
    // used alone.
    external,
    plugins: [
      scss({
        ...scssOptions,
        outputStyle: 'compressed',
      }),
      vue(),
      tsPlugin,
      createReplacePlugin(
        isProductionBuild,
        isBundlerESMBuild,
        // isBrowserBuild?
        isRawESMBuild || isBundlerESMBuild,
        isNodeBuild
      ),
      ...nodePlugins,
      ...plugins,
    ],
    output,
    // onwarn: (msg, warn) => {
    //   if (!/Circular/.test(msg)) {
    //     warn(msg)
    //   }
    // },
  }
}

function createReplacePlugin(
  isProduction,
  isBundlerESMBuild,
  isBrowserBuild,
  isNodeBuild
) {
  const replacements = {
    __COMMIT__: `"${process.env.COMMIT}"`,
    __VERSION__: `"${pkg.version}"`,
    __DEV__: isBundlerESMBuild
      ? // preserve to be handled by bundlers
      '(process.env.NODE_ENV !== \'production\')'
      : // hard coded dev/prod builds
      JSON.stringify(!isProduction),
    // this is only used during tests
    __TEST__: 'false',
    // If the build is expected to run directly in the browser (global / esm builds)
    __BROWSER__: isBrowserBuild,
    __FEATURE_PROD_DEVTOOLS__: isBundlerESMBuild
      ? '__VUE_PROD_DEVTOOLS__'
      : 'false',
    // is targeting bundlers?
    __BUNDLER__: JSON.stringify(isBundlerESMBuild),
    __GLOBAL__: JSON.stringify(false),
    // is targeting Node (SSR)?
    __NODE_JS__: JSON.stringify(isNodeBuild),
  }
  // allow inline overrides like
  //__RUNTIME_COMPILE__=true yarn build
  Object.keys(replacements).forEach(key => {
    if (key in process.env) {
      replacements[key] = process.env[key]
    }
  })
  return replace({
    preventAssignment: true,
    values: replacements,
  })
}

function createProductionConfig(format) {
  return createConfig(format, {
    file: `dist/${pkg.name}.${format}.prod.js`,
    format: outputConfigs[format].format,
  })
}

// function createMinifiedConfig(format) {
//   const { terser } = require('rollup-plugin-terser')
//   return createConfig(
//     format,
//     {
//       file: `dist/index.${format}.prod.js`,
//       format: outputConfigs[format].format,
//     },
//     [
//       terser({
//         module: /^esm/.test(format),
//         compress: {
//           ecma: 2015,
//           pure_getters: true,
//         },
//       }),
//     ]
//   )
// }
