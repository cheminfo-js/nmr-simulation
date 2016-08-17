'use strict';

const Matrix = require('ml-matrix');
const SparseMatrix = require('ml-sparse-matrix');
const binarySearch = require('ml-binary-search');
const newArray = require('new-array');

const getPauli = require('./pauli');

const DEBUG = true;

function simulate1d(spinSystem, options) {
    var i;
    const frequencyMHz = (options.frequency || 400);
    const from = (options.from || 0) * frequencyMHz;
    const to = (options.to || 10) * frequencyMHz;
    const lineWidth = options.lineWidth || 1;
    const nbPoints = options.nbPoints || 1024;
    const maxClusterSize = options.maxClusterSize || 10;

    const chemicalShifts = spinSystem.chemicalShifts.slice();
    for (i = 0; i < chemicalShifts.length; i++) {
        chemicalShifts[i] = chemicalShifts[i] * frequencyMHz;
    }

    let lineWidthPoints = (nbPoints * lineWidth / Math.abs(to - from)) / 2.355;
    let lnPoints = lineWidthPoints * 20;

    const gaussianLength = lnPoints | 0;
    const gaussian = new Array(gaussianLength);
    const b = lnPoints / 2;
    const c = lineWidthPoints * lineWidthPoints * 2;
    for (i = 0; i < gaussianLength; i++) {
        gaussian[i] = 1e12 * Math.exp(-((i - b) * (i - b)) / c);
    }

    const result = new newArray(nbPoints, 0);

    const multiplicity = spinSystem.multiplicity;
    for (var h = 0; h < spinSystem.clusters.length; h++) {
        const cluster = spinSystem.clusters[h];

        var clusterFake = new Array(cluster.length);
        for (var i = 0; i < cluster.length; i++) {
            clusterFake[i] = cluster[i]<0?-cluster[i]-1:cluster[i];
        }

        if (cluster.length > maxClusterSize) {
            throw new Error('too big cluster: ' + cluster.length);
        }
        
        var weight = 1;
        var sumI = 0;
        const frequencies = [];
        const intensities = [];
        if (false) {
            // if(tnonZeros.contains(2)){
        } else {
            const hamiltonian = getHamiltonian(
                chemicalShifts,
                spinSystem.couplingConstants,
                multiplicity,
                spinSystem.connectivity,
                clusterFake
            );

            const hamSize = hamiltonian.rows;
            const evd = new Matrix.DC.EVD(hamiltonian);
            const V = evd.eigenvectorMatrix;
            const diagB = evd.realEigenvalues;
            const assignmentMatrix = new SparseMatrix(hamSize, hamSize);
            const multLen = cluster.length;
            weight = 0;
            for (var n = 0; n < multLen; n++) {
                const L = getPauli(multiplicity[clusterFake[n]]);

                let temp = 1;
                for (var j = 0; j < n; j++) {
                    temp *= multiplicity[clusterFake[j]];
                }
                const A = SparseMatrix.eye(temp);

                temp = 1;
                for (j = n + 1; j < multLen; j++) {
                    temp *= multiplicity[clusterFake[j]];
                }
                const B = SparseMatrix.eye(temp);
                const tempMat = A.kroneckerProduct(L.m).kroneckerProduct(B);
                if (cluster[n] >= 0) {
                    assignmentMatrix.add(tempMat.mul(cluster[n] + 1));
                    weight++;
                } else {
                    assignmentMatrix.add(tempMat.mul(0 - (cluster[n] + 1)));

                }
            }

            let rhoip = Matrix.zeros(hamSize, hamSize);
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

            const tV = V.transpose();
            rhoip = tV.mmul(rhoip);
            rhoip = new SparseMatrix(rhoip, {threshold: 1e-1});
            triuTimesAbs(rhoip, 1e-1);
            rhoip2 = tV.mmul(rhoip2);
            rhoip2 = new SparseMatrix(rhoip2, {threshold: 1e-1});
            triuTimesAbs(rhoip2, 1e-1);

            rhoip2.forEachNonZero((i, j, v) => {
                var val = rhoip.get(i, j);
                val = Math.min(Math.abs(val), Math.abs(v));
                val *= val;

                sumI += val;
                var valFreq = diagB[i] - diagB[j];
                var insertIn = binarySearch(frequencies, valFreq);
                if (insertIn < 0) {
                    frequencies.splice(-1 - insertIn, 0, valFreq);
                    intensities.splice(-1 - insertIn, 0, val);
                } else {
                    intensities[insertIn] += val;
                }
            });
        }

        const numFreq = frequencies.length;
        if (numFreq > 0) {
            weight = weight / sumI;
            const diff = lineWidth / 16;
            let valFreq = frequencies[0];
            let inte = intensities[0];
            let count = 1;
            for (i = 1; i < numFreq; i++) {
                if (Math.abs(frequencies[i] - valFreq / count) < diff) {
                    inte += intensities[i];
                    valFreq += frequencies[i];
                    count++;
                } else {
                    addPeak(result, valFreq / count, inte * weight, from, to, nbPoints, gaussian);
                    valFreq = frequencies[i];
                    inte = intensities[i];
                    count = 1;
                }
            }
            addPeak(result, valFreq / count, inte * weight, from, to, nbPoints, gaussian);
        }
    }
    console.log(JSON.stringify(result));
    return result;
}

function addPeak(result, freq, height, from, to, nbPoints, gaussian) {
    const center = (nbPoints * (-freq-from) / (to - from)) | 0;
    const lnPoints = gaussian.length;
    var index = 0;
    var indexLorentz = 0;
    for (var i = center - lnPoints / 2; i < center + lnPoints / 2; i++) {
        index = i | 0;
        if (i >= 0 && i < nbPoints) {
            result[index] = result[index] + gaussian[indexLorentz] * height;
        }
        indexLorentz++;
    }
}

function triuTimesAbs(A, val) {
    A.forEachNonZero((i, j, v) => {
        if (i > j) return 0;
        if (Math.abs(v) <= val) return 0;
        return v;
    });
}

function getHamiltonian(chemicalShifts, couplingConstants, multiplicity, conMatrix, cluster) {
    let hamSize = 1;
    for (var i = 0; i < cluster.length; i++) {
        hamSize *= multiplicity[cluster[i]];
    }

    if(DEBUG) console.log("Hamiltonian size: "+hamSize);

    const clusterHam = new SparseMatrix(hamSize, hamSize);

    for (var pos = 0; pos < cluster.length; pos++) {
        var n = cluster[pos];

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
