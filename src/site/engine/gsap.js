// GSAP 3.15 (every plugin is free) and Lenis from npm, exposed on window for the engine modules.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { CustomEase } from 'gsap/CustomEase';
import { Flip } from 'gsap/Flip';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { Observer } from 'gsap/Observer';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

Object.assign(window, {
  gsap, ScrollTrigger, SplitText, CustomEase, Flip, DrawSVGPlugin, MorphSVGPlugin, MotionPathPlugin,
  Observer, ScrambleTextPlugin, Draggable, InertiaPlugin, Lenis,
});
