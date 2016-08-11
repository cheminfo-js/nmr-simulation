'use strict';

const Matrix = require('ml-matrix');
const newArray = require('new-array');
const simpleClustering = require('ml-simple-clustering');
const defaultOptions = {};
const DEBUG = true;

class SpinSystem {
    constructor(chemicalShifts, couplingConstants, multiplicity, options) {
        this.chemicalShifts = chemicalShifts;
        this.couplingConstants = couplingConstants;
        this.multiplicity = multiplicity;
        this.nSpins = chemicalShifts.length;
        this.maxClusterSize = 8;
        this._initConnectivity();
        this._initClusters();
        //this._ensureClusterSize();
    }

    static fromSpinusPrediction(result) {
        var lines = result.split('\n');
        var nspins = lines.length - 1;
        var cs = new Array(nspins);
        var integrals = new Array(nspins);
        var ids = {};
        var jc = Matrix.zeros(nspins, nspins);
        for (let i = 0; i < nspins; i++) {
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
        this.clusters = simpleClustering(this.connectivity);
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
    _ensureClusterSize(){
        var betas = this._calculateBetas(this.couplingConstants);
        if( DEBUG ) console.log(betas);
        var finalClusterList = [];
        var cluster, subClusters;
        for( cluster of this.clusters){
            if(cluster.length>this.maxClusterSize){
                subClusters = this._splitCluster(cluster, betas);
            }
            else{
                finalClusterList.push(cluster);
            }
        }
        this.clusters = finalClusterList;
    }


    _calculateBetas(J){
        var betas = Matrix.zeros(J.length, J.length);
        //Before clustering, we must add hidden J, we could use molecular information if available
        var i,j;
        for( i=0;i<J.rows;i++){
            for( j=i;j<J.columns;j++){
                if((this.chemicalShifts[i]-this.chemicalShifts[j])!=0){
                    betas[i][j] = 1 - Math.abs(J[i][j]/(this.chemicalShifts[i]-this.chemicalShifts[j]));
                    betas[j][i] = betas[i][j];
                }
                else if( !(i == j || J[i][j] !== 0) ){
                        betas[i][j] = 1;
                        betas[j][i] = 1;
                    }
            }
        }
        return betas;
    }

    _splitCluster(cluster, betas){

    }


}

module.exports = SpinSystem;
