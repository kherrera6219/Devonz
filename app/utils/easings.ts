import { cubicBezier } from 'framer-motion';

export const cubicEasingFn = cubicBezier(0.8, 0, 0.2, 1);

/** Fluent decelerate curve — for elements entering the screen */
export const fluentDecelerate = cubicBezier(0, 0, 0, 1);

/** Fluent accelerate curve — for elements leaving the screen */
export const fluentAccelerate = cubicBezier(1, 0, 1, 1);
