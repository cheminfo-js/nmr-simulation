'use strict';

const Matrix = require('ml-matrix');

class SpinSystem {
    constructor(chemicalShifts, couplingConstants, multiplicity) {
        this.chemicalShifts = chemicalShifts;
        this.couplingConstants = couplingConstants;
        this.multiplicity = multiplicity;
        this.nSpins = chemicalShifts.length;
        this._initClusters();
        this._initConnectivity();
    }

    _initClusters() {
        const n = this.chemicalShifts.length;
        const cluster = new Array(n);
        for (var i = 0; i < n; i++) {
            cluster[i] = i;
        }
        this.clusters = [cluster];
    }

    _initConnectivity() {
        const couplings = this.couplingConstants;
        const connectivity = Matrix.ones(couplings.length, couplings.length);
        for (var i = 0; i < couplings.length; i++) {
            for (var j = i; j < couplings[i].length; j++) {
                if (couplings[i][j] === 0) {
                    connectivity[i][j] = 0;
                    connectivity[j][i] = 0;
                }
            }
        }
        this.connectivity = connectivity;
    }
}

module.exports = SpinSystem;
