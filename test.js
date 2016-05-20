'use strict';

var request = require('request');

const nmr = require('.');

var molfile = "C=CCC(C)O\nJME 2016-03-06 Fri May 20 08:38:48 GMT+200 2016\n\n  6  5  0  0  0  0  0  0  0  0999 V2000\n    0.0000    4.2000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\n    1.2124    3.5000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\n    1.2124    2.1000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\n    2.4248    1.4000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\n    2.4248    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\n    2.4248    4.2000    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0\n  1  2  1  0  0  0  0\n  2  3  1  0  0  0  0\n  3  4  1  0  0  0  0\n  4  5  2  0  0  0  0\n  2  6  1  0  0  0  0\nM  END\n";

request.post("http://www.nmrdb.org/service/predictor",{form:{molfile:molfile}},function(error, response, body){
    var spinSystem = nmr.SpinSystem.fromSpinusPrediction(body);
    var simulation = nmr.simulate1D(spinSystem, {
        frequency: 400.082470657773,
        from: 0,
        to: 11,
        lineWidth: 1,
        nbPoints: 16384
    });
    console.log(JSON.stringify(simulation));
});
