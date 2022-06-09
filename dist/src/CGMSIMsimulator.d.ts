import { MainParams } from './Types';
declare const simulator: ({ env, entries, treatments, profiles, perlinParams, pumpBasals }: MainParams) => {
    sgv: number;
    deltaMinutes: number;
    carbsActivity: number;
    basalActivity: number;
    bolusActivity: number;
    noiseActivity: number;
    liverActivity: number;
    pumpBasalActivity: number;
};
export default simulator;
