'use strict';

const Matrix = require('ml-matrix');
const newArray = require('new-array');

class SpinSystem {
    constructor(chemicalShifts, couplingConstants, multiplicity) {
        this.chemicalShifts = chemicalShifts;
        this.couplingConstants = couplingConstants;
        this.multiplicity = multiplicity;
        this.nSpins = chemicalShifts.length;
        this._initClusters();
        this._initConnectivity();
    }

    static fromSpinusPrediction(result) {
        var lines = result.split('\n');
        var nspins = lines.length - 1;
        var cs = new Array(nspins);
        var integrals = new Array(nspins);
        var ids = {};
        var jc = new Array(nspins);
        for (let i = 0; i < nspins; i++) {
            jc[i] = newArray(nspins, 0);
            var tokens = lines[i].split('\t');
            cs[i] = +tokens[2];
            ids[tokens[0] - 1] = i;
            integrals[i] = +tokens[5];//Is it always 1??
        }
        for (let i = 0; i < nspins; i++) {
            tokens = lines[i].split('\t');
            var nCoup = (tokens.length - 4) / 3;
            for (j = 0; j < nCoup; j++) {
                var withID = tokens[4 + 3 * j] - 1;
                var idx = ids[withID];
                jc[i][idx] = +tokens[6 + 3 * j];
            }
        }

        for (var j = 0; j < nspins; j++) {
            for (var i = j; i < nspins; i++) {
                jc[j][i] = jc[i][j];
            }
        }
        return new SpinSystem(cs, jc, newArray(nspins, 2));
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
