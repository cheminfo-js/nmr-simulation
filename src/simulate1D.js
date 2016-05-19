'use strict';

const Matrix = require('ml-matrix');
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

    const multiplicity = spinSystem.multiplicity;
    for (var h = 0; h < spinSystem.clusters.length; h++) {
        const cluster = spinSystem.clusters[h];

        const hamiltonian = getHamiltonian(
            chemicalShifts,
            spinSystem.couplingConstants,
            multiplicity,
            spinSystem.connectivity,
            cluster
        );

        const hamSize = hamiltonian.rows;
        const evd = new Matrix.DC.EVD(hamiltonian);
        const B = evd.diagonalMatrix;
        const V = evd.eigenvectorMatrix;
        const diagB = evd.realEigenvalues;
        const assignmentMatrix = new SparseMatrix(hamSize, hamSize);
        const multLen = cluster.length;
        let weight = 0;
        for (var n = 0; n < multLen; n++) {
            const L = getPauli(multiplicity[cluster[n]]);

            let temp = 1;
            for (var j = 0; j < n; j++) {
                temp *= multiplicity[cluster[j]];
            }
            const A = SparseMatrix.eye(temp);

            temp = 1;
            for (j = n + 1; j < multLen; j++) {
                temp *= multiplicity[cluster[j]];
            }
            const B = SparseMatrix.eye(temp);
            const tempMat = A.kroneckerProduct(L.m).kroneckerProduct(B);
            if (cluster[n] > 0) {
                assignmentMatrix.add(tempMat.mul(cluster[n] + 1));
                weight++;
            } else {
                assignmentMatrix.add(tempMat.mul(0 - (cluster[n] + 1)));

            }
        }

        let rhoip = new SparseMatrix(hamSize, hamSize);
        assignmentMatrix.forEachNonZero((i, j, v) => {
            if (v > 0) {
                const row = V[j];
                for (var k = 0; k < row.length; k++) {
                    if (row[k] !== 0) {
                        rhoip.set(i, k, rhoip.get(i, k) + row[k]);
                    }
                }
            }
            return v;
        });

        let rhoip2 = rhoip.clone();
        assignmentMatrix.forEachNonZero((i, j, v) => {
            if (v < 0) {
                const row = V[j];
                for (var k = 0; k < row.length; k++) {
                    if (row[k] !== 0) {
                        rhoip2.set(i, k, rhoip2.get(i, k) + row[k]);
                    }
                }
            }
            return v;
        });
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
