import { CGMSimParams, Perlin, Sgv } from './Types';
declare const sgv_start: (entries: Sgv[], { basalActivity, liverActivity, carbsActivity, bolusActivity }: CGMSimParams, perls: Perlin[], isf: number) => {
    sgv: number;
    deltaMinutes: number;
    carbsActivity: number;
    basalActivity: number;
    bolusActivity: number;
    noiseActivity: number;
    liverActivity: number;
    pumpBasalActivity: number;
};
export default sgv_start;
