'use strict';

/**
 * Plot result from the beam analysis calculation into a graph
 */
class AnalysisPlotter {
    constructor(container) {
        this.container = container;
        this.chart = null;
    }

    /**
     * Plot equation.
     *
     * @param {Object{beam : Beam, load : float, equation: Function}}  The equation data
     */
    plot(data) {
        const canvas = document.getElementById(this.container);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        let totalSpan = data.beam.primarySpan;
        if (data.beam.secondarySpan && !isNaN(data.beam.secondarySpan)) {
            totalSpan += data.beam.secondarySpan;
        }

        const points = [];
        const numPoints = 200;
        const step = totalSpan / numPoints;
        
        for (let x = 0; x <= totalSpan; x += step) {
            points.push(data.equation(x));
        }

        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: this.getChartLabel(this.container),
                    data: points,
                    borderColor: 'blue',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: 'Distance x (m)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: this.getChartLabel(this.container)
                        }
                    }
                }
            }
        });
    }

    getChartLabel(containerId) {
        switch(containerId) {
            case 'deflection_plot': return 'Deflection (mm)';
            case 'shear_force_plot': return 'Shear Force (kN)';
            case 'bending_moment_plot': return 'Bending Moment (kN.m)';
            default: return 'Value';
        }
    }
}