module.exports = {
    root: true,
    extends: ['scratch', 'scratch/es6', 'scratch/node'],
    rules: {
        'space-before-function-paren': 0,
        'object-curly-spacing': 0,
        'no-warning-comments': 0,
        'no-mixed-operators': 0,
        'no-unused-vars': 0,
        'valid-jsdoc': 0,
        'arrow-parens': 0
    },
    env: {
        node: false,
        browser: true // TODO: disable this
    },
    globals: {
        Buffer: true // TODO: remove this?
    }
};
