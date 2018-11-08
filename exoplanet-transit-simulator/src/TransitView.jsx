import React from 'react';
import PropTypes from 'prop-types';
import * as PIXI from 'pixi.js';

export default class TransitView extends React.Component {
    constructor(props) {
        super(props);

        this.planet = null;
        this.star = null;

        this.entityData = {
            basePhaseWidth: 55.602,
            /*
             * The planetRadius and starRadius global state values
             * don't actually describe the radius of these actual
             * spheres on the screen, in pixi. Instead, I'm using
             * those values to scale the base radii defined below.
             */
            basePlanetRadius: 7,
            baseStarRadius: 76,
            starCenter: null,
            planetCenter: null,
            phaseCenter: null
        };

        this.state = {
            isDragging: false,

            // The phase line grows and shrinks as a function of
            // planet radius and star mass.
            // It ranges from around 8px wide to viewWidth - 10.
            phaseWidth: (
                this.entityData.basePhaseWidth *
                this.props.starMass * this.props.planetRadius
            )
        };

        this.onDragStart = this.onDragStart.bind(this);
        this.onDragEnd = this.onDragEnd.bind(this);
        this.onMove = this.onMove.bind(this);
    }
    render() {
        return <div ref={(el) => {this.el = el}}></div>;
    }
    componentDidMount() {
        const app = new PIXI.Application({
            backgroundColor: 0x000000,
            width: 350,
            height: 350,
            sharedLoader: true,
            sharedTicker: true,
            forceCanvas: true
        });
        this.entityData.starCenter = new PIXI.Point(
            app.view.width / 2,
            app.view.height / 2);

        const starRadius = this.entityData.baseStarRadius * this.props.starMass;
        this.entityData.planetCenter = new PIXI.Point(
            (app.view.width / 2) - starRadius,
            (app.view.height / 2) + 45);

        this.entityData.phaseCenter = new PIXI.Point(
            (app.view.width / 2),
            (app.view.height / 2) + 45);

        this.app = app;
        this.el.appendChild(app.view);
        this.drawScene(app);
    }
    componentDidUpdate(prevProps) {
        if (prevProps.phase !== this.props.phase) {
            // Uncomment this to enable a "distance helper", used as a
            // visual guide for the distance between the two entities'
            // center points.
            /* const g = new PIXI.Graphics();
             * g.lineStyle(1, 0xff0000);
             * g.moveTo(this.planet.position.x, this.planet.position.y);
             * g.lineTo(this.star.position.x, this.star.position.y);
             * if (this.distanceHelper) {
             *     this.app.stage.removeChild(this.distanceHelper);
             * }
             * this.app.stage.addChild(g);
             * this.distanceHelper = g;
             */
        }

        if (
            prevProps.starMass !== this.props.starMass ||
            prevProps.planetRadius !== this.props.planetRadius ||
            prevProps.phase !== this.props.phase
        ) {
            this.setState({
                phaseWidth: (
                    this.entityData.basePhaseWidth *
                    this.props.starMass * this.props.planetRadius
                )
            });
            this.updateScene(
                this.props.phase, this.props.planetRadius,
                this.props.starMass);
        }
    }
    drawScene(app) {
        const starRadius = this.entityData.baseStarRadius * this.props.starMass;
        const star = new PIXI.Graphics()
        const starCenter = this.entityData.starCenter;
        const planetCenter = this.entityData.planetCenter;

        star.pivot = starCenter;
        star.position = starCenter;
        star.beginFill(0xfffafa);
        star.drawCircle(
            starCenter.x, starCenter.y,
            starRadius);
        star.endFill();

        this.star = star;
        app.stage.addChild(star);

        const phaseLine = new PIXI.Graphics();
        const phaseCenter = this.entityData.phaseCenter
        phaseLine.pivot = phaseCenter;
        phaseLine.position = phaseCenter;
        phaseLine.lineStyle(1, 0xd0d0d0);
        phaseLine.moveTo(
            phaseCenter.x - (this.state.phaseWidth / 2),
            (app.view.height / 2) + 45);
        phaseLine.lineTo(
            phaseCenter.x + (this.state.phaseWidth / 2),
            (app.view.height / 2) + 45);

        this.phaseLine = phaseLine;
        app.stage.addChild(phaseLine);

        const planet = new PIXI.Graphics();
        planet.pivot = planetCenter;
        planet.position = planetCenter;
        planet.interactive = true;
        planet.buttonMode = true;
        planet.beginFill(0xa0a0a0);
        planet.drawCircle(
            planetCenter.x, planetCenter.y,
            this.entityData.basePlanetRadius * this.props.planetRadius);
        planet.endFill();
        planet.x = this.props.phase * (
            this.entityData.baseStarRadius * 3) + 60;

        this.planet = planet;
        app.stage.addChild(planet);

        const arrow = new PIXI.Graphics();
        arrow.visible = false;
        arrow.interactive = true;
        arrow.buttonMode = true;
        arrow.beginFill(0xffffff);
        arrow.lineStyle(1, 0x000000);
        arrow.drawPolygon([
            new PIXI.Point(planetCenter.x, planetCenter.y - 8),
            new PIXI.Point(planetCenter.x - 3 - 6, planetCenter.y + 8),
            new PIXI.Point(planetCenter.x - 3, planetCenter.y + 5),
            new PIXI.Point(planetCenter.x - 3, planetCenter.y + 20),
            new PIXI.Point(planetCenter.x + 3, planetCenter.y + 20),
            new PIXI.Point(planetCenter.x + 3, planetCenter.y + 5),
            new PIXI.Point(planetCenter.x + 3 + 6, planetCenter.y + 8),
        ]);

        arrow.position.y += 16;
        arrow.position.x = planet.x - 92;

        this.arrow = arrow;
        app.stage.addChild(this.arrow);
    }
    /**
     * Update the scene when variables change.
     */
    updateScene(
        phase, planetRadius, starMass
    ) {
        const starRadius =
            this.entityData.baseStarRadius * starMass;
        const newPhase = phase * (starRadius * 3) + 60;
        this.planet.x = newPhase;
        this.arrow.x = newPhase - 92;

        // Update star size
        this.star.scale = new PIXI.Point(
            this.props.starMass * 0.8, this.props.starMass * 0.8);

        // Update planet size
        this.planet.scale = new PIXI.Point(
            this.props.planetRadius, this.props.planetRadius);

        this.phaseLine.scale = new PIXI.Point(starMass * planetRadius, 1);

        if (planetRadius < 0.467) {
            this.arrow.visible = true;
        } else {
            this.arrow.visible = false;
        }
    }
    onDragStart(e) {
        this.dragStartPos = e.data.getLocalPosition(this.app.stage);
        this.setState({isDragging: true});
    }
    onDragEnd() {
        this.setState({isDragging: false});
    }
    onMove() {
        if (this.state.isDragging) {
            //const pos = e.data.getLocalPosition(this.app.stage);
        }
    }
}

TransitView.propTypes = {
    phase: PropTypes.number.isRequired,
    planetRadius: PropTypes.number.isRequired,
    starMass: PropTypes.number.isRequired
};
