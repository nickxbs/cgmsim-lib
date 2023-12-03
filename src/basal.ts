import { TreatmentDelta, Treatment } from './Types';
import logger, { getDeltaMinutes, getTreatmentActivity } from './utils';

export const peakBasal = {
	GLA: (duration: number) => duration / 2.5,
	DET: (duration: number) => duration / 3,
	TOU: (duration: number) => duration / 2.5,
	DEG: (duration: number) => duration / 3,
};
export const durationBasal = {
	GLA: (units: number, weight: number) => (22 + (12 * units) / weight) * 60,
	DET: (units: number, weight: number) => (14 + (24 * units) / weight) * 60,
	TOU: (units: number, weight: number) => (24 + (14 * units) / weight) * 60,
	DEG: () => 42 * 60,
};

export const computeBasalActivity = (treatments: TreatmentDelta[]) => {
	// activities be expressed as U/min !!!
	const treatmentsActivity = treatments.map((e) => {
		const minutesAgo = e.minutesAgo;
		const units = e.units;
		const activity = getTreatmentActivity(
			e.peak,
			e.duration,
			e.minutesAgo,
			e.units
		);
		return activity;
	});
	logger.debug('these are the last Slow INSULINS: %o', treatmentsActivity);
	const resultAct = treatmentsActivity.reduce((tot, activity) => {
		return tot + activity;
	}, 0);
	return resultAct;
};

export default function (treatments: Treatment[], weight: number): number {
	//Find basal boluses
	const basals =
		treatments && treatments.length
			? treatments
					.filter((e) => e.notes)
					.map((e) => {
						const lastIndexEmptySpace = e.notes.lastIndexOf(' ');
						logger.debug(
							'tou %o',
							parseInt(e.notes.slice(lastIndexEmptySpace), 10)
						);
						return {
							minutesAgo: getDeltaMinutes(e.created_at),
							drug: e.notes.slice(0, 3),
							// units: parseInt(e.notes.slice(-2))
							units: parseInt(e.notes.slice(lastIndexEmptySpace), 10) || 0,
						};
					})
					.filter((e) => e.minutesAgo >= 0)
			: [];

	const lastBasals = basals.filter(function (e) {
		return e.minutesAgo <= 45 * 60; // keep only the basals from the last 45 hours
	});

	const lastGLA = lastBasals
		.filter((e) => {
			return (
				e.drug === 'gla' ||
				e.drug === 'Gla' ||
				e.drug === 'lan' ||
				e.drug === 'Lan'
			); // keep only the glas from the last 45 hours
		})
		.map((e) => {
			const duration = durationBasal.GLA(e.units, weight);
			const peak = peakBasal.GLA(duration);
			return {
				...e,
				units: e.units,
				duration,
				peak,
			};
		});
	const activityGLA = lastGLA.length > 0 ? computeBasalActivity(lastGLA) : 0;
	logger.debug('these are the last GLA: %o', { lastGLA, activityGLA });

	const lastDET = lastBasals
		.filter(function (e) {
			return (
				e.drug === 'det' ||
				e.drug === 'Det' ||
				e.drug === 'lev' ||
				e.drug === 'Lev'
			); // keep only the dets from the last 45 hours
		})
		.map((e) => {
			const duration = durationBasal.DET(e.units, weight);
			const peak = peakBasal.DET(duration);
			return {
				...e,
				units: e.units,
				duration,
				peak,
			};
		});

	const activityDET = lastDET.length ? computeBasalActivity(lastDET) : 0;
	logger.debug('these are the last DET: %o', { lastDET, activityDET });

	const lastTOU = lastBasals
		.filter(function (e) {
			return e.drug === 'tou' || e.drug === 'Tou'; // keep only the tous from the last 45 hours
		})
		.map((e) => {
			const duration = durationBasal.TOU(e.units, weight);
			const peak = peakBasal.TOU(duration);
			return {
				...e,
				units: e.units,
				duration,
				peak,
			};
		});
	const activityTOU = lastTOU.length ? computeBasalActivity(lastTOU) : 0;
	logger.debug('these are the last TOU: %o', { lastTOU, activityTOU });

	const lastDEG = lastBasals
		.filter(function (e) {
			return (
				e.drug === 'deg' ||
				e.drug === 'Deg' ||
				e.drug === 'tre' ||
				e.drug === 'Tre'
			); // keep only the degs from the last 45 hours
		})
		.map((e) => {
			const duration = durationBasal.DEG();
			const peak = peakBasal.DEG(duration);
			return {
				...e,
				units: e.units,

				duration,
				peak,
			};
		});
	const activityDEG = lastDEG.length ? computeBasalActivity(lastDEG) : 0;
	logger.debug('these are the last deg: %o', { lastDEG, activityDEG });

	return activityDEG + activityDET + activityGLA + activityTOU;
}
