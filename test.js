'use strict';

/**
 * Created by acastillo on 5/19/16.
 */
var request = require('request');

var molfile = "OCC(CC)CC\nActelion Java MolfileCreator 1.0\n\n 21 20  0  0  0  0  0  0  0  0999 V2000\n    6.5361   -0.9434    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0\n    4.9020    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\n    3.2680   -0.9434    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\n    3.2680   -2.8302    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\n    1.6340    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\n    0.0000   -0.9434    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\n    4.9020   -3.7735    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\n    8.3588   -0.4550   -0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0\n    5.5623    1.1439   -0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0\n    4.2415    1.1438   -0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0\n    3.2680    0.0000   -0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0\n    1.9472   -2.8304   -0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0\n    2.6077   -3.9741   -0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0\n    2.2944    1.1438   -0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0\n    0.9736    1.1438   -0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0\n   -1.1438   -1.6038   -0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0\n   -0.6604    0.2004   -0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0\n    0.6604   -2.0872   -0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0\n    6.0458   -4.4337   -0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0\n    4.2417   -4.9172   -0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0\n    5.5622   -2.6297   -0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0\n  2  1  1  0  0  0  0\n  3  2  1  1  0  0  0\n  4  3  1  0  0  0  0\n  5  3  1  0  0  0  0\n  6  5  1  0  0  0  0\n  7  4  1  0  0  0  0\n  1  8  1  0  0  0  0\n  2  9  1  1  0  0  0\n  2 10  1  0  0  0  0\n  3 11  1  0  0  0  0\n  4 12  1  1  0  0  0\n  4 13  1  0  0  0  0\n  5 14  1  1  0  0  0\n  5 15  1  0  0  0  0\n  6 16  1  0  0  0  0\n  6 17  1  0  0  0  0\n  6 18  1  0  0  0  0\n  7 19  1  0  0  0  0\n  7 20  1  0  0  0  0\n  7 21  1  0  0  0  0\nM  END\n";
request.post("http://www.nmrdb.org/service/predictor",{form:{molfile:molfile}},function(error, response, body){
    console.log(body);
    var lines = body.split("\n");
    var nspins = lines.length;
    var cs = new Array(nspins)
    var integrals = new Array(nspins);
    var ids = [];
    var jc = new Array(nspins);
    for(var i=0;i<nspins;i++){
        jc[i] = new Array(nspins);
        var values = lines[i].split("\t");
        cs[i]=+values[2];
        ids[i]=values[0]-1;
        integrals[i]=+values[5];//Is it always 1??


        var nCoup=(values.length-4)/3;
        for(var j=0;j<nCoup;j++){
            var withID = +values[4+3*i];
            //if(spinusFormat==0)
            withID=(withID-1)+"";
            jc[i][+values[6+3*j]]=withID;
        }

        /*
         for(int i=0;i<nCoup;i++){
             String withID = tokens[4+spinusFormat+3*i];
             //if(spinusFormat==0)
             withID=(Integer.parseInt(withID)-1)+"";
             peakPrediction.addJ(Double.parseDouble(tokens[6+spinusFormat+3*i]),withID);
         }
         */
    }
});


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

//console.log(JSON.stringify(simulation));
