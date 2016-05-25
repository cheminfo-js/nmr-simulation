(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["nmrSimulation"] = factory();
	else
		root["nmrSimulation"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	exports.SpinSystem = __webpack_require__(1);
	exports.simulate1D = __webpack_require__(12);


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	const Matrix = __webpack_require__(2);
	const newArray = __webpack_require__(11);

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


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	module.exports = __webpack_require__(3);
	module.exports.Decompositions = module.exports.DC = __webpack_require__(4);


/***/ },
/* 3 */
/***/ function(module, exports) {

	'use strict';

	/**
	 * Real matrix
	 */
	class Matrix extends Array {
	    /**
	     * @constructor
	     * @param {number|Array|Matrix} nRows - Number of rows of the new matrix,
	     * 2D array containing the data or Matrix instance to clone
	     * @param {number} [nColumns] - Number of columns of the new matrix
	     */
	    constructor(nRows, nColumns) {
	        if (Matrix.isMatrix(nRows)) {
	            return nRows.clone();
	        } else if (Number.isInteger(nRows) && nRows > 0) { // Create an empty matrix
	            super(nRows);
	            if (Number.isInteger(nColumns) && nColumns > 0) {
	                for (var i = 0; i < nRows; i++) {
	                    this[i] = new Array(nColumns);
	                }
	            } else {
	                throw new TypeError('nColumns must be a positive integer');
	            }
	        } else if (Array.isArray(nRows)) { // Copy the values from the 2D array
	            var matrix = nRows;
	            nRows = matrix.length;
	            nColumns = matrix[0].length;
	            if (typeof nColumns !== 'number' || nColumns === 0) {
	                throw new TypeError('Data must be a 2D array with at least one element');
	            }
	            super(nRows);
	            for (var i = 0; i < nRows; i++) {
	                if (matrix[i].length !== nColumns) {
	                    throw new RangeError('Inconsistent array dimensions');
	                }
	                this[i] = [].concat(matrix[i]);
	            }
	        } else {
	            throw new TypeError('First argument must be a positive number or an array');
	        }
	        this.rows = nRows;
	        this.columns = nColumns;
	    }

	    /**
	     * Constructs a Matrix with the chosen dimensions from a 1D array
	     * @param {number} newRows - Number of rows
	     * @param {number} newColumns - Number of columns
	     * @param {Array} newData - A 1D array containing data for the matrix
	     * @returns {Matrix} - The new matrix
	     */
	    static from1DArray(newRows, newColumns, newData) {
	        var length = newRows * newColumns;
	        if (length !== newData.length) {
	            throw new RangeError('Data length does not match given dimensions');
	        }
	        var newMatrix = new Matrix(newRows, newColumns);
	        for (var row = 0; row < newRows; row++) {
	            for (var column = 0; column < newColumns; column++) {
	                newMatrix[row][column] = newData[row * newColumns + column];
	            }
	        }
	        return newMatrix;
	    }

	    /**
	     * Creates a row vector, a matrix with only one row.
	     * @param {Array} newData - A 1D array containing data for the vector
	     * @returns {Matrix} - The new matrix
	     */
	    static rowVector(newData) {
	        var vector = new Matrix(1, newData.length);
	        for (var i = 0; i < newData.length; i++) {
	            vector[0][i] = newData[i];
	        }
	        return vector;
	    }

	    /**
	     * Creates a column vector, a matrix with only one column.
	     * @param {Array} newData - A 1D array containing data for the vector
	     * @returns {Matrix} - The new matrix
	     */
	    static columnVector(newData) {
	        var vector = new Matrix(newData.length, 1);
	        for (var i = 0; i < newData.length; i++) {
	            vector[i][0] = newData[i];
	        }
	        return vector;
	    }

	    /**
	     * Creates an empty matrix with the given dimensions. Values will be undefined. Same as using new Matrix(rows, columns).
	     * @param {number} rows - Number of rows
	     * @param {number} columns - Number of columns
	     * @returns {Matrix} - The new matrix
	     */
	    static empty(rows, columns) {
	        return new Matrix(rows, columns);
	    }

	    /**
	     * Creates a matrix with the given dimensions. Values will be set to zero.
	     * @param {number} rows - Number of rows
	     * @param {number} columns - Number of columns
	     * @returns {Matrix} - The new matrix
	     */
	    static zeros(rows, columns) {
	        return Matrix.empty(rows, columns).fill(0);
	    }

	    /**
	     * Creates a matrix with the given dimensions. Values will be set to one.
	     * @param {number} rows - Number of rows
	     * @param {number} columns - Number of columns
	     * @returns {Matrix} - The new matrix
	     */
	    static ones(rows, columns) {
	        return Matrix.empty(rows, columns).fill(1);
	    }

	    /**
	     * Creates a matrix with the given dimensions. Values will be randomly set.
	     * @param {number} rows - Number of rows
	     * @param {number} columns - Number of columns
	     * @param {function} [rng] - Random number generator (default: Math.random)
	     * @returns {Matrix} The new matrix
	     */
	    static rand(rows, columns, rng) {
	        if (rng === undefined) rng = Math.random;
	        var matrix = Matrix.empty(rows, columns);
	        for (var i = 0; i < rows; i++) {
	            for (var j = 0; j < columns; j++) {
	                matrix[i][j] = rng();
	            }
	        }
	        return matrix;
	    }

	    /**
	     * Creates an identity matrix with the given dimension. Values of the diagonal will be 1 and others will be 0.
	     * @param {number} rows - Number of rows
	     * @param {number} [columns] - Number of columns (Default: rows)
	     * @returns {Matrix} - The new identity matrix
	     */
	    static eye(rows, columns) {
	        if (columns === undefined) columns = rows;
	        var min = Math.min(rows, columns);
	        var matrix = Matrix.zeros(rows, columns);
	        for (var i = 0; i < min; i++) {
	            matrix[i][i] = 1;
	        }
	        return matrix;
	    }

	    /**
	     * Creates a diagonal matrix based on the given array.
	     * @param {Array} data - Array containing the data for the diagonal
	     * @param {number} [rows] - Number of rows (Default: data.length)
	     * @param {number} [columns] - Number of columns (Default: rows)
	     * @returns {Matrix} - The new diagonal matrix
	     */
	    static diag(data, rows, columns) {
	        var l = data.length;
	        if (rows === undefined) rows = l;
	        if (columns === undefined) columns = rows;
	        var min = Math.min(l, rows, columns);
	        var matrix = Matrix.zeros(rows, columns);
	        for (var i = 0; i < min; i++) {
	            matrix[i][i] = data[i];
	        }
	        return matrix;
	    }

	    /**
	     * Returns a matrix whose elements are the minimum between matrix1 and matrix2
	     * @param matrix1
	     * @param matrix2
	     * @returns {Matrix}
	     */
	    static min(matrix1, matrix2) {
	        var rows = matrix1.length;
	        var columns = matrix1[0].length;
	        var result = new Matrix(rows, columns);
	        for (var i = 0; i < rows; i++) {
	            for(var j = 0; j < columns; j++) {
	                result[i][j] = Math.min(matrix1[i][j], matrix2[i][j]);
	            }
	        }
	        return result;
	    }

	    /**
	     * Returns a matrix whose elements are the maximum between matrix1 and matrix2
	     * @param matrix1
	     * @param matrix2
	     * @returns {Matrix}
	     */
	    static max(matrix1, matrix2) {
	        var rows = matrix1.length;
	        var columns = matrix1[0].length;
	        var result = new Matrix(rows, columns);
	        for (var i = 0; i < rows; i++) {
	            for(var j = 0; j < columns; j++) {
	                result[i][j] = Math.max(matrix1[i][j], matrix2[i][j]);
	            }
	        }
	        return result;
	    }

	    /**
	     * Check that the provided value is a Matrix and tries to instantiate one if not
	     * @param value - The value to check
	     * @returns {Matrix}
	     */
	    static checkMatrix(value) {
	        return Matrix.isMatrix(value) ? value : new Matrix(value);
	    }

	    /**
	     * Returns true if the argument is a Matrix, false otherwise
	     * @param value - The value to check
	     * @return {boolean}
	     */
	    static isMatrix(value) {
	        return (value != null) && (value.klass === 'Matrix');
	    }

	    /**
	     * @property {number} - The number of elements in the matrix.
	     */
	    get size() {
	        return this.rows * this.columns;
	    }

	    /**
	     * Applies a callback for each element of the matrix. The function is called in the matrix (this) context.
	     * @param {function} callback - Function that will be called with two parameters : i (row) and j (column)
	     * @returns {Matrix} this
	     */
	    apply(callback) {
	        if (typeof callback !== 'function') {
	            throw new TypeError('callback must be a function');
	        }
	        var ii = this.rows;
	        var jj = this.columns;
	        for (var i = 0; i < ii; i++) {
	            for (var j = 0; j < jj; j++) {
	                callback.call(this, i, j);
	            }
	        }
	        return this;
	    }

	    /**
	     * Creates an exact and independent copy of the matrix
	     * @returns {Matrix}
	     */
	    clone() {
	        var newMatrix = new Matrix(this.rows, this.columns);
	        for (var row = 0; row < this.rows; row++) {
	            for (var column = 0; column < this.columns; column++) {
	                newMatrix[row][column] = this[row][column];
	            }
	        }
	        return newMatrix;
	    }

	    /**
	     * Returns a new 1D array filled row by row with the matrix values
	     * @returns {Array}
	     */
	    to1DArray() {
	        var array = new Array(this.size);
	        for (var i = 0; i < this.rows; i++) {
	            for (var j = 0; j < this.columns; j++) {
	                array[i * this.columns + j] = this[i][j];
	            }
	        }
	        return array;
	    }

	    /**
	     * Returns a 2D array containing a copy of the data
	     * @returns {Array}
	     */
	    to2DArray() {
	        var copy = new Array(this.rows);
	        for (var i = 0; i < this.rows; i++) {
	            copy[i] = [].concat(this[i]);
	        }
	        return copy;
	    }

	    /**
	     * @returns {boolean} true if the matrix has one row
	     */
	    isRowVector() {
	        return this.rows === 1;
	    }

	    /**
	     * @returns {boolean} true if the matrix has one column
	     */
	    isColumnVector() {
	        return this.columns === 1;
	    }

	    /**
	     * @returns {boolean} true if the matrix has one row or one column
	     */
	    isVector() {
	        return (this.rows === 1) || (this.columns === 1);
	    }

	    /**
	     * @returns {boolean} true if the matrix has the same number of rows and columns
	     */
	    isSquare() {
	        return this.rows === this.columns;
	    }

	    /**
	     * @returns {boolean} true if the matrix is square and has the same values on both sides of the diagonal
	     */
	    isSymmetric() {
	        if (this.isSquare()) {
	            for (var i = 0; i < this.rows; i++) {
	                for (var j = 0; j <= i; j++) {
	                    if (this[i][j] !== this[j][i]) {
	                        return false;
	                    }
	                }
	            }
	            return true;
	        }
	        return false;
	    }

	    /**
	     * Sets a given element of the matrix. mat.set(3,4,1) is equivalent to mat[3][4]=1
	     * @param {number} rowIndex - Index of the row
	     * @param {number} columnIndex - Index of the column
	     * @param {number} value - The new value for the element
	     * @returns {Matrix} this
	     */
	    set(rowIndex, columnIndex, value) {
	        this[rowIndex][columnIndex] = value;
	        return this;
	    }

	    /**
	     * Returns the given element of the matrix. mat.get(3,4) is equivalent to matrix[3][4]
	     * @param {number} rowIndex - Index of the row
	     * @param {number} columnIndex - Index of the column
	     * @returns {number}
	     */
	    get(rowIndex, columnIndex) {
	        return this[rowIndex][columnIndex];
	    }

	    /**
	     * Fills the matrix with a given value. All elements will be set to this value.
	     * @param {number} value - New value
	     * @returns {Matrix} this
	     */
	    fill(value) {
	        for (var i = 0; i < this.rows; i++) {
	            for (var j = 0; j < this.columns; j++) {
	                this[i][j] = value;
	            }
	        }
	        return this;
	    }

	    /**
	     * Negates the matrix. All elements will be multiplied by (-1)
	     * @returns {Matrix} this
	     */
	    neg() {
	        return this.mulS(-1);
	    }

	    /**
	     * Returns a new array from the given row index
	     * @param {number} index - Row index
	     * @returns {Array}
	     */
	    getRow(index) {
	        checkRowIndex(this, index);
	        return [].concat(this[index]);
	    }

	    /**
	     * Returns a new row vector from the given row index
	     * @param {number} index - Row index
	     * @returns {Matrix}
	     */
	    getRowVector(index) {
	        return Matrix.rowVector(this.getRow(index));
	    }

	    /**
	     * Sets a row at the given index
	     * @param {number} index - Row index
	     * @param {Array|Matrix} array - Array or vector
	     * @returns {Matrix} this
	     */
	    setRow(index, array) {
	        checkRowIndex(this, index);
	        array = checkRowVector(this, array, true);
	        this[index] = array;
	        return this;
	    }

	    /**
	     * Removes a row from the given index
	     * @param {number} index - Row index
	     * @returns {Matrix} this
	     */
	    removeRow(index) {
	        checkRowIndex(this, index);
	        if (this.rows === 1)
	            throw new RangeError('A matrix cannot have less than one row');
	        this.splice(index, 1);
	        this.rows -= 1;
	        return this;
	    }

	    /**
	     * Adds a row at the given index
	     * @param {number} [index = this.rows] - Row index
	     * @param {Array|Matrix} array - Array or vector
	     * @returns {Matrix} this
	     */
	    addRow(index, array) {
	        if (array === undefined) {
	            array = index;
	            index = this.rows;
	        }
	        checkRowIndex(this, index, true);
	        array = checkRowVector(this, array, true);
	        this.splice(index, 0, array);
	        this.rows += 1;
	        return this;
	    }

	    /**
	     * Swaps two rows
	     * @param {number} row1 - First row index
	     * @param {number} row2 - Second row index
	     * @returns {Matrix} this
	     */
	    swapRows(row1, row2) {
	        checkRowIndex(this, row1);
	        checkRowIndex(this, row2);
	        var temp = this[row1];
	        this[row1] = this[row2];
	        this[row2] = temp;
	        return this;
	    }

	    /**
	     * Returns a new array from the given column index
	     * @param {number} index - Column index
	     * @returns {Array}
	     */
	    getColumn(index) {
	        checkColumnIndex(this, index);
	        var column = new Array(this.rows);
	        for (var i = 0; i < this.rows; i++) {
	            column[i] = this[i][index];
	        }
	        return column;
	    }

	    /**
	     * Returns a new column vector from the given column index
	     * @param {number} index - Column index
	     * @returns {Matrix}
	     */
	    getColumnVector(index) {
	        return Matrix.columnVector(this.getColumn(index));
	    }

	    /**
	     * Sets a column at the given index
	     * @param {number} index - Column index
	     * @param {Array|Matrix} array - Array or vector
	     * @returns {Matrix} this
	     */
	    setColumn(index, array) {
	        checkColumnIndex(this, index);
	        array = checkColumnVector(this, array);
	        for (var i = 0; i < this.rows; i++) {
	            this[i][index] = array[i];
	        }
	        return this;
	    }

	    /**
	     * Removes a column from the given index
	     * @param {number} index - Column index
	     * @returns {Matrix} this
	     */
	    removeColumn(index) {
	        checkColumnIndex(this, index);
	        if (this.columns === 1)
	            throw new RangeError('A matrix cannot have less than one column');
	        for (var i = 0; i < this.rows; i++) {
	            this[i].splice(index, 1);
	        }
	        this.columns -= 1;
	        return this;
	    }

	    /**
	     * Adds a column at the given index
	     * @param {number} [index = this.columns] - Column index
	     * @param {Array|Matrix} array - Array or vector
	     * @returns {Matrix} this
	     */
	    addColumn(index, array) {
	        if (typeof array === 'undefined') {
	            array = index;
	            index = this.columns;
	        }
	        checkColumnIndex(this, index, true);
	        array = checkColumnVector(this, array);
	        for (var i = 0; i < this.rows; i++) {
	            this[i].splice(index, 0, array[i]);
	        }
	        this.columns += 1;
	        return this;
	    }

	    /**
	     * Swaps two columns
	     * @param {number} column1 - First column index
	     * @param {number} column2 - Second column index
	     * @returns {Matrix} this
	     */
	    swapColumns(column1, column2) {
	        checkColumnIndex(this, column1);
	        checkColumnIndex(this, column2);
	        var temp, row;
	        for (var i = 0; i < this.rows; i++) {
	            row = this[i];
	            temp = row[column1];
	            row[column1] = row[column2];
	            row[column2] = temp;
	        }
	        return this;
	    }

	    /**
	     * Adds the values of a vector to each row
	     * @param {Array|Matrix} vector - Array or vector
	     * @returns {Matrix} this
	     */
	    addRowVector(vector) {
	        vector = checkRowVector(this, vector);
	        for (var i = 0; i < this.rows; i++) {
	            for (var j = 0; j < this.columns; j++) {
	                this[i][j] += vector[j];
	            }
	        }
	        return this;
	    }

	    /**
	     * Subtracts the values of a vector from each row
	     * @param {Array|Matrix} vector - Array or vector
	     * @returns {Matrix} this
	     */
	    subRowVector(vector) {
	        vector = checkRowVector(this, vector);
	        for (var i = 0; i < this.rows; i++) {
	            for (var j = 0; j < this.columns; j++) {
	                this[i][j] -= vector[j];
	            }
	        }
	        return this;
	    }

	    /**
	     * Multiplies the values of a vector with each row
	     * @param {Array|Matrix} vector - Array or vector
	     * @returns {Matrix} this
	     */
	    mulRowVector(vector) {
	        vector = checkRowVector(this, vector);
	        for (var i = 0; i < this.rows; i++) {
	            for (var j = 0; j < this.columns; j++) {
	                this[i][j] *= vector[j];
	            }
	        }
	        return this;
	    }

	    /**
	     * Divides the values of each row by those of a vector
	     * @param {Array|Matrix} vector - Array or vector
	     * @returns {Matrix} this
	     */
	    divRowVector(vector) {
	        vector = checkRowVector(this, vector);
	        for (var i = 0; i < this.rows; i++) {
	            for (var j = 0; j < this.columns; j++) {
	                this[i][j] /= vector[j];
	            }
	        }
	        return this;
	    }

	    /**
	     * Adds the values of a vector to each column
	     * @param {Array|Matrix} vector - Array or vector
	     * @returns {Matrix} this
	     */
	    addColumnVector(vector) {
	        vector = checkColumnVector(this, vector);
	        for (var i = 0; i < this.rows; i++) {
	            for (var j = 0; j < this.columns; j++) {
	                this[i][j] += vector[i];
	            }
	        }
	        return this;
	    }

	    /**
	     * Subtracts the values of a vector from each column
	     * @param {Array|Matrix} vector - Array or vector
	     * @returns {Matrix} this
	     */
	    subColumnVector(vector) {
	        vector = checkColumnVector(this, vector);
	        for (var i = 0; i < this.rows; i++) {
	            for (var j = 0; j < this.columns; j++) {
	                this[i][j] -= vector[i];
	            }
	        }
	        return this;
	    }

	    /**
	     * Multiplies the values of a vector with each column
	     * @param {Array|Matrix} vector - Array or vector
	     * @returns {Matrix} this
	     */
	    mulColumnVector(vector) {
	        vector = checkColumnVector(this, vector);
	        for (var i = 0; i < this.rows; i++) {
	            for (var j = 0; j < this.columns; j++) {
	                this[i][j] *= vector[i];
	            }
	        }
	        return this;
	    }

	    /**
	     * Divides the values of each column by those of a vector
	     * @param {Array|Matrix} vector - Array or vector
	     * @returns {Matrix} this
	     */
	    divColumnVector(vector) {
	        vector = checkColumnVector(this, vector);
	        for (var i = 0; i < this.rows; i++) {
	            for (var j = 0; j < this.columns; j++) {
	                this[i][j] /= vector[i];
	            }
	        }
	        return this;
	    }

	    /**
	     * Multiplies the values of a row with a scalar
	     * @param {number} index - Row index
	     * @param {number} value
	     * @returns {Matrix} this
	     */
	    mulRow(index, value) {
	        checkRowIndex(this, index);
	        for (var i = 0; i < this.columns; i++) {
	            this[index][i] *= value;
	        }
	        return this;
	    }

	    /**
	     * Multiplies the values of a column with a scalar
	     * @param {number} index - Column index
	     * @param {number} value
	     * @returns {Matrix} this
	     */
	    mulColumn(index, value) {
	        checkColumnIndex(this, index);
	        for (var i = 0; i < this.rows; i++) {
	            this[i][index] *= value;
	        }
	    }

	    /**
	     * Returns the maximum value of the matrix
	     * @returns {number}
	     */
	    max() {
	        var v = this[0][0];
	        for (var i = 0; i < this.rows; i++) {
	            for (var j = 0; j < this.columns; j++) {
	                if (this[i][j] > v) {
	                    v = this[i][j];
	                }
	            }
	        }
	        return v;
	    }

	    /**
	     * Returns the index of the maximum value
	     * @returns {Array}
	     */
	    maxIndex() {
	        var v = this[0][0];
	        var idx = [0, 0];
	        for (var i = 0; i < this.rows; i++) {
	            for (var j = 0; j < this.columns; j++) {
	                if (this[i][j] > v) {
	                    v = this[i][j];
	                    idx[0] = i;
	                    idx[1] = j;
	                }
	            }
	        }
	        return idx;
	    }

	    /**
	     * Returns the minimum value of the matrix
	     * @returns {number}
	     */
	    min() {
	        var v = this[0][0];
	        for (var i = 0; i < this.rows; i++) {
	            for (var j = 0; j < this.columns; j++) {
	                if (this[i][j] < v) {
	                    v = this[i][j];
	                }
	            }
	        }
	        return v;
	    }

	    /**
	     * Returns the index of the minimum value
	     * @returns {Array}
	     */
	    minIndex() {
	        var v = this[0][0];
	        var idx = [0, 0];
	        for (var i = 0; i < this.rows; i++) {
	            for (var j = 0; j < this.columns; j++) {
	                if (this[i][j] < v) {
	                    v = this[i][j];
	                    idx[0] = i;
	                    idx[1] = j;
	                }
	            }
	        }
	        return idx;
	    }

	    /**
	     * Returns the maximum value of one row
	     * @param {number} row - Row index
	     * @returns {number}
	     */
	    maxRow(row) {
	        checkRowIndex(this, row);
	        var v = this[row][0];
	        for (var i = 1; i < this.columns; i++) {
	            if (this[row][i] > v) {
	                v = this[row][i];
	            }
	        }
	        return v;
	    }

	    /**
	     * Returns the index of the maximum value of one row
	     * @param {number} row - Row index
	     * @returns {Array}
	     */
	    maxRowIndex(row) {
	        checkRowIndex(this, row);
	        var v = this[row][0];
	        var idx = [row, 0];
	        for (var i = 1; i < this.columns; i++) {
	            if (this[row][i] > v) {
	                v = this[row][i];
	                idx[1] = i;
	            }
	        }
	        return idx;
	    }

	    /**
	     * Returns the minimum value of one row
	     * @param {number} row - Row index
	     * @returns {number}
	     */
	    minRow(row) {
	        checkRowIndex(this, row);
	        var v = this[row][0];
	        for (var i = 1; i < this.columns; i++) {
	            if (this[row][i] < v) {
	                v = this[row][i];
	            }
	        }
	        return v;
	    }

	    /**
	     * Returns the index of the maximum value of one row
	     * @param {number} row - Row index
	     * @returns {Array}
	     */
	    minRowIndex(row) {
	        checkRowIndex(this, row);
	        var v = this[row][0];
	        var idx = [row, 0];
	        for (var i = 1; i < this.columns; i++) {
	            if (this[row][i] < v) {
	                v = this[row][i];
	                idx[1] = i;
	            }
	        }
	        return idx;
	    }

	    /**
	     * Returns the maximum value of one column
	     * @param {number} column - Column index
	     * @returns {number}
	     */
	    maxColumn(column) {
	        checkColumnIndex(this, column);
	        var v = this[0][column];
	        for (var i = 1; i < this.rows; i++) {
	            if (this[i][column] > v) {
	                v = this[i][column];
	            }
	        }
	        return v;
	    }

	    /**
	     * Returns the index of the maximum value of one column
	     * @param {number} column - Column index
	     * @returns {Array}
	     */
	    maxColumnIndex(column) {
	        checkColumnIndex(this, column);
	        var v = this[0][column];
	        var idx = [0, column];
	        for (var i = 1; i < this.rows; i++) {
	            if (this[i][column] > v) {
	                v = this[i][column];
	                idx[0] = i;
	            }
	        }
	        return idx;
	    }

	    /**
	     * Returns the minimum value of one column
	     * @param {number} column - Column index
	     * @returns {number}
	     */
	    minColumn(column) {
	        checkColumnIndex(this, column);
	        var v = this[0][column];
	        for (var i = 1; i < this.rows; i++) {
	            if (this[i][column] < v) {
	                v = this[i][column];
	            }
	        }
	        return v;
	    }

	    /**
	     * Returns the index of the minimum value of one column
	     * @param {number} column - Column index
	     * @returns {Array}
	     */
	    minColumnIndex(column) {
	        checkColumnIndex(this, column);
	        var v = this[0][column];
	        var idx = [0, column];
	        for (var i = 1; i < this.rows; i++) {
	            if (this[i][column] < v) {
	                v = this[i][column];
	                idx[0] = i;
	            }
	        }
	        return idx;
	    }

	    /**
	     * Returns an array containing the diagonal values of the matrix
	     * @returns {Array}
	     */
	    diag() {
	        var min = Math.min(this.rows, this.columns);
	        var diag = new Array(min);
	        for (var i = 0; i < min; i++) {
	            diag[i] = this[i][i];
	        }
	        return diag;
	    }

	    /**
	     * Returns the sum of all elements of the matrix
	     * @returns {number}
	     */
	    sum() {
	        var v = 0;
	        for (var i = 0; i < this.rows; i++) {
	            for (var j = 0; j < this.columns; j++) {
	                v += this[i][j];
	            }
	        }
	        return v;
	    }

	    /**
	     * Returns the mean of all elements of the matrix
	     * @returns {number}
	     */
	    mean() {
	        return this.sum() / this.size;
	    }

	    /**
	     * Returns the product of all elements of the matrix
	     * @returns {number}
	     */
	    prod() {
	        var prod = 1;
	        for (var i = 0; i < this.rows; i++) {
	            for (var j = 0; j < this.columns; j++) {
	                prod *= this[i][j];
	            }
	        }
	        return prod;
	    }

	    /**
	     * Computes the cumulative sum of the matrix elements (in place, row by row)
	     * @returns {Matrix} this
	     */
	    cumulativeSum() {
	        var sum = 0;
	        for (var i = 0; i < this.rows; i++) {
	            for (var j = 0; j < this.columns; j++) {
	                sum += this[i][j];
	                this[i][j] = sum;
	            }
	        }
	        return this;
	    }

	    /**
	     * Computes the dot (scalar) product between the matrix and another
	     * @param {Matrix} vector2 vector
	     * @returns {number}
	     */
	    dot(vector2) {
	        if (Matrix.isMatrix(vector2)) vector2 = vector2.to1DArray();
	        var vector1 = this.to1DArray();
	        if (vector1.length !== vector2.length) {
	            throw new RangeError('vectors do not have the same size');
	        }
	        var dot = 0;
	        for (var i = 0; i < vector1.length; i++) {
	            dot += vector1[i] * vector2[i];
	        }
	        return dot;
	    }

	    /**
	     * Returns the matrix product between this and other
	     * @param {Matrix} other
	     * @returns {Matrix}
	     */
	    mmul(other) {
	        other = Matrix.checkMatrix(other);
	        if (this.columns !== other.rows)
	            console.warn('Number of columns of left matrix are not equal to number of rows of right matrix.');

	        var m = this.rows;
	        var n = this.columns;
	        var p = other.columns;

	        var result = new Matrix(m, p);

	        var Bcolj = new Array(n);
	        for (var j = 0; j < p; j++) {
	            for (var k = 0; k < n; k++)
	                Bcolj[k] = other[k][j];

	            for (var i = 0; i < m; i++) {
	                var Arowi = this[i];

	                var s = 0;
	                for (k = 0; k < n; k++)
	                    s += Arowi[k] * Bcolj[k];

	                result[i][j] = s;
	            }
	        }
	        return result;
	    }

	    /**
	     * Returns the Kronecker product (also known as tensor product) between this and other
	     * See https://en.wikipedia.org/wiki/Kronecker_product
	     * @param {Matrix} other
	     * @return {Matrix}
	     */
	    kroneckerProduct(other) {
	        other = Matrix.checkMatrix(other);

	        var m = this.rows;
	        var n = this.columns;
	        var p = other.rows;
	        var q = other.columns;

	        var result = new Matrix(m * p, n * q);
	        for (var i = 0; i < m; i++) {
	            for (var j = 0; j < n; j++) {
	                for (var k = 0; k < p; k++) {
	                    for (var l = 0; l < q; l++) {
	                        result[p * i + k][q * j + l] = this[i][j] * other[k][l];
	                    }
	                }
	            }
	        }
	        return result;
	    }

	    /**
	     * Transposes the matrix and returns a new one containing the result
	     * @returns {Matrix}
	     */
	    transpose() {
	        var result = new Matrix(this.columns, this.rows);
	        for (var i = 0; i < this.rows; i++) {
	            for (var j = 0; j < this.columns; j++) {
	                result[j][i] = this[i][j];
	            }
	        }
	        return result;
	    }

	    /**
	     * Sorts the rows (in place)
	     * @param {function} compareFunction - usual Array.prototype.sort comparison function
	     * @returns {Matrix} this
	     */
	    sortRows(compareFunction) {
	        if (compareFunction === undefined) compareFunction = compareNumbers;
	        for (var i = 0; i < this.rows; i++) {
	            this[i].sort(compareFunction);
	        }
	        return this;
	    }

	    /**
	     * Sorts the columns (in place)
	     * @param {function} compareFunction - usual Array.prototype.sort comparison function
	     * @returns {Matrix} this
	     */
	    sortColumns(compareFunction) {
	        if (compareFunction === undefined) compareFunction = compareNumbers;
	        for (var i = 0; i < this.columns; i++) {
	            this.setColumn(i, this.getColumn(i).sort(compareFunction));
	        }
	        return this;
	    }

	    /**
	     * Returns a subset of the matrix
	     * @param {number} startRow - First row index
	     * @param {number} endRow - Last row index
	     * @param {number} startColumn - First column index
	     * @param {number} endColumn - Last column index
	     * @returns {Matrix}
	     */
	    subMatrix(startRow, endRow, startColumn, endColumn) {
	        if ((startRow > endRow) || (startColumn > endColumn) || (startRow < 0) || (startRow >= this.rows) || (endRow < 0) || (endRow >= this.rows) || (startColumn < 0) || (startColumn >= this.columns) || (endColumn < 0) || (endColumn >= this.columns)) {
	            throw new RangeError('Argument out of range');
	        }
	        var newMatrix = new Matrix(endRow - startRow + 1, endColumn - startColumn + 1);
	        for (var i = startRow; i <= endRow; i++) {
	            for (var j = startColumn; j <= endColumn; j++) {
	                newMatrix[i - startRow][j - startColumn] = this[i][j];
	            }
	        }
	        return newMatrix;
	    }

	    /**
	     * Returns a subset of the matrix based on an array of row indices
	     * @param {Array} indices - Array containing the row indices
	     * @param {number} [startColumn = 0] - First column index
	     * @param {number} [endColumn = this.columns-1] - Last column index
	     * @returns {Matrix}
	     */
	    subMatrixRow(indices, startColumn, endColumn) {
	        if (startColumn === undefined) startColumn = 0;
	        if (endColumn === undefined) endColumn = this.columns - 1;
	        if ((startColumn > endColumn) || (startColumn < 0) || (startColumn >= this.columns) || (endColumn < 0) || (endColumn >= this.columns)) {
	            throw new RangeError('Argument out of range');
	        }

	        var newMatrix = new Matrix(indices.length, endColumn - startColumn + 1);
	        for (var i = 0; i < indices.length; i++) {
	            for (var j = startColumn; j <= endColumn; j++) {
	                if (indices[i] < 0 || indices[i] >= this.rows) {
	                    throw new RangeError('Row index out of range: ' + indices[i]);
	                }
	                newMatrix[i][j - startColumn] = this[indices[i]][j];
	            }
	        }
	        return newMatrix;
	    }

	    /**
	     * Returns a subset of the matrix based on an array of column indices
	     * @param {Array} indices - Array containing the column indices
	     * @param {number} [startRow = 0] - First row index
	     * @param {number} [endRow = this.rows-1] - Last row index
	     * @returns {Matrix}
	     */
	    subMatrixColumn(indices, startRow, endRow) {
	        if (startRow === undefined) startRow = 0;
	        if (endRow === undefined) endRow = this.rows - 1;
	        if ((startRow > endRow) || (startRow < 0) || (startRow >= this.rows) || (endRow < 0) || (endRow >= this.rows)) {
	            throw new RangeError('Argument out of range');
	        }

	        var newMatrix = new Matrix(endRow - startRow + 1, indices.length);
	        for (var i = 0; i < indices.length; i++) {
	            for (var j = startRow; j <= endRow; j++) {
	                if (indices[i] < 0 || indices[i] >= this.columns) {
	                    throw new RangeError('Column index out of range: ' + indices[i]);
	                }
	                newMatrix[j - startRow][i] = this[j][indices[i]];
	            }
	        }
	        return newMatrix;
	    }

	    /**
	     * Returns the trace of the matrix (sum of the diagonal elements)
	     * @returns {number}
	     */
	    trace() {
	        var min = Math.min(this.rows, this.columns);
	        var trace = 0;
	        for (var i = 0; i < min; i++) {
	            trace += this[i][i];
	        }
	        return trace;
	    }
	}

	Matrix.prototype.klass = 'Matrix';

	module.exports = Matrix;

	/**
	 * @private
	 * Check that a row index is not out of bounds
	 * @param {Matrix} matrix
	 * @param {number} index
	 * @param {boolean} [outer]
	 */
	function checkRowIndex(matrix, index, outer) {
	    var max = outer ? matrix.rows : matrix.rows - 1;
	    if (index < 0 || index > max)
	        throw new RangeError('Row index out of range');
	}

	/**
	 * @private
	 * Check that the provided vector is an array with the right length
	 * @param {Matrix} matrix
	 * @param {Array|Matrix} vector
	 * @param {boolean} copy
	 * @returns {Array}
	 * @throws {RangeError}
	 */
	function checkRowVector(matrix, vector, copy) {
	    if (Matrix.isMatrix(vector)) {
	        vector = vector.to1DArray();
	    } else if (copy) {
	        vector = [].concat(vector);
	    }
	    if (vector.length !== matrix.columns)
	        throw new RangeError('vector size must be the same as the number of columns');
	    return vector;
	}

	/**
	 * @private
	 * Check that the provided vector is an array with the right length
	 * @param {Matrix} matrix
	 * @param {Array|Matrix} vector
	 * @param {boolean} copy
	 * @returns {Array}
	 * @throws {RangeError}
	 */
	function checkColumnVector(matrix, vector, copy) {
	    if (Matrix.isMatrix(vector)) {
	        vector = vector.to1DArray();
	    } else if (copy) {
	        vector = [].concat(vector);
	    }
	    if (vector.length !== matrix.rows)
	        throw new RangeError('vector size must be the same as the number of rows');
	    return vector;
	}

	/**
	 * @private
	 * Check that a column index is not out of bounds
	 * @param {Matrix} matrix
	 * @param {number} index
	 * @param {boolean} [outer]
	 */
	function checkColumnIndex(matrix, index, outer) {
	    var max = outer ? matrix.columns : matrix.columns - 1;
	    if (index < 0 || index > max)
	        throw new RangeError('Column index out of range');
	}

	/**
	 * @private
	 * Check that two matrices have the same dimensions
	 * @param {Matrix} matrix
	 * @param {Matrix} otherMatrix
	 */
	function checkDimensions(matrix, otherMatrix) {
	    if (matrix.rows !== otherMatrix.length ||
	        matrix.columns !== otherMatrix[0].length) {
	        throw new RangeError('Matrices dimensions must be equal');
	    }
	}

	function compareNumbers(a, b) {
	    return a - b;
	}

	/*
	Synonyms
	 */

	Matrix.random = Matrix.rand;
	Matrix.diagonal = Matrix.diag;
	Matrix.prototype.diagonal = Matrix.prototype.diag;
	Matrix.identity = Matrix.eye;
	Matrix.prototype.negate = Matrix.prototype.neg;
	Matrix.prototype.tensorProduct = Matrix.prototype.kroneckerProduct;

	/*
	Add dynamically instance and static methods for mathematical operations
	 */

	var inplaceOperator = `
	(function %name%(value) {
	    if (typeof value === 'number') return this.%name%S(value);
	    return this.%name%M(value);
	})
	`;

	var inplaceOperatorScalar = `
	(function %name%S(value) {
	    for (var i = 0; i < this.rows; i++) {
	        for (var j = 0; j < this.columns; j++) {
	            this[i][j] = this[i][j] %op% value;
	        }
	    }
	    return this;
	})
	`;

	var inplaceOperatorMatrix = `
	(function %name%M(matrix) {
	    checkDimensions(this, matrix);
	    for (var i = 0; i < this.rows; i++) {
	        for (var j = 0; j < this.columns; j++) {
	            this[i][j] = this[i][j] %op% matrix[i][j];
	        }
	    }
	    return this;
	})
	`;

	var staticOperator = `
	(function %name%(matrix, value) {
	    var newMatrix = new Matrix(matrix);
	    return newMatrix.%name%(value);
	})
	`;

	var inplaceMethod = `
	(function %name%() {
	    for (var i = 0; i < this.rows; i++) {
	        for (var j = 0; j < this.columns; j++) {
	            this[i][j] = %method%(this[i][j]);
	        }
	    }
	    return this;
	})
	`;

	var staticMethod = `
	(function %name%(matrix) {
	    var newMatrix = new Matrix(matrix);
	    return newMatrix.%name%();
	})
	`;

	var operators = [
	    // Arithmetic operators
	    ['+', 'add'],
	    ['-', 'sub', 'subtract'],
	    ['*', 'mul', 'multiply'],
	    ['/', 'div', 'divide'],
	    ['%', 'mod', 'modulus'],
	    // Bitwise operators
	    ['&', 'and'],
	    ['|', 'or'],
	    ['^', 'xor'],
	    ['<<', 'leftShift'],
	    ['>>', 'signPropagatingRightShift'],
	    ['>>>', 'rightShift', 'zeroFillRightShift']
	];

	for (var operator of operators) {
	    for (var i = 1; i < operator.length; i++) {
	        Matrix.prototype[operator[i]] = eval(fillTemplateFunction(inplaceOperator, {name: operator[i], op: operator[0]}));
	        Matrix.prototype[operator[i] + 'S'] = eval(fillTemplateFunction(inplaceOperatorScalar, {name: operator[i] + 'S', op: operator[0]}));
	        Matrix.prototype[operator[i] + 'M'] = eval(fillTemplateFunction(inplaceOperatorMatrix, {name: operator[i] + 'M', op: operator[0]}));

	        Matrix[operator[i]] = eval(fillTemplateFunction(staticOperator, {name: operator[i]}));
	    }
	}

	var methods = [
	    ['~', 'not']
	];

	[
	    'abs', 'acos', 'acosh', 'asin', 'asinh', 'atan', 'atanh', 'cbrt', 'ceil',
	    'clz32', 'cos', 'cosh', 'exp', 'expm1', 'floor', 'fround', 'log', 'log1p',
	    'log10', 'log2', 'round', 'sign', 'sin', 'sinh', 'sqrt', 'tan', 'tanh', 'trunc'
	].forEach(function (mathMethod) {
	    methods.push(['Math.' + mathMethod, mathMethod]);
	});

	for (var method of methods) {
	    for (var i = 1; i < method.length; i++) {
	        Matrix.prototype[method[i]] = eval(fillTemplateFunction(inplaceMethod, {name: method[i], method: method[0]}));
	        Matrix[method[i]] = eval(fillTemplateFunction(staticMethod, {name: method[i]}));
	    }
	}

	function fillTemplateFunction(template, values) {
	    for (var i in values) {
	        template = template.replace(new RegExp('%' + i + '%', 'g'), values[i]);
	    }
	    return template;
	}


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var Matrix = __webpack_require__(3);

	var SingularValueDecomposition = __webpack_require__(5);
	var EigenvalueDecomposition = __webpack_require__(7);
	var LuDecomposition = __webpack_require__(8);
	var QrDecomposition = __webpack_require__(9);
	var CholeskyDecomposition = __webpack_require__(10);

	function inverse(matrix) {
	    matrix = Matrix.checkMatrix(matrix);
	    return solve(matrix, Matrix.eye(matrix.rows));
	}

	Matrix.inverse = Matrix.inv = inverse;
	Matrix.prototype.inverse = Matrix.prototype.inv = function () {
	    return inverse(this);
	};

	function solve(leftHandSide, rightHandSide) {
	    leftHandSide = Matrix.checkMatrix(leftHandSide);
	    rightHandSide = Matrix.checkMatrix(rightHandSide);
	    return leftHandSide.isSquare() ? new LuDecomposition(leftHandSide).solve(rightHandSide) : new QrDecomposition(leftHandSide).solve(rightHandSide);
	}

	Matrix.solve = solve;
	Matrix.prototype.solve = function (other) {
	    return solve(this, other);
	};

	module.exports = {
	    SingularValueDecomposition: SingularValueDecomposition,
	    SVD: SingularValueDecomposition,
	    EigenvalueDecomposition: EigenvalueDecomposition,
	    EVD: EigenvalueDecomposition,
	    LuDecomposition: LuDecomposition,
	    LU: LuDecomposition,
	    QrDecomposition: QrDecomposition,
	    QR: QrDecomposition,
	    CholeskyDecomposition: CholeskyDecomposition,
	    CHO: CholeskyDecomposition,
	    inverse: inverse,
	    solve: solve
	};


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var Matrix = __webpack_require__(3);
	var util = __webpack_require__(6);
	var hypotenuse = util.hypotenuse;
	var getFilled2DArray = util.getFilled2DArray;

	// https://github.com/lutzroeder/Mapack/blob/master/Source/SingularValueDecomposition.cs
	function SingularValueDecomposition(value, options) {
	    if (!(this instanceof SingularValueDecomposition)) {
	        return new SingularValueDecomposition(value, options);
	    }
	    value = Matrix.checkMatrix(value);

	    options = options || {};

	    var m = value.rows,
	        n = value.columns,
	        nu = Math.min(m, n);

	    var wantu = true, wantv = true;
	    if (options.computeLeftSingularVectors === false)
	        wantu = false;
	    if (options.computeRightSingularVectors === false)
	        wantv = false;
	    var autoTranspose = options.autoTranspose === true;

	    var swapped = false;
	    var a;
	    if (m < n) {
	        if (!autoTranspose) {
	            a = value.clone();
	            console.warn('Computing SVD on a matrix with more columns than rows. Consider enabling autoTranspose');
	        } else {
	            a = value.transpose();
	            m = a.rows;
	            n = a.columns;
	            swapped = true;
	            var aux = wantu;
	            wantu = wantv;
	            wantv = aux;
	        }
	    } else {
	        a = value.clone();
	    }

	    var s = new Array(Math.min(m + 1, n)),
	        U = getFilled2DArray(m, nu, 0),
	        V = getFilled2DArray(n, n, 0),
	        e = new Array(n),
	        work = new Array(m);

	    var nct = Math.min(m - 1, n);
	    var nrt = Math.max(0, Math.min(n - 2, m));

	    var i, j, k, p, t, ks, f, cs, sn, max, kase,
	        scale, sp, spm1, epm1, sk, ek, b, c, shift, g;

	    for (k = 0, max = Math.max(nct, nrt); k < max; k++) {
	        if (k < nct) {
	            s[k] = 0;
	            for (i = k; i < m; i++) {
	                s[k] = hypotenuse(s[k], a[i][k]);
	            }
	            if (s[k] !== 0) {
	                if (a[k][k] < 0) {
	                    s[k] = -s[k];
	                }
	                for (i = k; i < m; i++) {
	                    a[i][k] /= s[k];
	                }
	                a[k][k] += 1;
	            }
	            s[k] = -s[k];
	        }

	        for (j = k + 1; j < n; j++) {
	            if ((k < nct) && (s[k] !== 0)) {
	                t = 0;
	                for (i = k; i < m; i++) {
	                    t += a[i][k] * a[i][j];
	                }
	                t = -t / a[k][k];
	                for (i = k; i < m; i++) {
	                    a[i][j] += t * a[i][k];
	                }
	            }
	            e[j] = a[k][j];
	        }

	        if (wantu && (k < nct)) {
	            for (i = k; i < m; i++) {
	                U[i][k] = a[i][k];
	            }
	        }

	        if (k < nrt) {
	            e[k] = 0;
	            for (i = k + 1; i < n; i++) {
	                e[k] = hypotenuse(e[k], e[i]);
	            }
	            if (e[k] !== 0) {
	                if (e[k + 1] < 0)
	                    e[k] = -e[k];
	                for (i = k + 1; i < n; i++) {
	                    e[i] /= e[k];
	                }
	                e[k + 1] += 1;
	            }
	            e[k] = -e[k];
	            if ((k + 1 < m) && (e[k] !== 0)) {
	                for (i = k + 1; i < m; i++) {
	                    work[i] = 0;
	                }
	                for (j = k + 1; j < n; j++) {
	                    for (i = k + 1; i < m; i++) {
	                        work[i] += e[j] * a[i][j];
	                    }
	                }
	                for (j = k + 1; j < n; j++) {
	                    t = -e[j] / e[k + 1];
	                    for (i = k + 1; i < m; i++) {
	                        a[i][j] += t * work[i];
	                    }
	                }
	            }
	            if (wantv) {
	                for (i = k + 1; i < n; i++) {
	                    V[i][k] = e[i];
	                }
	            }
	        }
	    }

	    p = Math.min(n, m + 1);
	    if (nct < n) {
	        s[nct] = a[nct][nct];
	    }
	    if (m < p) {
	        s[p - 1] = 0;
	    }
	    if (nrt + 1 < p) {
	        e[nrt] = a[nrt][p - 1];
	    }
	    e[p - 1] = 0;

	    if (wantu) {
	        for (j = nct; j < nu; j++) {
	            for (i = 0; i < m; i++) {
	                U[i][j] = 0;
	            }
	            U[j][j] = 1;
	        }
	        for (k = nct - 1; k >= 0; k--) {
	            if (s[k] !== 0) {
	                for (j = k + 1; j < nu; j++) {
	                    t = 0;
	                    for (i = k; i < m; i++) {
	                        t += U[i][k] * U[i][j];
	                    }
	                    t = -t / U[k][k];
	                    for (i = k; i < m; i++) {
	                        U[i][j] += t * U[i][k];
	                    }
	                }
	                for (i = k; i < m; i++) {
	                    U[i][k] = -U[i][k];
	                }
	                U[k][k] = 1 + U[k][k];
	                for (i = 0; i < k - 1; i++) {
	                    U[i][k] = 0;
	                }
	            } else {
	                for (i = 0; i < m; i++) {
	                    U[i][k] = 0;
	                }
	                U[k][k] = 1;
	            }
	        }
	    }

	    if (wantv) {
	        for (k = n - 1; k >= 0; k--) {
	            if ((k < nrt) && (e[k] !== 0)) {
	                for (j = k + 1; j < n; j++) {
	                    t = 0;
	                    for (i = k + 1; i < n; i++) {
	                        t += V[i][k] * V[i][j];
	                    }
	                    t = -t / V[k + 1][k];
	                    for (i = k + 1; i < n; i++) {
	                        V[i][j] += t * V[i][k];
	                    }
	                }
	            }
	            for (i = 0; i < n; i++) {
	                V[i][k] = 0;
	            }
	            V[k][k] = 1;
	        }
	    }

	    var pp = p - 1,
	        iter = 0,
	        eps = Math.pow(2, -52);
	    while (p > 0) {
	        for (k = p - 2; k >= -1; k--) {
	            if (k === -1) {
	                break;
	            }
	            if (Math.abs(e[k]) <= eps * (Math.abs(s[k]) + Math.abs(s[k + 1]))) {
	                e[k] = 0;
	                break;
	            }
	        }
	        if (k === p - 2) {
	            kase = 4;
	        } else {
	            for (ks = p - 1; ks >= k; ks--) {
	                if (ks === k) {
	                    break;
	                }
	                t = (ks !== p ? Math.abs(e[ks]) : 0) + (ks !== k + 1 ? Math.abs(e[ks - 1]) : 0);
	                if (Math.abs(s[ks]) <= eps * t) {
	                    s[ks] = 0;
	                    break;
	                }
	            }
	            if (ks === k) {
	                kase = 3;
	            } else if (ks === p - 1) {
	                kase = 1;
	            } else {
	                kase = 2;
	                k = ks;
	            }
	        }

	        k++;

	        switch (kase) {
	            case 1: {
	                f = e[p - 2];
	                e[p - 2] = 0;
	                for (j = p - 2; j >= k; j--) {
	                    t = hypotenuse(s[j], f);
	                    cs = s[j] / t;
	                    sn = f / t;
	                    s[j] = t;
	                    if (j !== k) {
	                        f = -sn * e[j - 1];
	                        e[j - 1] = cs * e[j - 1];
	                    }
	                    if (wantv) {
	                        for (i = 0; i < n; i++) {
	                            t = cs * V[i][j] + sn * V[i][p - 1];
	                            V[i][p - 1] = -sn * V[i][j] + cs * V[i][p - 1];
	                            V[i][j] = t;
	                        }
	                    }
	                }
	                break;
	            }
	            case 2 : {
	                f = e[k - 1];
	                e[k - 1] = 0;
	                for (j = k; j < p; j++) {
	                    t = hypotenuse(s[j], f);
	                    cs = s[j] / t;
	                    sn = f / t;
	                    s[j] = t;
	                    f = -sn * e[j];
	                    e[j] = cs * e[j];
	                    if (wantu) {
	                        for (i = 0; i < m; i++) {
	                            t = cs * U[i][j] + sn * U[i][k - 1];
	                            U[i][k - 1] = -sn * U[i][j] + cs * U[i][k - 1];
	                            U[i][j] = t;
	                        }
	                    }
	                }
	                break;
	            }
	            case 3 : {
	                scale = Math.max(Math.max(Math.max(Math.max(Math.abs(s[p - 1]), Math.abs(s[p - 2])), Math.abs(e[p - 2])), Math.abs(s[k])), Math.abs(e[k]));
	                sp = s[p - 1] / scale;
	                spm1 = s[p - 2] / scale;
	                epm1 = e[p - 2] / scale;
	                sk = s[k] / scale;
	                ek = e[k] / scale;
	                b = ((spm1 + sp) * (spm1 - sp) + epm1 * epm1) / 2;
	                c = (sp * epm1) * (sp * epm1);
	                shift = 0;
	                if ((b !== 0) || (c !== 0)) {
	                    shift = Math.sqrt(b * b + c);
	                    if (b < 0) {
	                        shift = -shift;
	                    }
	                    shift = c / (b + shift);
	                }
	                f = (sk + sp) * (sk - sp) + shift;
	                g = sk * ek;
	                for (j = k; j < p - 1; j++) {
	                    t = hypotenuse(f, g);
	                    cs = f / t;
	                    sn = g / t;
	                    if (j !== k) {
	                        e[j - 1] = t;
	                    }
	                    f = cs * s[j] + sn * e[j];
	                    e[j] = cs * e[j] - sn * s[j];
	                    g = sn * s[j + 1];
	                    s[j + 1] = cs * s[j + 1];
	                    if (wantv) {
	                        for (i = 0; i < n; i++) {
	                            t = cs * V[i][j] + sn * V[i][j + 1];
	                            V[i][j + 1] = -sn * V[i][j] + cs * V[i][j + 1];
	                            V[i][j] = t;
	                        }
	                    }
	                    t = hypotenuse(f, g);
	                    cs = f / t;
	                    sn = g / t;
	                    s[j] = t;
	                    f = cs * e[j] + sn * s[j + 1];
	                    s[j + 1] = -sn * e[j] + cs * s[j + 1];
	                    g = sn * e[j + 1];
	                    e[j + 1] = cs * e[j + 1];
	                    if (wantu && (j < m - 1)) {
	                        for (i = 0; i < m; i++) {
	                            t = cs * U[i][j] + sn * U[i][j + 1];
	                            U[i][j + 1] = -sn * U[i][j] + cs * U[i][j + 1];
	                            U[i][j] = t;
	                        }
	                    }
	                }
	                e[p - 2] = f;
	                iter = iter + 1;
	                break;
	            }
	            case 4: {
	                if (s[k] <= 0) {
	                    s[k] = (s[k] < 0 ? -s[k] : 0);
	                    if (wantv) {
	                        for (i = 0; i <= pp; i++) {
	                            V[i][k] = -V[i][k];
	                        }
	                    }
	                }
	                while (k < pp) {
	                    if (s[k] >= s[k + 1]) {
	                        break;
	                    }
	                    t = s[k];
	                    s[k] = s[k + 1];
	                    s[k + 1] = t;
	                    if (wantv && (k < n - 1)) {
	                        for (i = 0; i < n; i++) {
	                            t = V[i][k + 1];
	                            V[i][k + 1] = V[i][k];
	                            V[i][k] = t;
	                        }
	                    }
	                    if (wantu && (k < m - 1)) {
	                        for (i = 0; i < m; i++) {
	                            t = U[i][k + 1];
	                            U[i][k + 1] = U[i][k];
	                            U[i][k] = t;
	                        }
	                    }
	                    k++;
	                }
	                iter = 0;
	                p--;
	                break;
	            }
	        }
	    }

	    if (swapped) {
	        var tmp = V;
	        V = U;
	        U = tmp;
	    }

	    this.m = m;
	    this.n = n;
	    this.s = s;
	    this.U = U;
	    this.V = V;
	}

	SingularValueDecomposition.prototype = {
	    get condition() {
	        return this.s[0] / this.s[Math.min(this.m, this.n) - 1];
	    },
	    get norm2() {
	        return this.s[0];
	    },
	    get rank() {
	        var eps = Math.pow(2, -52),
	            tol = Math.max(this.m, this.n) * this.s[0] * eps,
	            r = 0,
	            s = this.s;
	        for (var i = 0, ii = s.length; i < ii; i++) {
	            if (s[i] > tol) {
	                r++;
	            }
	        }
	        return r;
	    },
	    get diagonal() {
	        return this.s;
	    },
	    // https://github.com/accord-net/framework/blob/development/Sources/Accord.Math/Decompositions/SingularValueDecomposition.cs
	    get threshold() {
	        return (Math.pow(2, -52) / 2) * Math.max(this.m, this.n) * this.s[0];
	    },
	    get leftSingularVectors() {
	        if (!Matrix.isMatrix(this.U)) {
	            this.U = new Matrix(this.U);
	        }
	        return this.U;
	    },
	    get rightSingularVectors() {
	        if (!Matrix.isMatrix(this.V)) {
	            this.V = new Matrix(this.V);
	        }
	        return this.V;
	    },
	    get diagonalMatrix() {
	        return Matrix.diag(this.s);
	    },
	    solve: function (value) {

	        var Y = value,
	            e = this.threshold,
	            scols = this.s.length,
	            Ls = Matrix.zeros(scols, scols),
	            i;

	        for (i = 0; i < scols; i++) {
	            if (Math.abs(this.s[i]) <= e) {
	                Ls[i][i] = 0;
	            } else {
	                Ls[i][i] = 1 / this.s[i];
	            }
	        }

	        var U = this.U;
	        var V = this.rightSingularVectors;

	        var VL = V.mmul(Ls),
	            vrows = V.rows,
	            urows = U.length,
	            VLU = Matrix.zeros(vrows, urows),
	            j, k, sum;

	        for (i = 0; i < vrows; i++) {
	            for (j = 0; j < urows; j++) {
	                sum = 0;
	                for (k = 0; k < scols; k++) {
	                    sum += VL[i][k] * U[j][k];
	                }
	                VLU[i][j] = sum;
	            }
	        }

	        return VLU.mmul(Y);
	    },
	    solveForDiagonal: function (value) {
	        return this.solve(Matrix.diag(value));
	    },
	    inverse: function () {
	        var V = this.V;
	        var e = this.threshold,
	            vrows = V.length,
	            vcols = V[0].length,
	            X = new Matrix(vrows, this.s.length),
	            i, j;

	        for (i = 0; i < vrows; i++) {
	            for (j = 0; j < vcols; j++) {
	                if (Math.abs(this.s[j]) > e) {
	                    X[i][j] = V[i][j] / this.s[j];
	                } else {
	                    X[i][j] = 0;
	                }
	            }
	        }

	        var U = this.U;

	        var urows = U.length,
	            ucols = U[0].length,
	            Y = new Matrix(vrows, urows),
	            k, sum;

	        for (i = 0; i < vrows; i++) {
	            for (j = 0; j < urows; j++) {
	                sum = 0;
	                for (k = 0; k < ucols; k++) {
	                    sum += X[i][k] * U[j][k];
	                }
	                Y[i][j] = sum;
	            }
	        }

	        return Y;
	    }
	};

	module.exports = SingularValueDecomposition;


/***/ },
/* 6 */
/***/ function(module, exports) {

	'use strict';

	exports.hypotenuse = function hypotenuse(a, b) {
	    if (Math.abs(a) > Math.abs(b)) {
	        var r = b / a;
	        return Math.abs(a) * Math.sqrt(1 + r * r);
	    }
	    if (b !== 0) {
	        var r = a / b;
	        return Math.abs(b) * Math.sqrt(1 + r * r);
	    }
	    return 0;
	};

	// For use in the decomposition algorithms. With big matrices, access time is
	// too long on elements from array subclass
	// todo check when it is fixed in v8
	// http://jsperf.com/access-and-write-array-subclass
	exports.getEmpty2DArray = function (rows, columns) {
	    var array = new Array(rows);
	    for (var i = 0; i < rows; i++) {
	        array[i] = new Array(columns);
	    }
	    return array;
	};

	exports.getFilled2DArray = function (rows, columns, value) {
	    var array = new Array(rows);
	    for (var i = 0; i < rows; i++) {
	        array[i] = new Array(columns);
	        for (var j = 0; j < columns; j++) {
	            array[i][j] = value;
	        }
	    }
	    return array;
	};


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var Matrix = __webpack_require__(3);
	var util = __webpack_require__(6);
	var hypotenuse = util.hypotenuse;
	var getFilled2DArray = util.getFilled2DArray;

	// https://github.com/lutzroeder/Mapack/blob/master/Source/EigenvalueDecomposition.cs
	function EigenvalueDecomposition(matrix) {
	    if (!(this instanceof EigenvalueDecomposition)) {
	        return new EigenvalueDecomposition(matrix);
	    }
	    matrix = Matrix.checkMatrix(matrix);
	    if (!matrix.isSquare()) {
	        throw new Error('Matrix is not a square matrix');
	    }

	    var n = matrix.columns,
	        V = getFilled2DArray(n, n, 0),
	        d = new Array(n),
	        e = new Array(n),
	        value = matrix,
	        i, j;

	    if (matrix.isSymmetric()) {
	        for (i = 0; i < n; i++) {
	            for (j = 0; j < n; j++) {
	                V[i][j] = value.get(i, j);
	            }
	        }
	        tred2(n, e, d, V);
	        tql2(n, e, d, V);
	    }
	    else {
	        var H = getFilled2DArray(n, n, 0),
	            ort = new Array(n);
	        for (j = 0; j < n; j++) {
	            for (i = 0; i < n; i++) {
	                H[i][j] = value.get(i, j);
	            }
	        }
	        orthes(n, H, ort, V);
	        hqr2(n, e, d, V, H);
	    }

	    this.n = n;
	    this.e = e;
	    this.d = d;
	    this.V = V;
	}

	EigenvalueDecomposition.prototype = {
	    get realEigenvalues() {
	        return this.d;
	    },
	    get imaginaryEigenvalues() {
	        return this.e;
	    },
	    get eigenvectorMatrix() {
	        if (!Matrix.isMatrix(this.V)) {
	            this.V = new Matrix(this.V);
	        }
	        return this.V;
	    },
	    get diagonalMatrix() {
	        var n = this.n,
	            e = this.e,
	            d = this.d,
	            X = new Matrix(n, n),
	            i, j;
	        for (i = 0; i < n; i++) {
	            for (j = 0; j < n; j++) {
	                X[i][j] = 0;
	            }
	            X[i][i] = d[i];
	            if (e[i] > 0) {
	                X[i][i + 1] = e[i];
	            }
	            else if (e[i] < 0) {
	                X[i][i - 1] = e[i];
	            }
	        }
	        return X;
	    }
	};

	function tred2(n, e, d, V) {

	    var f, g, h, i, j, k,
	        hh, scale;

	    for (j = 0; j < n; j++) {
	        d[j] = V[n - 1][j];
	    }

	    for (i = n - 1; i > 0; i--) {
	        scale = 0;
	        h = 0;
	        for (k = 0; k < i; k++) {
	            scale = scale + Math.abs(d[k]);
	        }

	        if (scale === 0) {
	            e[i] = d[i - 1];
	            for (j = 0; j < i; j++) {
	                d[j] = V[i - 1][j];
	                V[i][j] = 0;
	                V[j][i] = 0;
	            }
	        } else {
	            for (k = 0; k < i; k++) {
	                d[k] /= scale;
	                h += d[k] * d[k];
	            }

	            f = d[i - 1];
	            g = Math.sqrt(h);
	            if (f > 0) {
	                g = -g;
	            }

	            e[i] = scale * g;
	            h = h - f * g;
	            d[i - 1] = f - g;
	            for (j = 0; j < i; j++) {
	                e[j] = 0;
	            }

	            for (j = 0; j < i; j++) {
	                f = d[j];
	                V[j][i] = f;
	                g = e[j] + V[j][j] * f;
	                for (k = j + 1; k <= i - 1; k++) {
	                    g += V[k][j] * d[k];
	                    e[k] += V[k][j] * f;
	                }
	                e[j] = g;
	            }

	            f = 0;
	            for (j = 0; j < i; j++) {
	                e[j] /= h;
	                f += e[j] * d[j];
	            }

	            hh = f / (h + h);
	            for (j = 0; j < i; j++) {
	                e[j] -= hh * d[j];
	            }

	            for (j = 0; j < i; j++) {
	                f = d[j];
	                g = e[j];
	                for (k = j; k <= i - 1; k++) {
	                    V[k][j] -= (f * e[k] + g * d[k]);
	                }
	                d[j] = V[i - 1][j];
	                V[i][j] = 0;
	            }
	        }
	        d[i] = h;
	    }

	    for (i = 0; i < n - 1; i++) {
	        V[n - 1][i] = V[i][i];
	        V[i][i] = 1;
	        h = d[i + 1];
	        if (h !== 0) {
	            for (k = 0; k <= i; k++) {
	                d[k] = V[k][i + 1] / h;
	            }

	            for (j = 0; j <= i; j++) {
	                g = 0;
	                for (k = 0; k <= i; k++) {
	                    g += V[k][i + 1] * V[k][j];
	                }
	                for (k = 0; k <= i; k++) {
	                    V[k][j] -= g * d[k];
	                }
	            }
	        }

	        for (k = 0; k <= i; k++) {
	            V[k][i + 1] = 0;
	        }
	    }

	    for (j = 0; j < n; j++) {
	        d[j] = V[n - 1][j];
	        V[n - 1][j] = 0;
	    }

	    V[n - 1][n - 1] = 1;
	    e[0] = 0;
	}

	function tql2(n, e, d, V) {

	    var g, h, i, j, k, l, m, p, r,
	        dl1, c, c2, c3, el1, s, s2,
	        iter;

	    for (i = 1; i < n; i++) {
	        e[i - 1] = e[i];
	    }

	    e[n - 1] = 0;

	    var f = 0,
	        tst1 = 0,
	        eps = Math.pow(2, -52);

	    for (l = 0; l < n; l++) {
	        tst1 = Math.max(tst1, Math.abs(d[l]) + Math.abs(e[l]));
	        m = l;
	        while (m < n) {
	            if (Math.abs(e[m]) <= eps * tst1) {
	                break;
	            }
	            m++;
	        }

	        if (m > l) {
	            iter = 0;
	            do {
	                iter = iter + 1;

	                g = d[l];
	                p = (d[l + 1] - g) / (2 * e[l]);
	                r = hypotenuse(p, 1);
	                if (p < 0) {
	                    r = -r;
	                }

	                d[l] = e[l] / (p + r);
	                d[l + 1] = e[l] * (p + r);
	                dl1 = d[l + 1];
	                h = g - d[l];
	                for (i = l + 2; i < n; i++) {
	                    d[i] -= h;
	                }

	                f = f + h;

	                p = d[m];
	                c = 1;
	                c2 = c;
	                c3 = c;
	                el1 = e[l + 1];
	                s = 0;
	                s2 = 0;
	                for (i = m - 1; i >= l; i--) {
	                    c3 = c2;
	                    c2 = c;
	                    s2 = s;
	                    g = c * e[i];
	                    h = c * p;
	                    r = hypotenuse(p, e[i]);
	                    e[i + 1] = s * r;
	                    s = e[i] / r;
	                    c = p / r;
	                    p = c * d[i] - s * g;
	                    d[i + 1] = h + s * (c * g + s * d[i]);

	                    for (k = 0; k < n; k++) {
	                        h = V[k][i + 1];
	                        V[k][i + 1] = s * V[k][i] + c * h;
	                        V[k][i] = c * V[k][i] - s * h;
	                    }
	                }

	                p = -s * s2 * c3 * el1 * e[l] / dl1;
	                e[l] = s * p;
	                d[l] = c * p;

	            }
	            while (Math.abs(e[l]) > eps * tst1);
	        }
	        d[l] = d[l] + f;
	        e[l] = 0;
	    }

	    for (i = 0; i < n - 1; i++) {
	        k = i;
	        p = d[i];
	        for (j = i + 1; j < n; j++) {
	            if (d[j] < p) {
	                k = j;
	                p = d[j];
	            }
	        }

	        if (k !== i) {
	            d[k] = d[i];
	            d[i] = p;
	            for (j = 0; j < n; j++) {
	                p = V[j][i];
	                V[j][i] = V[j][k];
	                V[j][k] = p;
	            }
	        }
	    }
	}

	function orthes(n, H, ort, V) {

	    var low = 0,
	        high = n - 1,
	        f, g, h, i, j, m,
	        scale;

	    for (m = low + 1; m <= high - 1; m++) {
	        scale = 0;
	        for (i = m; i <= high; i++) {
	            scale = scale + Math.abs(H[i][m - 1]);
	        }

	        if (scale !== 0) {
	            h = 0;
	            for (i = high; i >= m; i--) {
	                ort[i] = H[i][m - 1] / scale;
	                h += ort[i] * ort[i];
	            }

	            g = Math.sqrt(h);
	            if (ort[m] > 0) {
	                g = -g;
	            }

	            h = h - ort[m] * g;
	            ort[m] = ort[m] - g;

	            for (j = m; j < n; j++) {
	                f = 0;
	                for (i = high; i >= m; i--) {
	                    f += ort[i] * H[i][j];
	                }

	                f = f / h;
	                for (i = m; i <= high; i++) {
	                    H[i][j] -= f * ort[i];
	                }
	            }

	            for (i = 0; i <= high; i++) {
	                f = 0;
	                for (j = high; j >= m; j--) {
	                    f += ort[j] * H[i][j];
	                }

	                f = f / h;
	                for (j = m; j <= high; j++) {
	                    H[i][j] -= f * ort[j];
	                }
	            }

	            ort[m] = scale * ort[m];
	            H[m][m - 1] = scale * g;
	        }
	    }

	    for (i = 0; i < n; i++) {
	        for (j = 0; j < n; j++) {
	            V[i][j] = (i === j ? 1 : 0);
	        }
	    }

	    for (m = high - 1; m >= low + 1; m--) {
	        if (H[m][m - 1] !== 0) {
	            for (i = m + 1; i <= high; i++) {
	                ort[i] = H[i][m - 1];
	            }

	            for (j = m; j <= high; j++) {
	                g = 0;
	                for (i = m; i <= high; i++) {
	                    g += ort[i] * V[i][j];
	                }

	                g = (g / ort[m]) / H[m][m - 1];
	                for (i = m; i <= high; i++) {
	                    V[i][j] += g * ort[i];
	                }
	            }
	        }
	    }
	}

	function hqr2(nn, e, d, V, H) {
	    var n = nn - 1,
	        low = 0,
	        high = nn - 1,
	        eps = Math.pow(2, -52),
	        exshift = 0,
	        norm = 0,
	        p = 0,
	        q = 0,
	        r = 0,
	        s = 0,
	        z = 0,
	        iter = 0,
	        i, j, k, l, m, t, w, x, y,
	        ra, sa, vr, vi,
	        notlast, cdivres;

	    for (i = 0; i < nn; i++) {
	        if (i < low || i > high) {
	            d[i] = H[i][i];
	            e[i] = 0;
	        }

	        for (j = Math.max(i - 1, 0); j < nn; j++) {
	            norm = norm + Math.abs(H[i][j]);
	        }
	    }

	    while (n >= low) {
	        l = n;
	        while (l > low) {
	            s = Math.abs(H[l - 1][l - 1]) + Math.abs(H[l][l]);
	            if (s === 0) {
	                s = norm;
	            }
	            if (Math.abs(H[l][l - 1]) < eps * s) {
	                break;
	            }
	            l--;
	        }

	        if (l === n) {
	            H[n][n] = H[n][n] + exshift;
	            d[n] = H[n][n];
	            e[n] = 0;
	            n--;
	            iter = 0;
	        } else if (l === n - 1) {
	            w = H[n][n - 1] * H[n - 1][n];
	            p = (H[n - 1][n - 1] - H[n][n]) / 2;
	            q = p * p + w;
	            z = Math.sqrt(Math.abs(q));
	            H[n][n] = H[n][n] + exshift;
	            H[n - 1][n - 1] = H[n - 1][n - 1] + exshift;
	            x = H[n][n];

	            if (q >= 0) {
	                z = (p >= 0) ? (p + z) : (p - z);
	                d[n - 1] = x + z;
	                d[n] = d[n - 1];
	                if (z !== 0) {
	                    d[n] = x - w / z;
	                }
	                e[n - 1] = 0;
	                e[n] = 0;
	                x = H[n][n - 1];
	                s = Math.abs(x) + Math.abs(z);
	                p = x / s;
	                q = z / s;
	                r = Math.sqrt(p * p + q * q);
	                p = p / r;
	                q = q / r;

	                for (j = n - 1; j < nn; j++) {
	                    z = H[n - 1][j];
	                    H[n - 1][j] = q * z + p * H[n][j];
	                    H[n][j] = q * H[n][j] - p * z;
	                }

	                for (i = 0; i <= n; i++) {
	                    z = H[i][n - 1];
	                    H[i][n - 1] = q * z + p * H[i][n];
	                    H[i][n] = q * H[i][n] - p * z;
	                }

	                for (i = low; i <= high; i++) {
	                    z = V[i][n - 1];
	                    V[i][n - 1] = q * z + p * V[i][n];
	                    V[i][n] = q * V[i][n] - p * z;
	                }
	            } else {
	                d[n - 1] = x + p;
	                d[n] = x + p;
	                e[n - 1] = z;
	                e[n] = -z;
	            }

	            n = n - 2;
	            iter = 0;
	        } else {
	            x = H[n][n];
	            y = 0;
	            w = 0;
	            if (l < n) {
	                y = H[n - 1][n - 1];
	                w = H[n][n - 1] * H[n - 1][n];
	            }

	            if (iter === 10) {
	                exshift += x;
	                for (i = low; i <= n; i++) {
	                    H[i][i] -= x;
	                }
	                s = Math.abs(H[n][n - 1]) + Math.abs(H[n - 1][n - 2]);
	                x = y = 0.75 * s;
	                w = -0.4375 * s * s;
	            }

	            if (iter === 30) {
	                s = (y - x) / 2;
	                s = s * s + w;
	                if (s > 0) {
	                    s = Math.sqrt(s);
	                    if (y < x) {
	                        s = -s;
	                    }
	                    s = x - w / ((y - x) / 2 + s);
	                    for (i = low; i <= n; i++) {
	                        H[i][i] -= s;
	                    }
	                    exshift += s;
	                    x = y = w = 0.964;
	                }
	            }

	            iter = iter + 1;

	            m = n - 2;
	            while (m >= l) {
	                z = H[m][m];
	                r = x - z;
	                s = y - z;
	                p = (r * s - w) / H[m + 1][m] + H[m][m + 1];
	                q = H[m + 1][m + 1] - z - r - s;
	                r = H[m + 2][m + 1];
	                s = Math.abs(p) + Math.abs(q) + Math.abs(r);
	                p = p / s;
	                q = q / s;
	                r = r / s;
	                if (m === l) {
	                    break;
	                }
	                if (Math.abs(H[m][m - 1]) * (Math.abs(q) + Math.abs(r)) < eps * (Math.abs(p) * (Math.abs(H[m - 1][m - 1]) + Math.abs(z) + Math.abs(H[m + 1][m + 1])))) {
	                    break;
	                }
	                m--;
	            }

	            for (i = m + 2; i <= n; i++) {
	                H[i][i - 2] = 0;
	                if (i > m + 2) {
	                    H[i][i - 3] = 0;
	                }
	            }

	            for (k = m; k <= n - 1; k++) {
	                notlast = (k !== n - 1);
	                if (k !== m) {
	                    p = H[k][k - 1];
	                    q = H[k + 1][k - 1];
	                    r = (notlast ? H[k + 2][k - 1] : 0);
	                    x = Math.abs(p) + Math.abs(q) + Math.abs(r);
	                    if (x !== 0) {
	                        p = p / x;
	                        q = q / x;
	                        r = r / x;
	                    }
	                }

	                if (x === 0) {
	                    break;
	                }

	                s = Math.sqrt(p * p + q * q + r * r);
	                if (p < 0) {
	                    s = -s;
	                }

	                if (s !== 0) {
	                    if (k !== m) {
	                        H[k][k - 1] = -s * x;
	                    } else if (l !== m) {
	                        H[k][k - 1] = -H[k][k - 1];
	                    }

	                    p = p + s;
	                    x = p / s;
	                    y = q / s;
	                    z = r / s;
	                    q = q / p;
	                    r = r / p;

	                    for (j = k; j < nn; j++) {
	                        p = H[k][j] + q * H[k + 1][j];
	                        if (notlast) {
	                            p = p + r * H[k + 2][j];
	                            H[k + 2][j] = H[k + 2][j] - p * z;
	                        }

	                        H[k][j] = H[k][j] - p * x;
	                        H[k + 1][j] = H[k + 1][j] - p * y;
	                    }

	                    for (i = 0; i <= Math.min(n, k + 3); i++) {
	                        p = x * H[i][k] + y * H[i][k + 1];
	                        if (notlast) {
	                            p = p + z * H[i][k + 2];
	                            H[i][k + 2] = H[i][k + 2] - p * r;
	                        }

	                        H[i][k] = H[i][k] - p;
	                        H[i][k + 1] = H[i][k + 1] - p * q;
	                    }

	                    for (i = low; i <= high; i++) {
	                        p = x * V[i][k] + y * V[i][k + 1];
	                        if (notlast) {
	                            p = p + z * V[i][k + 2];
	                            V[i][k + 2] = V[i][k + 2] - p * r;
	                        }

	                        V[i][k] = V[i][k] - p;
	                        V[i][k + 1] = V[i][k + 1] - p * q;
	                    }
	                }
	            }
	        }
	    }

	    if (norm === 0) {
	        return;
	    }

	    for (n = nn - 1; n >= 0; n--) {
	        p = d[n];
	        q = e[n];

	        if (q === 0) {
	            l = n;
	            H[n][n] = 1;
	            for (i = n - 1; i >= 0; i--) {
	                w = H[i][i] - p;
	                r = 0;
	                for (j = l; j <= n; j++) {
	                    r = r + H[i][j] * H[j][n];
	                }

	                if (e[i] < 0) {
	                    z = w;
	                    s = r;
	                } else {
	                    l = i;
	                    if (e[i] === 0) {
	                        H[i][n] = (w !== 0) ? (-r / w) : (-r / (eps * norm));
	                    } else {
	                        x = H[i][i + 1];
	                        y = H[i + 1][i];
	                        q = (d[i] - p) * (d[i] - p) + e[i] * e[i];
	                        t = (x * s - z * r) / q;
	                        H[i][n] = t;
	                        H[i + 1][n] = (Math.abs(x) > Math.abs(z)) ? ((-r - w * t) / x) : ((-s - y * t) / z);
	                    }

	                    t = Math.abs(H[i][n]);
	                    if ((eps * t) * t > 1) {
	                        for (j = i; j <= n; j++) {
	                            H[j][n] = H[j][n] / t;
	                        }
	                    }
	                }
	            }
	        } else if (q < 0) {
	            l = n - 1;

	            if (Math.abs(H[n][n - 1]) > Math.abs(H[n - 1][n])) {
	                H[n - 1][n - 1] = q / H[n][n - 1];
	                H[n - 1][n] = -(H[n][n] - p) / H[n][n - 1];
	            } else {
	                cdivres = cdiv(0, -H[n - 1][n], H[n - 1][n - 1] - p, q);
	                H[n - 1][n - 1] = cdivres[0];
	                H[n - 1][n] = cdivres[1];
	            }

	            H[n][n - 1] = 0;
	            H[n][n] = 1;
	            for (i = n - 2; i >= 0; i--) {
	                ra = 0;
	                sa = 0;
	                for (j = l; j <= n; j++) {
	                    ra = ra + H[i][j] * H[j][n - 1];
	                    sa = sa + H[i][j] * H[j][n];
	                }

	                w = H[i][i] - p;

	                if (e[i] < 0) {
	                    z = w;
	                    r = ra;
	                    s = sa;
	                } else {
	                    l = i;
	                    if (e[i] === 0) {
	                        cdivres = cdiv(-ra, -sa, w, q);
	                        H[i][n - 1] = cdivres[0];
	                        H[i][n] = cdivres[1];
	                    } else {
	                        x = H[i][i + 1];
	                        y = H[i + 1][i];
	                        vr = (d[i] - p) * (d[i] - p) + e[i] * e[i] - q * q;
	                        vi = (d[i] - p) * 2 * q;
	                        if (vr === 0 && vi === 0) {
	                            vr = eps * norm * (Math.abs(w) + Math.abs(q) + Math.abs(x) + Math.abs(y) + Math.abs(z));
	                        }
	                        cdivres = cdiv(x * r - z * ra + q * sa, x * s - z * sa - q * ra, vr, vi);
	                        H[i][n - 1] = cdivres[0];
	                        H[i][n] = cdivres[1];
	                        if (Math.abs(x) > (Math.abs(z) + Math.abs(q))) {
	                            H[i + 1][n - 1] = (-ra - w * H[i][n - 1] + q * H[i][n]) / x;
	                            H[i + 1][n] = (-sa - w * H[i][n] - q * H[i][n - 1]) / x;
	                        } else {
	                            cdivres = cdiv(-r - y * H[i][n - 1], -s - y * H[i][n], z, q);
	                            H[i + 1][n - 1] = cdivres[0];
	                            H[i + 1][n] = cdivres[1];
	                        }
	                    }

	                    t = Math.max(Math.abs(H[i][n - 1]), Math.abs(H[i][n]));
	                    if ((eps * t) * t > 1) {
	                        for (j = i; j <= n; j++) {
	                            H[j][n - 1] = H[j][n - 1] / t;
	                            H[j][n] = H[j][n] / t;
	                        }
	                    }
	                }
	            }
	        }
	    }

	    for (i = 0; i < nn; i++) {
	        if (i < low || i > high) {
	            for (j = i; j < nn; j++) {
	                V[i][j] = H[i][j];
	            }
	        }
	    }

	    for (j = nn - 1; j >= low; j--) {
	        for (i = low; i <= high; i++) {
	            z = 0;
	            for (k = low; k <= Math.min(j, high); k++) {
	                z = z + V[i][k] * H[k][j];
	            }
	            V[i][j] = z;
	        }
	    }
	}

	function cdiv(xr, xi, yr, yi) {
	    var r, d;
	    if (Math.abs(yr) > Math.abs(yi)) {
	        r = yi / yr;
	        d = yr + r * yi;
	        return [(xr + r * xi) / d, (xi - r * xr) / d];
	    }
	    else {
	        r = yr / yi;
	        d = yi + r * yr;
	        return [(r * xr + xi) / d, (r * xi - xr) / d];
	    }
	}

	module.exports = EigenvalueDecomposition;


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var Matrix = __webpack_require__(3);

	// https://github.com/lutzroeder/Mapack/blob/master/Source/LuDecomposition.cs
	function LuDecomposition(matrix) {
	    if (!(this instanceof LuDecomposition)) {
	        return new LuDecomposition(matrix);
	    }
	    matrix = Matrix.checkMatrix(matrix);

	    var lu = matrix.clone(),
	        rows = lu.rows,
	        columns = lu.columns,
	        pivotVector = new Array(rows),
	        pivotSign = 1,
	        i, j, k, p, s, t, v,
	        LUrowi, LUcolj, kmax;

	    for (i = 0; i < rows; i++) {
	        pivotVector[i] = i;
	    }

	    LUcolj = new Array(rows);

	    for (j = 0; j < columns; j++) {

	        for (i = 0; i < rows; i++) {
	            LUcolj[i] = lu[i][j];
	        }

	        for (i = 0; i < rows; i++) {
	            LUrowi = lu[i];
	            kmax = Math.min(i, j);
	            s = 0;
	            for (k = 0; k < kmax; k++) {
	                s += LUrowi[k] * LUcolj[k];
	            }
	            LUrowi[j] = LUcolj[i] -= s;
	        }

	        p = j;
	        for (i = j + 1; i < rows; i++) {
	            if (Math.abs(LUcolj[i]) > Math.abs(LUcolj[p])) {
	                p = i;
	            }
	        }

	        if (p !== j) {
	            for (k = 0; k < columns; k++) {
	                t = lu[p][k];
	                lu[p][k] = lu[j][k];
	                lu[j][k] = t;
	            }

	            v = pivotVector[p];
	            pivotVector[p] = pivotVector[j];
	            pivotVector[j] = v;

	            pivotSign = -pivotSign;
	        }

	        if (j < rows && lu[j][j] !== 0) {
	            for (i = j + 1; i < rows; i++) {
	                lu[i][j] /= lu[j][j];
	            }
	        }
	    }

	    this.LU = lu;
	    this.pivotVector = pivotVector;
	    this.pivotSign = pivotSign;
	}

	LuDecomposition.prototype = {
	    isSingular: function () {
	        var data = this.LU,
	            col = data.columns;
	        for (var j = 0; j < col; j++) {
	            if (data[j][j] === 0) {
	                return true;
	            }
	        }
	        return false;
	    },
	    get determinant() {
	        var data = this.LU;
	        if (!data.isSquare())
	            throw new Error('Matrix must be square');
	        var determinant = this.pivotSign, col = data.columns;
	        for (var j = 0; j < col; j++)
	            determinant *= data[j][j];
	        return determinant;
	    },
	    get lowerTriangularMatrix() {
	        var data = this.LU,
	            rows = data.rows,
	            columns = data.columns,
	            X = new Matrix(rows, columns);
	        for (var i = 0; i < rows; i++) {
	            for (var j = 0; j < columns; j++) {
	                if (i > j) {
	                    X[i][j] = data[i][j];
	                } else if (i === j) {
	                    X[i][j] = 1;
	                } else {
	                    X[i][j] = 0;
	                }
	            }
	        }
	        return X;
	    },
	    get upperTriangularMatrix() {
	        var data = this.LU,
	            rows = data.rows,
	            columns = data.columns,
	            X = new Matrix(rows, columns);
	        for (var i = 0; i < rows; i++) {
	            for (var j = 0; j < columns; j++) {
	                if (i <= j) {
	                    X[i][j] = data[i][j];
	                } else {
	                    X[i][j] = 0;
	                }
	            }
	        }
	        return X;
	    },
	    get pivotPermutationVector() {
	        return this.pivotVector.slice();
	    },
	    solve: function (value) {
	        value = Matrix.checkMatrix(value);

	        var lu = this.LU,
	            rows = lu.rows;

	        if (rows !== value.rows)
	            throw new Error('Invalid matrix dimensions');
	        if (this.isSingular())
	            throw new Error('LU matrix is singular');

	        var count = value.columns,
	            X = value.subMatrixRow(this.pivotVector, 0, count - 1),
	            columns = lu.columns,
	            i, j, k;

	        for (k = 0; k < columns; k++) {
	            for (i = k + 1; i < columns; i++) {
	                for (j = 0; j < count; j++) {
	                    X[i][j] -= X[k][j] * lu[i][k];
	                }
	            }
	        }
	        for (k = columns - 1; k >= 0; k--) {
	            for (j = 0; j < count; j++) {
	                X[k][j] /= lu[k][k];
	            }
	            for (i = 0; i < k; i++) {
	                for (j = 0; j < count; j++) {
	                    X[i][j] -= X[k][j] * lu[i][k];
	                }
	            }
	        }
	        return X;
	    }
	};

	module.exports = LuDecomposition;


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var Matrix = __webpack_require__(3);
	var hypotenuse = __webpack_require__(6).hypotenuse;

	//https://github.com/lutzroeder/Mapack/blob/master/Source/QrDecomposition.cs
	function QrDecomposition(value) {
	    if (!(this instanceof QrDecomposition)) {
	        return new QrDecomposition(value);
	    }
	    value = Matrix.checkMatrix(value);

	    var qr = value.clone(),
	        m = value.rows,
	        n = value.columns,
	        rdiag = new Array(n),
	        i, j, k, s;

	    for (k = 0; k < n; k++) {
	        var nrm = 0;
	        for (i = k; i < m; i++) {
	            nrm = hypotenuse(nrm, qr[i][k]);
	        }
	        if (nrm !== 0) {
	            if (qr[k][k] < 0) {
	                nrm = -nrm;
	            }
	            for (i = k; i < m; i++) {
	                qr[i][k] /= nrm;
	            }
	            qr[k][k] += 1;
	            for (j = k + 1; j < n; j++) {
	                s = 0;
	                for (i = k; i < m; i++) {
	                    s += qr[i][k] * qr[i][j];
	                }
	                s = -s / qr[k][k];
	                for (i = k; i < m; i++) {
	                    qr[i][j] += s * qr[i][k];
	                }
	            }
	        }
	        rdiag[k] = -nrm;
	    }

	    this.QR = qr;
	    this.Rdiag = rdiag;
	}

	QrDecomposition.prototype = {
	    solve: function (value) {
	        value = Matrix.checkMatrix(value);

	        var qr = this.QR,
	            m = qr.rows;

	        if (value.rows !== m)
	            throw new Error('Matrix row dimensions must agree');
	        if (!this.isFullRank())
	            throw new Error('Matrix is rank deficient');

	        var count = value.columns,
	            X = value.clone(),
	            n = qr.columns,
	            i, j, k, s;

	        for (k = 0; k < n; k++) {
	            for (j = 0; j < count; j++) {
	                s = 0;
	                for (i = k; i < m; i++) {
	                    s += qr[i][k] * X[i][j];
	                }
	                s = -s / qr[k][k];
	                for (i = k; i < m; i++) {
	                    X[i][j] += s * qr[i][k];
	                }
	            }
	        }
	        for (k = n - 1; k >= 0; k--) {
	            for (j = 0; j < count; j++) {
	                X[k][j] /= this.Rdiag[k];
	            }
	            for (i = 0; i < k; i++) {
	                for (j = 0; j < count; j++) {
	                    X[i][j] -= X[k][j] * qr[i][k];
	                }
	            }
	        }

	        return X.subMatrix(0, n - 1, 0, count - 1);
	    },
	    isFullRank: function () {
	        var columns = this.QR.columns;
	        for (var i = 0; i < columns; i++) {
	            if (this.Rdiag[i] === 0) {
	                return false;
	            }
	        }
	        return true;
	    },
	    get upperTriangularMatrix() {
	        var qr = this.QR,
	            n = qr.columns,
	            X = new Matrix(n, n),
	            i, j;
	        for (i = 0; i < n; i++) {
	            for (j = 0; j < n; j++) {
	                if (i < j) {
	                    X[i][j] = qr[i][j];
	                } else if (i === j) {
	                    X[i][j] = this.Rdiag[i];
	                } else {
	                    X[i][j] = 0;
	                }
	            }
	        }
	        return X;
	    },
	    get orthogonalMatrix() {
	        var qr = this.QR,
	            rows = qr.rows,
	            columns = qr.columns,
	            X = new Matrix(rows, columns),
	            i, j, k, s;

	        for (k = columns - 1; k >= 0; k--) {
	            for (i = 0; i < rows; i++) {
	                X[i][k] = 0;
	            }
	            X[k][k] = 1;
	            for (j = k; j < columns; j++) {
	                if (qr[k][k] !== 0) {
	                    s = 0;
	                    for (i = k; i < rows; i++) {
	                        s += qr[i][k] * X[i][j];
	                    }

	                    s = -s / qr[k][k];

	                    for (i = k; i < rows; i++) {
	                        X[i][j] += s * qr[i][k];
	                    }
	                }
	            }
	        }
	        return X;
	    }
	};

	module.exports = QrDecomposition;


/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var Matrix = __webpack_require__(3);

	// https://github.com/lutzroeder/Mapack/blob/master/Source/CholeskyDecomposition.cs
	function CholeskyDecomposition(value) {
	    if (!(this instanceof CholeskyDecomposition)) {
	        return new CholeskyDecomposition(value);
	    }
	    value = Matrix.checkMatrix(value);
	    if (!value.isSymmetric())
	        throw new Error('Matrix is not symmetric');

	    var a = value,
	        dimension = a.rows,
	        l = new Matrix(dimension, dimension),
	        positiveDefinite = true,
	        i, j, k;

	    for (j = 0; j < dimension; j++) {
	        var Lrowj = l[j];
	        var d = 0;
	        for (k = 0; k < j; k++) {
	            var Lrowk = l[k];
	            var s = 0;
	            for (i = 0; i < k; i++) {
	                s += Lrowk[i] * Lrowj[i];
	            }
	            Lrowj[k] = s = (a[j][k] - s) / l[k][k];
	            d = d + s * s;
	        }

	        d = a[j][j] - d;

	        positiveDefinite &= (d > 0);
	        l[j][j] = Math.sqrt(Math.max(d, 0));
	        for (k = j + 1; k < dimension; k++) {
	            l[j][k] = 0;
	        }
	    }

	    if (!positiveDefinite) {
	        throw new Error('Matrix is not positive definite');
	    }

	    this.L = l;
	}

	CholeskyDecomposition.prototype = {
	    get lowerTriangularMatrix() {
	        return this.L;
	    },
	    solve: function (value) {
	        value = Matrix.checkMatrix(value);

	        var l = this.L,
	            dimension = l.rows;

	        if (value.rows !== dimension) {
	            throw new Error('Matrix dimensions do not match');
	        }

	        var count = value.columns,
	            B = value.clone(),
	            i, j, k;

	        for (k = 0; k < dimension; k++) {
	            for (j = 0; j < count; j++) {
	                for (i = 0; i < k; i++) {
	                    B[k][j] -= B[i][j] * l[k][i];
	                }
	                B[k][j] /= l[k][k];
	            }
	        }

	        for (k = dimension - 1; k >= 0; k--) {
	            for (j = 0; j < count; j++) {
	                for (i = k + 1; i < dimension; i++) {
	                    B[k][j] -= B[i][j] * l[i][k];
	                }
	                B[k][j] /= l[k][k];
	            }
	        }

	        return B;
	    }
	};

	module.exports = CholeskyDecomposition;


/***/ },
/* 11 */
/***/ function(module, exports) {

	module.exports = newArray

	function newArray (n, value) {
	  n = n || 0
	  var array = new Array(n)
	  for (var i = 0; i < n; i++) {
	    array[i] = value
	  }
	  return array
	}


/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	const Matrix = __webpack_require__(2);
	const SparseMatrix = __webpack_require__(13);
	const binarySearch = __webpack_require__(16);
	const newArray = __webpack_require__(11);

	const getPauli = __webpack_require__(17);

	function simulate1d(spinSystem, options = {}) {
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
	    let lnPoints = lineWidthPoints * 50;

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
	                cluster
	            );

	            const hamSize = hamiltonian.rows;
	            const evd = new Matrix.DC.EVD(hamiltonian);
	            const V = evd.eigenvectorMatrix;
	            const diagB = evd.realEigenvalues;
	            const assignmentMatrix = new SparseMatrix(hamSize, hamSize);
	            const multLen = cluster.length;
	            weight = 0;
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


/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	const HashTable = __webpack_require__(14);

	class SparseMatrix {
	    constructor(rows, columns, options = {}) {
	        if (rows instanceof SparseMatrix) { // clone
	            const other = rows;
	            this._init(other.rows, other.columns, other.elements.clone(), other.threshold);
	            return;
	        }

	        if (Array.isArray(rows)) {
	            const matrix = rows;
	            rows = matrix.length;
	            options = columns || {};
	            columns = matrix[0].length;
	            this._init(rows, columns, new HashTable(options), options.threshold);
	            for (var i = 0; i < rows; i++) {
	                for (var j = 0; j < columns; j++) {
	                    var value = matrix[i][j];
	                    if (this.threshold && Math.abs(value) < this.threshold) value = 0;
	                    if (value !== 0) {
	                        this.elements.set(i * columns + j, matrix[i][j]);
	                    }
	                }
	            }
	        } else {
	            this._init(rows, columns, new HashTable(options), options.threshold);
	        }
	    }

	    _init(rows, columns, elements, threshold) {
	        this.rows = rows;
	        this.columns = columns;
	        this.elements = elements;
	        this.threshold = threshold || 0;
	    }
	    
	    static eye(rows = 1, columns = rows) {
	        const min = Math.min(rows, columns);
	        const matrix = new SparseMatrix(rows, columns, {initialCapacity: min});
	        for (var i = 0; i < min; i++) {
	            matrix.set(i, i, 1);
	        }
	        return matrix;
	    }

	    clone() {
	        return new SparseMatrix(this);
	    }
	    
	    to2DArray() {
	        const copy = new Array(this.rows);
	        for (var i = 0; i < this.rows; i++) {
	            copy[i] = new Array(this.columns);
	            for (var j = 0; j < this.columns; j++) {
	                copy[i][j] = this.get(i, j);
	            }
	        }
	        return copy;
	    }

	    isSquare() {
	        return this.rows === this.columns;
	    }

	    isSymmetric() {
	        if (!this.isSquare()) return false;

	        var symmetric = true;
	        this.forEachNonZero((i, j, v) => {
	            if (this.get(j, i) !== v) {
	                symmetric = false;
	                return false;
	            }
	            return v;
	        });
	        return symmetric;
	    }

	    get cardinality() {
	        return this.elements.size;
	    }

	    get size() {
	        return this.rows * this.columns;
	    }

	    get(row, column) {
	        return this.elements.get(row * this.columns + column);
	    }

	    set(row, column, value) {
	        if (this.threshold && Math.abs(value) < this.threshold) value = 0;
	        if (value === 0) {
	            this.elements.remove(row * this.columns + column);
	        } else {
	            this.elements.set(row * this.columns + column, value);
	        }
	        return this;
	    }
	    
	    mmul(other) {
	        if (this.columns !== other.rows)
	            console.warn('Number of columns of left matrix are not equal to number of rows of right matrix.');
	        
	        const m = this.rows;
	        const p = other.columns;
	        
	        const result = new SparseMatrix(m, p);
	        this.forEachNonZero((i, j, v1) => {
	            other.forEachNonZero((k, l, v2) => {
	                if (j === k) {
	                    result.set(i, l, result.get(i, l) + v1 * v2);
	                }
	                return v2;
	            });
	            return v1;
	        });
	        return result;
	    }

	    kroneckerProduct(other) {
	        const m = this.rows;
	        const n = this.columns;
	        const p = other.rows;
	        const q = other.columns;

	        const result = new SparseMatrix(m * p, n * q, {
	            initialCapacity: this.cardinality * other.cardinality
	        });
	        this.forEachNonZero((i, j, v1) => {
	            other.forEachNonZero((k, l, v2) => {
	                result.set(p * i + k, q * j + l, v1 * v2);
	                return v2;
	            });
	            return v1;
	        });
	        return result;
	    }

	    forEachNonZero(callback) {
	        this.elements.forEachPair((key, value) => {
	            const i = (key / this.columns) | 0;
	            const j = key % this.columns;
	            let r = callback(i, j, value);
	            if (r === false) return false; // stop iteration
	            if (this.threshold && Math.abs(r) < this.threshold) r = 0;
	            if (r !== value) {
	                if (r === 0) {
	                    this.elements.remove(key, true);
	                } else {
	                    this.elements.set(key, r);
	                }
	            }
	            return true;
	        });
	        this.elements.maybeShrinkCapacity();
	        return this;
	    }

	    getNonZeros() {
	        const cardinality = this.cardinality;
	        const rows = new Array(cardinality);
	        const columns = new Array(cardinality);
	        const values = new Array(cardinality);
	        var idx = 0;
	        this.forEachNonZero((i, j, value) => {
	            rows[idx] = i;
	            columns[idx] = j;
	            values[idx] = value;
	            idx++;
	            return value;
	        });
	        return {rows, columns, values};
	    }

	    setThreshold(newThreshold) {
	        if (newThreshold !== 0 && newThreshold !== this.threshold) {
	            this.threshold = newThreshold;
	            this.forEachNonZero((i, j, v) => v);
	        }
	        return this;
	    }
	}

	SparseMatrix.prototype.klass = 'Matrix';

	SparseMatrix.identity = SparseMatrix.eye;
	SparseMatrix.prototype.tensorProduct = SparseMatrix.prototype.kroneckerProduct;

	module.exports = SparseMatrix;

	/*
	 Add dynamically instance and static methods for mathematical operations
	 */

	var inplaceOperator = `
	(function %name%(value) {
	    if (typeof value === 'number') return this.%name%S(value);
	    return this.%name%M(value);
	})
	`;

	var inplaceOperatorScalar = `
	(function %name%S(value) {
	    this.forEachNonZero((i, j, v) => v %op% value);
	    return this;
	})
	`;

	var inplaceOperatorMatrix = `
	(function %name%M(matrix) {
	    matrix.forEachNonZero((i, j, v) => {
	        this.set(i, j, this.get(i, j) %op% v);
	        return v;
	    });
	    return this;
	})
	`;

	var staticOperator = `
	(function %name%(matrix, value) {
	    var newMatrix = new SparseMatrix(matrix);
	    return newMatrix.%name%(value);
	})
	`;

	var inplaceMethod = `
	(function %name%() {
	    this.forEachNonZero((i, j, v) => %method%(v));
	    return this;
	})
	`;

	var staticMethod = `
	(function %name%(matrix) {
	    var newMatrix = new SparseMatrix(matrix);
	    return newMatrix.%name%();
	})
	`;

	var operators = [
	    // Arithmetic operators
	    ['+', 'add'],
	    ['-', 'sub', 'subtract'],
	    ['*', 'mul', 'multiply'],
	    ['/', 'div', 'divide'],
	    ['%', 'mod', 'modulus'],
	    // Bitwise operators
	    ['&', 'and'],
	    ['|', 'or'],
	    ['^', 'xor'],
	    ['<<', 'leftShift'],
	    ['>>', 'signPropagatingRightShift'],
	    ['>>>', 'rightShift', 'zeroFillRightShift']
	];

	for (var operator of operators) {
	    for (var i = 1; i < operator.length; i++) {
	        SparseMatrix.prototype[operator[i]] = eval(fillTemplateFunction(inplaceOperator, {name: operator[i], op: operator[0]}));
	        SparseMatrix.prototype[operator[i] + 'S'] = eval(fillTemplateFunction(inplaceOperatorScalar, {name: operator[i] + 'S', op: operator[0]}));
	        SparseMatrix.prototype[operator[i] + 'M'] = eval(fillTemplateFunction(inplaceOperatorMatrix, {name: operator[i] + 'M', op: operator[0]}));

	        SparseMatrix[operator[i]] = eval(fillTemplateFunction(staticOperator, {name: operator[i]}));
	    }
	}

	var methods = [
	    ['~', 'not']
	];

	[
	    'abs', 'acos', 'acosh', 'asin', 'asinh', 'atan', 'atanh', 'cbrt', 'ceil',
	    'clz32', 'cos', 'cosh', 'exp', 'expm1', 'floor', 'fround', 'log', 'log1p',
	    'log10', 'log2', 'round', 'sign', 'sin', 'sinh', 'sqrt', 'tan', 'tanh', 'trunc'
	].forEach(function (mathMethod) {
	    methods.push(['Math.' + mathMethod, mathMethod]);
	});

	for (var method of methods) {
	    for (var i = 1; i < method.length; i++) {
	        SparseMatrix.prototype[method[i]] = eval(fillTemplateFunction(inplaceMethod, {name: method[i], method: method[0]}));
	        SparseMatrix[method[i]] = eval(fillTemplateFunction(staticMethod, {name: method[i]}));
	    }
	}

	function fillTemplateFunction(template, values) {
	    for (var i in values) {
	        template = template.replace(new RegExp('%' + i + '%', 'g'), values[i]);
	    }
	    return template;
	}


/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	const newArray = __webpack_require__(11);

	const primeFinder = __webpack_require__(15);
	const nextPrime = primeFinder.nextPrime;
	const largestPrime = primeFinder.largestPrime;

	const FREE = 0;
	const FULL = 1;
	const REMOVED = 2;

	const defaultInitialCapacity = 150;
	const defaultMinLoadFactor = 1 / 6;
	const defaultMaxLoadFactor = 2 / 3;

	class HashTable {
	    constructor(options = {}) {
	        if (options instanceof HashTable) {
	            this.table = options.table.slice();
	            this.values = options.values.slice();
	            this.state = options.state.slice();
	            this.minLoadFactor = options.minLoadFactor;
	            this.maxLoadFactor = options.maxLoadFactor;
	            this.distinct = options.distinct;
	            this.freeEntries = options.freeEntries;
	            this.lowWaterMark = options.lowWaterMark;
	            this.highWaterMark = options.maxLoadFactor;
	            return;
	        }

	        const initialCapacity = options.initialCapacity === undefined ? defaultInitialCapacity : options.initialCapacity;
	        if (initialCapacity < 0) {
	            throw new RangeError(`initial capacity must not be less than zero: ${initialCapacity}`);
	        }

	        const minLoadFactor = options.minLoadFactor === undefined ? defaultMinLoadFactor : options.minLoadFactor;
	        const maxLoadFactor = options.maxLoadFactor === undefined ? defaultMaxLoadFactor : options.maxLoadFactor;
	        if (minLoadFactor < 0 || minLoadFactor >= 1) {
	            throw new RangeError(`invalid minLoadFactor: ${minLoadFactor}`);
	        }
	        if (maxLoadFactor <= 0 || maxLoadFactor >= 1) {
	            throw new RangeError(`invalid maxLoadFactor: ${maxLoadFactor}`);
	        }
	        if (minLoadFactor >= maxLoadFactor) {
	            throw new RangeError(`minLoadFactor (${minLoadFactor}) must be smaller than maxLoadFactor (${maxLoadFactor})`);
	        }

	        let capacity = initialCapacity;
	        // User wants to put at least capacity elements. We need to choose the size based on the maxLoadFactor to
	        // avoid the need to rehash before this capacity is reached.
	        // actualCapacity * maxLoadFactor >= capacity
	        capacity = (capacity / maxLoadFactor) | 0;
	        capacity = nextPrime(capacity);
	        if (capacity === 0) capacity = 1;

	        this.table = newArray(capacity, 0);
	        this.values = newArray(capacity, 0);
	        this.state = newArray(capacity, 0);

	        this.minLoadFactor = minLoadFactor;
	        if (capacity === largestPrime) {
	            this.maxLoadFactor = 1;
	        } else {
	            this.maxLoadFactor = maxLoadFactor;
	        }

	        this.distinct = 0;
	        this.freeEntries = capacity;

	        this.lowWaterMark = 0;
	        this.highWaterMark = chooseHighWaterMark(capacity, this.maxLoadFactor);
	    }

	    clone() {
	        return new HashTable(this);
	    }

	    get size() {
	        return this.distinct;
	    }

	    get(key) {
	        const i = this.indexOfKey(key);
	        if (i < 0) return 0;
	        return this.values[i];
	    }

	    set(key, value) {
	        let i = this.indexOfInsertion(key);
	        if (i < 0) {
	            i = -i - 1;
	            this.values[i] = value;
	            return false;
	        }

	        if (this.distinct > this.highWaterMark) {
	            const newCapacity = chooseGrowCapacity(this.distinct + 1, this.minLoadFactor, this.maxLoadFactor);
	            this.rehash(newCapacity);
	            return this.set(key, value);
	        }

	        this.table[i] = key;
	        this.values[i] = value;
	        if (this.state[i] === FREE) this.freeEntries--;
	        this.state[i] = FULL;
	        this.distinct++;

	        if (this.freeEntries < 1) {
	            const newCapacity = chooseGrowCapacity(this.distinct + 1, this.minLoadFactor, this.maxLoadFactor);
	            this.rehash(newCapacity);
	        }

	        return true;
	    }
	    
	    remove(key, noRehash) {
	        const i = this.indexOfKey(key);
	        if (i < 0) return false;

	        this.state[i] = REMOVED;
	        this.distinct--;

	        if (!noRehash) this.maybeShrinkCapacity();

	        return true;
	    }

	    delete(key, noRehash) {
	        const i = this.indexOfKey(key);
	        if (i < 0) return false;

	        this.state[i] = FREE;
	        this.distinct--;

	        if (!noRehash) this.maybeShrinkCapacity();

	        return true;
	    }

	    maybeShrinkCapacity() {
	        if (this.distinct < this.lowWaterMark) {
	            const newCapacity = chooseShrinkCapacity(this.distinct, this.minLoadFactor, this.maxLoadFactor);
	            this.rehash(newCapacity);
	        }
	    }

	    containsKey(key) {
	        return this.indexOfKey(key) >= 0;
	    }

	    indexOfKey(key) {
	        const table = this.table;
	        const state = this.state;
	        const length = this.table.length;

	        const hash = key & 0x7fffffff;
	        let i = hash % length;
	        let decrement = hash % (length - 2);
	        if (decrement === 0) decrement = 1;

	        while (state[i] !== FREE && (state[i] === REMOVED || table[i] !== key)) {
	            i -= decrement;
	            if (i < 0) i += length;
	        }

	        if (state[i] === FREE) return -1;
	        return i;
	    }

	    containsValue(value) {
	        return this.indexOfValue(value) >= 0;
	    }

	    indexOfValue(value) {
	        const values = this.values;
	        const state = this.state;

	        for (var i = 0; i < state.length; i++) {
	            if (state[i] === FULL && values[i] === value) {
	                return i;
	            }
	        }

	        return -1;
	    }

	    indexOfInsertion(key) {
	        const table = this.table;
	        const state = this.state;
	        const length = table.length;


	        const hash = key & 0x7fffffff;
	        let i = hash % length;
	        let decrement = hash % (length - 2);
	        if (decrement === 0) decrement = 1;

	        while (state[i] === FULL && table[i] !== key) {
	            i -= decrement;
	            if (i < 0) i += length;
	        }

	        if (state[i] === REMOVED) {
	            const j = i;
	            while (state[i] !== FREE && (state[i] === REMOVED || table[i] !== key)) {
	                i -= decrement;
	                if (i < 0) i += length;
	            }
	            if (state[i] === FREE) i = j;
	        }

	        if (state[i] === FULL) {
	            return -i - 1;
	        }

	        return i;
	    }

	    ensureCapacity(minCapacity) {
	        if (this.table.length < minCapacity) {
	            const newCapacity = nextPrime(minCapacity);
	            this.rehash(newCapacity);
	        }
	    }

	    rehash(newCapacity) {
	        const oldCapacity = this.table.length;

	        if (newCapacity <= this.distinct) throw new Error('Unexpected');

	        const oldTable = this.table;
	        const oldValues = this.values;
	        const oldState = this.state;

	        const newTable = newArray(newCapacity, 0);
	        const newValues = newArray(newCapacity, 0);
	        const newState = newArray(newCapacity, 0);

	        this.lowWaterMark = chooseLowWaterMark(newCapacity, this.minLoadFactor);
	        this.highWaterMark = chooseHighWaterMark(newCapacity, this.maxLoadFactor);

	        this.table = newTable;
	        this.values = newValues;
	        this.state = newState;
	        this.freeEntries = newCapacity - this.distinct;

	        for (var i = 0; i < oldCapacity; i++) {
	            if (oldState[i] === FULL) {
	                var element = oldTable[i];
	                var index = this.indexOfInsertion(element);
	                newTable[index] = element;
	                newValues[index] = oldValues[i];
	                newState[index] = FULL;
	            }
	        }
	    }

	    forEachKey(callback) {
	        for (var i = 0; i < this.state.length; i++) {
	            if (this.state[i] === FULL) {
	                if (!callback(this.table[i])) return false;
	            }
	        }
	        return true;
	    }

	    forEachValue(callback) {
	        for (var i = 0; i < this.state.length; i++) {
	            if (this.state[i] === FULL) {
	                if (!callback(this.values[i])) return false;
	            }
	        }
	        return true;
	    }

	    forEachPair(callback) {
	        for (var i = 0; i < this.state.length; i++) {
	            if (this.state[i] === FULL) {
	                if (!callback(this.table[i], this.values[i])) return false;
	            }
	        }
	        return true;
	    }
	}

	module.exports = HashTable;

	function chooseLowWaterMark(capacity, minLoad) {
	    return (capacity * minLoad) | 0;
	}

	function chooseHighWaterMark(capacity, maxLoad) {
	    return Math.min(capacity - 2, (capacity * maxLoad) | 0);
	}

	function chooseGrowCapacity(size, minLoad, maxLoad) {
	    return nextPrime(Math.max(size + 1, (4 * size / (3 * minLoad + maxLoad)) | 0));
	}

	function chooseShrinkCapacity(size, minLoad, maxLoad) {
	    return nextPrime(Math.max(size + 1, (4 * size / (minLoad + 3 * maxLoad)) | 0));
	}


/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	const binarySearch = __webpack_require__(16);

	const largestPrime = 0x7fffffff;

	const primeNumbers = [
	    //chunk #0
	    largestPrime, // 2^31-1

	    //chunk #1
	    5, 11, 23, 47, 97, 197, 397, 797, 1597, 3203, 6421, 12853, 25717, 51437, 102877, 205759,
	    411527, 823117, 1646237, 3292489, 6584983, 13169977, 26339969, 52679969, 105359939,
	    210719881, 421439783, 842879579, 1685759167,

	    //chunk #2
	    433, 877, 1759, 3527, 7057, 14143, 28289, 56591, 113189, 226379, 452759, 905551, 1811107,
	    3622219, 7244441, 14488931, 28977863, 57955739, 115911563, 231823147, 463646329, 927292699,
	    1854585413,

	    //chunk #3
	    953, 1907, 3821, 7643, 15287, 30577, 61169, 122347, 244703, 489407, 978821, 1957651, 3915341,
	    7830701, 15661423, 31322867, 62645741, 125291483, 250582987, 501165979, 1002331963,
	    2004663929,

	    //chunk #4
	    1039, 2081, 4177, 8363, 16729, 33461, 66923, 133853, 267713, 535481, 1070981, 2141977, 4283963,
	    8567929, 17135863, 34271747, 68543509, 137087021, 274174111, 548348231, 1096696463,

	    //chunk #5
	    31, 67, 137, 277, 557, 1117, 2237, 4481, 8963, 17929, 35863, 71741, 143483, 286973, 573953,
	    1147921, 2295859, 4591721, 9183457, 18366923, 36733847, 73467739, 146935499, 293871013,
	    587742049, 1175484103,

	    //chunk #6
	    599, 1201, 2411, 4831, 9677, 19373, 38747, 77509, 155027, 310081, 620171, 1240361, 2480729,
	    4961459, 9922933, 19845871, 39691759, 79383533, 158767069, 317534141, 635068283, 1270136683,

	    //chunk #7
	    311, 631, 1277, 2557, 5119, 10243, 20507, 41017, 82037, 164089, 328213, 656429, 1312867,
	    2625761, 5251529, 10503061, 21006137, 42012281, 84024581, 168049163, 336098327, 672196673,
	    1344393353,

	    //chunk #8
	    3, 7, 17, 37, 79, 163, 331, 673, 1361, 2729, 5471, 10949, 21911, 43853, 87719, 175447, 350899,
	    701819, 1403641, 2807303, 5614657, 11229331, 22458671, 44917381, 89834777, 179669557,
	    359339171, 718678369, 1437356741,

	    //chunk #9
	    43, 89, 179, 359, 719, 1439, 2879, 5779, 11579, 23159, 46327, 92657, 185323, 370661, 741337,
	    1482707, 2965421, 5930887, 11861791, 23723597, 47447201, 94894427, 189788857, 379577741,
	    759155483, 1518310967,

	    //chunk #10
	    379, 761, 1523, 3049, 6101, 12203, 24407, 48817, 97649, 195311, 390647, 781301, 1562611,
	    3125257, 6250537, 12501169, 25002389, 50004791, 100009607, 200019221, 400038451, 800076929,
	    1600153859,

	    //chunk #11
	    13, 29, 59, 127, 257, 521, 1049, 2099, 4201, 8419, 16843, 33703, 67409, 134837, 269683,
	    539389, 1078787, 2157587, 4315183, 8630387, 17260781, 34521589, 69043189, 138086407,
	    276172823, 552345671, 1104691373,

	    //chunk #12
	    19, 41, 83, 167, 337, 677,
	    1361, 2729, 5471, 10949, 21911, 43853, 87719, 175447, 350899,
	    701819, 1403641, 2807303, 5614657, 11229331, 22458671, 44917381, 89834777, 179669557,
	    359339171, 718678369, 1437356741,

	    //chunk #13
	    53, 107, 223, 449, 907, 1823, 3659, 7321, 14653, 29311, 58631, 117269,
	    234539, 469099, 938207, 1876417, 3752839, 7505681, 15011389, 30022781,
	    60045577, 120091177, 240182359, 480364727, 960729461, 1921458943
	];

	primeNumbers.sort((a, b) => a - b);

	function nextPrime(value) {
	    let index = binarySearch(primeNumbers, value);
	    if (index < 0) {
	        index = -index - 1;
	    }
	    return primeNumbers[index];
	}

	exports.nextPrime = nextPrime;
	exports.largestPrime = largestPrime;


/***/ },
/* 16 */
/***/ function(module, exports) {

	/**
	 * Performs a binary search of value in array
	 * @param array - Array in which value will be searched. It must be sorted.
	 * @param value - Value to search in array
	 * @return {number} If value is found, returns its index in array. Otherwise, returns a negative number indicating where the value should be inserted: -(index + 1)
	 */
	function binarySearch(array, value) {
	    var low = 0;
	    var high = array.length - 1;

	    while (low <= high) {
	        var mid = (low + high) >>> 1;
	        var midValue = array[mid];
	        if (midValue < value) {
	            low = mid + 1;
	        } else if (midValue > value) {
	            high = mid - 1;
	        } else {
	            return mid;
	        }
	    }

	    return -(low + 1);
	}

	module.exports = binarySearch;


/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	const SparseMatrix = __webpack_require__(13);

	function createPauli(mult) {
	    const spin = (mult - 1) / 2;
	    const prjs = new Array(mult);
	    const temp = new Array(mult);
	    for (var i = 0; i < mult; i++) {
	        prjs[i] = (mult - 1) - i - spin;
	        temp[i] = Math.sqrt(spin * (spin + 1) - prjs[i] * (prjs[i] + 1));
	    }
	    const p = diag(temp, 1, mult, mult);
	    for (i = 0; i < mult; i++) {
	        temp[i] = Math.sqrt(spin * (spin + 1) - prjs[i] * (prjs[i] - 1));
	    }
	    const m = diag(temp, -1, mult, mult);
	    const x = p.clone().add(m).mul(0.5);
	    const y = m.clone().mul(-1).add(p).mul(-0.5);
	    const z = diag(prjs, 0, mult, mult);
	    return {x, y, z, m, p};
	}

	function diag(A, d, n, m) {
	    const diag = new SparseMatrix(n, m, {initialCapacity: 20});
	    for (var i = 0; i < A.length; i++) {
	        if ((i - d) >= 0 && (i - d) < n && i < m) {
	            diag.set(i - d, i, A[i]);
	        }
	    }
	    return diag;
	}

	const pauli2 = createPauli(2);

	function getPauli(mult) {
	    if (mult === 2) return pauli2;
	    else return createPauli(mult);
	}

	module.exports = getPauli;


/***/ }
/******/ ])
});
;