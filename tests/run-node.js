// Run all tests headless:  node tests/run-node.js
globalThis.window = globalThis
globalThis.document = { getElementById: function() { return null }, title: '' }
var path = require('path')
var src = path.join(__dirname, '..', 'src')
;[
    'store/store.js',
    'config/balance.js', 'config/adaptations.js', 'config/strings.js', 'config/world.js',
    'systems/worldSystem.js', 'systems/sessionSystem.js', 'systems/playerSystem.js',
    'systems/foodSystem.js', 'systems/npcSystem.js', 'systems/predatorSystem.js',
    'main.js'
].forEach(function(f) { require(path.join(src, f)) })
require('./helpers.js')
require('./test-store.js')
require('./test-game.js')
var p = 0, f = 0
TestRunner.results.forEach(function(t) { t.pass ? p++ : (f++, console.log('FAIL:', t.message)) })
console.log(p + ' passed, ' + f + ' failed')
process.exit(f ? 1 : 0)
