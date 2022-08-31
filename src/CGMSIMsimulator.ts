import logger from './utils';

//const logger = pino();

import perlinRun from './perlin';
import bolus from './bolus';
import basal from './basal';

import carbs from './carbs';
import arrowsRun from './arrows';
import liverRun from './liver';
import sgv from './sgv';
import { MainParams } from './Types';
import moment = require('moment');
import { physicalIsf, physicalLiver } from './physical';

logger.debug('Run Init');

const simulator = ({
	env,
	entries,
	treatments,
	profiles, //PUMP SIMULATION
	perlinParams,
	pumpBasals,
	activities, //7-DAYS
}: MainParams) => {

	const isfConstant = parseInt(env.ISF);
	let isfActivityDependent = isfConstant;
	let activityFactor = 1;
	if (isfActivityDependent < 9) {
		throw new Error("Isf must be greater then or equal to 9");
	}
	if (activities && activities.length > 0) {
		isfActivityDependent = isfConstant * physicalIsf(activities);
		activityFactor = physicalLiver(activities);
	}
	const weight = parseInt(env.WEIGHT);
	const dia = parseInt(env.DIA);
	const tp = parseInt(env.TP);
	const carbsAbs = parseInt(env.CARBS_ABS_TIME);
	const cr = parseInt(env.CR);
	const perls = perlinRun(perlinParams);



	const bolusActivity = bolus(treatments, dia, tp);
	const basalActivity = basal(treatments, weight);
	const carbsActivity = carbs(treatments, carbsAbs, isfActivityDependent, cr);


	// //activity calc insulin
	// const det = detemirRun(weight, lastDET);
	// const gla = glargineRun(weight, lastGLA);
	// const degludec = degludecRun(lastDEG);
	// const tou = toujeoRun(weight, lastTOU);

	//activity calc carb
	const liverActivity = liverRun(isfConstant, cr, activityFactor);
	const now = moment();
	const orderedEntries = entries.filter(e => e.mills <= now.toDate().getTime()).sort((a, b) => b.mills - a.mills)

	const newSgvValue = sgv(orderedEntries, { basalActivity, liverActivity, carbsActivity, bolusActivity }, perls, isfActivityDependent);

	logger.debug('this is the new sgv: %o', newSgvValue);
	// const arrows = arrowsRun([newSgvValue, ...entries]);

	return { ...newSgvValue };
};

export default simulator;

