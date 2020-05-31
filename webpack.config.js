const webpack = require('webpack');

const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const pathBuilder = require('path');

const libsPath = pathBuilder.resolve('src','libs', 'index.ts');

const entryPath = pathBuilder.resolve('src', 'index.ts');

const targetPath = pathBuilder.resolve('dist');

function entry(mode) {
    return {
        mode: mode ? (mode === 'analyze' ? 'production' : mode) : 'production',
        devtool: false,
        entry: {
            libs:libsPath,
            ['libs.min']: libsPath,
            ['type-qs']: entryPath,
            ['type-qs.min']: entryPath
        },
        output: {
            path: targetPath,
            filename: '[name].js',
            library: 'typeQs',
            libraryTarget: 'umd'
        },
        optimization: {
            noEmitOnErrors: true,
            minimize: true,
            minimizer: [
                new UglifyJsPlugin({
                    include: /\.min\.js$/,
                }),
            ],
            namedChunks: true
        },
        resolve: {
            extensions: ['.js', '.ts', '.tsx', '.json', 'txt']
        },
        module: {
            rules: [
                {
                    test: /\.js$|\.ts$|\.tsx$/,
                    exclude: /(node_modules|bower_components)/,
                    use: [
                        {
                            loader: 'babel-loader',
                            options: {
                                cacheDirectory: true,
                                plugins: [
                                    ["@babel/plugin-transform-runtime"],
                                    ['@babel/plugin-proposal-decorators', {legacy: true}],
                                    ['@babel/plugin-proposal-export-namespace-from'],
                                    [
                                        '@babel/plugin-proposal-class-properties',
                                        {loose: true},
                                    ]
                                ],
                                presets: [
                                    [
                                        '@babel/preset-env',
                                        {
                                            modules: false,
                                            targets:{
                                                ie:"8"
                                            }
                                        }
                                    ],
                                ]
                            }
                        },
                        "ts-loader"
                    ]
                }
            ]
        },
        plugins: [
            new webpack.DefinePlugin({
                'process.env': {
                    'NODE_ENV': JSON.stringify('production')
                }
            })
        ]
    }
}

function buildDevServerConfig() {
    const proxyConfig = {
        proxy: {
            '/api/*': {
                target: 'http://127.0.0.1:9090',
                secure: false
            }
        }
    };
    return {
        historyApiFallback: {
            rewrites: {from: new RegExp('^/h5/*'), to: `/index.html`}
        },
        disableHostCheck: true,
        contentBase: targetPath,
        host: "0.0.0.0",
        port: 8080,
        ...proxyConfig
    };
}

module.exports = function (env) {
    var devServer = env.mode === 'development' ? {devServer: buildDevServerConfig()} : {};
    return Object.assign({}, entry(env.mode), devServer);
};
