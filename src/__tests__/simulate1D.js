'use strict';

const nmr = require('..');
const NmrPredictor = new require('nmr-predictor');

var molfile = `Benzene, ethyl-, ID: C100414
  NIST    16081116462D 1   1.00000     0.00000
Copyright by the U.S. Sec. Commerce on behalf of U.S.A. All rights reserved.
  8  8  0     0  0              1 V2000
    0.5015    0.0000    0.0000 C   0  0  0  0  0  0           0  0  0
    0.0000    0.8526    0.0000 C   0  0  0  0  0  0           0  0  0
    1.5046    0.0000    0.0000 C   0  0  0  0  0  0           0  0  0
    2.0062    0.8526    0.0000 C   0  0  0  0  0  0           0  0  0
    3.0092    0.8526    0.0000 C   0  0  0  0  0  0           0  0  0
    1.5046    1.7554    0.0000 C   0  0  0  0  0  0           0  0  0
    0.5015    1.7052    0.0000 C   0  0  0  0  0  0           0  0  0
    3.5108    0.0000    0.0000 C   0  0  0  0  0  0           0  0  0
  1  2  2  0     0  0
  3  1  1  0     0  0
  2  7  1  0     0  0
  4  3  2  0     0  0
  4  5  1  0     0  0
  6  4  1  0     0  0
  5  8  1  0     0  0
  7  6  2  0     0  0
M  END
`;

describe('Simulation from molfile', function () {

    it('simulation gives {x,y} data', function (done) {
        const predictor = new NmrPredictor('spinus');
        predictor.predict(molfile, {group: false}).then(prediction => {

            const spinSystem = nmr.SpinSystem.fromPrediction(prediction);
            var options = {
                frequency: 400.082470657773,
                from: 0,
                to: 11,
                lineWidth: 1,
                nbPoints: 16384,
                maxClusterSize: 8,
                output: 'xy'
            }
            spinSystem.ensureClusterSize(options);
            var simulation = nmr.simulate1D(spinSystem, options);
            simulation.should.hasOwnProperty('x');
            simulation.should.hasOwnProperty('y');
            simulation.x.length.should.eql(16384);
            done();
        }, reject => { console.log(reject)});
    });
});