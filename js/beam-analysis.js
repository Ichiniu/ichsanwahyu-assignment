'use strict';

/** ============================ Beam Analysis Data Type ============================ */

/**
 * Beam material specification.
 *
 * @param {String} name         Material name
 * @param {Object} properties   Material properties {EI : 0, GA : 0, ....}
 */
class Material {
    constructor(name, properties) {
        this.name = name;
        this.properties = properties;
    }
}

/**
 *
 * @param {Number} primarySpan          Beam primary span length
 * @param {Number} secondarySpan        Beam secondary span length
 * @param {Material} material           Beam material object
 */
class Beam {
    constructor(primarySpan, secondarySpan, material) {
        this.primarySpan = primarySpan;
        this.secondarySpan = secondarySpan;
        this.material = material;
    }
}

/** ============================ Beam Analysis Class ============================ */

class BeamAnalysis {
    constructor() {
        this.options = {
            condition: 'simply-supported'
        };

        this.analyzer = {
            'simply-supported': new BeamAnalysis.analyzer.simplySupported(),
            'two-span-unequal': new BeamAnalysis.analyzer.twoSpanUnequal()
        };
    }
    /**
     *
     * @param {Beam} beam
     * @param {Number} load
     */
    getDeflection(beam, load, condition) {
        var analyzer = this.analyzer[condition];

        if (analyzer) {
            return {
                beam: beam,
                load: load,
                equation: analyzer.getDeflectionEquation(beam, load)
            };
        } else {
            throw new Error('Invalid condition');
        }
    }
    getBendingMoment(beam, load, condition) {
        var analyzer = this.analyzer[condition];

        if (analyzer) {
            return {
                beam: beam,
                load: load,
                equation: analyzer.getBendingMomentEquation(beam, load)
            };
        } else {
            throw new Error('Invalid condition');
        }
    }
    getShearForce(beam, load, condition) {
        var analyzer = this.analyzer[condition];

        if (analyzer) {
            return {
                beam: beam,
                load: load,
                equation: analyzer.getShearForceEquation(beam, load)
            };
        } else {
            throw new Error('Invalid condition');
        }
    }
}




/** ============================ Beam Analysis Analyzer ============================ */

/**
 * Available analyzers for different conditions
 */
BeamAnalysis.analyzer = {};

/**
 * Calculate deflection, bending stress and shear stress for a simply supported beam
 *
 * @param {Beam}   beam   The beam object
 * @param {Number}  load    The applied load
 */
BeamAnalysis.analyzer.simplySupported = class {
    constructor(beam, load) {
        this.beam = beam;
        this.load = load;
    }
    getDeflectionEquation(beam, load) {
        let L = beam.primarySpan;
        let w = load;
        let EI = beam.material.properties.EI;

        return function (x) {
            let x_mm = x * 1000;
            let L_mm = L * 1000;
            let y = -(w * x_mm * (Math.pow(L_mm, 3) - 2 * L_mm * Math.pow(x_mm, 2) + Math.pow(x_mm, 3))) / (24 * EI);
            return { x: x, y: y };
        };
    }
    getBendingMomentEquation(beam, load) {
        let L = beam.primarySpan;
        let w = load;

        return function (x) {
            let y = (w * x / 2) * (L - x);
            return { x: x, y: y };
        };
    }
    getShearForceEquation(beam, load) {
        let L = beam.primarySpan;
        let w = load;

        return function (x) {
            let y = w * (L / 2 - x);
            return { x: x, y: y };
        };
    }
};

/**
 * Calculate deflection, bending stress and shear stress for a beam with two spans of equal condition
 *
 * @param {Beam}   beam   The beam object
 * @param {Number}  load    The applied load
 */
BeamAnalysis.analyzer.twoSpanUnequal = class {
    constructor(beam, load) {
        this.beam = beam;
        this.load = load;
    }
    getDeflectionEquation(beam, load) {
        let L1 = beam.primarySpan;
        let L2 = beam.secondarySpan;
        let w = load;
        let EI = beam.material.properties.EI;

        let MB = - (w * (Math.pow(L1, 3) + Math.pow(L2, 3))) / (8 * (L1 + L2));
        let RA = (w * L1 / 2) + (MB / L1);
        let RC = (w * L2 / 2) + (MB / L2);

        return function (x) {
            let y = 0;
            if (x <= L1) {
                let num = (RA * Math.pow(x, 3) / 6) - (w * Math.pow(x, 4) / 24) + ((w * Math.pow(L1, 3) / 24) - (RA * Math.pow(L1, 2) / 6)) * x;
                y = -(num * 1e12) / EI;
            } else {
                let u = L1 + L2 - x; 
                let num = (RC * Math.pow(u, 3) / 6) - (w * Math.pow(u, 4) / 24) + ((w * Math.pow(L2, 3) / 24) - (RC * Math.pow(L2, 2) / 6)) * u;
                y = -(num * 1e12) / EI;
            }
            return { x: x, y: y };
        };
    }
    getBendingMomentEquation(beam, load) {
        let L1 = beam.primarySpan;
        let L2 = beam.secondarySpan;
        let w = load;

        let MB = - (w * (Math.pow(L1, 3) + Math.pow(L2, 3))) / (8 * (L1 + L2));
        let RA = (w * L1 / 2) + (MB / L1);
        let RC = (w * L2 / 2) + (MB / L2);

        return function (x) {
            let y = 0;
            if (x <= L1) {
                y = RA * x - (w * Math.pow(x, 2) / 2);
            } else {
                let u = L1 + L2 - x;
                y = RC * u - (w * Math.pow(u, 2) / 2);
            }
            return { x: x, y: y };
        };
    }
    getShearForceEquation(beam, load) {
        let L1 = beam.primarySpan;
        let L2 = beam.secondarySpan;
        let w = load;

        let MB = - (w * (Math.pow(L1, 3) + Math.pow(L2, 3))) / (8 * (L1 + L2));
        let RA = (w * L1 / 2) + (MB / L1);
        let RC = (w * L2 / 2) + (MB / L2);
        let RB = w * (L1 + L2) - RA - RC;

        return function (x) {
            let y = 0;
            if (x <= L1) {
                y = RA - w * x;
            } else {
                y = RA + RB - w * x;
            }
            return { x: x, y: y };
        };
    }
};
