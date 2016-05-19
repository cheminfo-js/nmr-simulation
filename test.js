'use strict';

const nmr = require('.');

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
