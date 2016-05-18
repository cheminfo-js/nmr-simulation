'use strict';

const SparseMatrix = require('ml-sparse-matrix');
const getPauli = require('./pauli');

function simulate1d(spinSystem, options = {}) {
    const frequencyMHz = (options.frequency || 400);
    const frequency = frequencyMHz * 1e6;
    const from = (options.from || 0) * frequencyMHz;
    const to = (options.to || 10) * frequencyMHz;
    const lineWidth = options.lineWidth || 1;
    const nbPoints = options.nbPoints || 1024;

    const chemicalShifts = spinSystem.chemicalShifts.slice();
    const shift = 0;//(from + to) / 2;
    for (var i = 0; i <chemicalShifts.length; i++) {
        chemicalShifts[i] = chemicalShifts[i] * frequencyMHz + shift;
    }
    
    let lineWidthPoints = (nbPoints * lineWidth / Math.abs(to - from));
    let lnPoints = lineWidthPoints * 50;
    lineWidthPoints = Math.pow(lineWidthPoints / 2, 2);
    
    const lorentzianLength = lnPoints | 0;
    const lorentzian = new Array(lorentzianLength);
    for (i = 0; i < lorentzianLength; i++) {
        lorentzian[i] = 1e12 * lineWidthPoints / (Math.pow(i - lnPoints / 2, 2) + lineWidthPoints);
    }

    const result = new Array(nbPoints);

    for (var h = 0; h < spinSystem.clusters.length; h++) {
        const cluster = spinSystem.clusters[h];
        const hamiltonian = getHamiltonian(
            chemicalShifts,
            spinSystem.couplingConstants,
            spinSystem.multiplicity,
            spinSystem.connectivity,
            cluster
        );
        console.log(JSON.stringify(hamiltonian.to2DArray()));
    }
}

function getHamiltonian(chemicalShifts, couplingConstants, multiplicity, conMatrix, cluster) {
    let hamSize = 1;
    for (var i = 0; i < cluster.length; i++) {
        hamSize *= multiplicity[cluster[i]];
    }
    
    const clusterHam = new SparseMatrix(hamSize, hamSize);

    for (var pos = 0; pos < cluster.length; pos++) {
        const n = cluster[pos];
        const L = getPauli(multiplicity[n]);

        let A1, B1;
        let temp = 1;
        for (let i = 0; i < pos; i++) {
            temp *= multiplicity[cluster[i]];
        }
        A1 = SparseMatrix.eye(temp);

        temp = 1;
        for (let i = pos + 1; i < cluster.length; i++) {
            temp *= multiplicity[cluster[i]];
        }
        B1 = SparseMatrix.eye(temp);

        const alpha = chemicalShifts[n];
        const kronProd = A1.kroneckerProduct(L.z).kroneckerProduct(B1);
        clusterHam.add(kronProd.mul(alpha));

        for (var pos2 = 0; pos2 < cluster.length; pos2++) {
            const k = cluster[pos2];
            if (conMatrix[n][k] === 1) {
                const S = getPauli(multiplicity[k]);

                let A2, B2;
                let temp = 1;
                for (let i = 0; i < pos2; i++) {
                    temp *= multiplicity[cluster[i]];
                }
                A2 = SparseMatrix.eye(temp);

                temp = 1;
                for (let i = pos2 + 1; i < cluster.length; i++) {
                    temp *= multiplicity[cluster[i]];
                }
                B2 = SparseMatrix.eye(temp);

                const kron1 = A1.kroneckerProduct(L.x).kroneckerProduct(B1).mmul(A2.kroneckerProduct(S.x).kroneckerProduct(B2));
                kron1.add(A1.kroneckerProduct(L.y).kroneckerProduct(B1).mul(-1).mmul(A2.kroneckerProduct(S.y).kroneckerProduct(B2)));
                kron1.add(A1.kroneckerProduct(L.z).kroneckerProduct(B1).mmul(A2.kroneckerProduct(S.z).kroneckerProduct(B2)));

                clusterHam.add(kron1.mul(couplingConstants[n][k]));
            }
        }
    }

    return clusterHam;
}

module.exports = simulate1d;
