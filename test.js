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
    from: 0,
    to: 11,
    frequency: 400.082470657773,
    lineWidth: 1
});
