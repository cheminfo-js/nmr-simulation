'use strict';

var newArray = require('new-array');
var request = require('request');

const nmr = require('.');

var molfile = "C=CCC(C)O\nJME 2016-03-06 Fri May 20 08:38:48 GMT+200 2016\n\n  6  5  0  0  0  0  0  0  0  0999 V2000\n    0.0000    4.2000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\n    1.2124    3.5000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\n    1.2124    2.1000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\n    2.4248    1.4000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\n    2.4248    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\n    2.4248    4.2000    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0\n  1  2  1  0  0  0  0\n  2  3  1  0  0  0  0\n  3  4  1  0  0  0  0\n  4  5  2  0  0  0  0\n  2  6  1  0  0  0  0\nM  END\n";

request.post("http://www.nmrdb.org/service/predictor",{form:{molfile:molfile}},function(error, response, body){
    var spinSystem = parseSpinusResult(body);
    var simulation = nmr.simulate1D(spinSystem, {
        frequency: 400.082470657773,
        from: 0,
        to: 11,
        lineWidth: 1,
        nbPoints: 16384
    });
    //console.log(JSON.stringify(simulation));
});

function parseSpinusResult(body) {
    var lines = body.split('\n');
    var nspins = lines.length - 1;
    var cs = new Array(nspins);
    var integrals = new Array(nspins);
    var ids = {};
    var jc = new Array(nspins);
    for (var i = 0; i < nspins; i++) {
        jc[i] = newArray(nspins, 0);
        var tokens = lines[i].split('\t');
        cs[i] = +tokens[2];
        ids[tokens[0] - 1] = i;
        integrals[i] = +tokens[5];//Is it always 1??
    }
    for (var i = 0; i < nspins; i++) {
        tokens = lines[i].split('\t');
        var nCoup = (tokens.length - 4) / 3;
        for (j = 0; j < nCoup; j++) {
            var withID = tokens[4 + 3 * j] - 1;
            var idx = ids[withID];
            var value = +tokens[6 + 3 * j];
            jc[i][idx] = value;
        }
    }
    
    for (var j = 0; j < nspins; j++) {
        for (var i = j; i < nspins; i++) {
            jc[j][i] = jc[i][j];
        }
    }

    return new nmr.SpinSystem(cs, jc, newArray(nspins, 2));
}

/*

const system = new nmr.SpinSystem(
    [1, 1, 0, 2, 2],
    [
        [0, 3.5, 3.5,0,0],
        [3.5, 0, 3.5,0,0],
        [3.5, 3.5, 0,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0]
    ],
    [2, 2, 2,2,2]
);

const simulation = nmr.simulate1D(system, {
    frequency: 400.082470657773,
    from: 0,
    to: 11,
    lineWidth: 1,
    nbPoints: 16384
});

console.log(JSON.stringify(simulation));

*/