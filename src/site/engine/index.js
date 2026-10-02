// Engine load order matters: globals, namespace, motion, FX, chrome, then every section's choreography.
import './gsap.js';
import './00-site.js';
import './01-motion.js';
import './02-fx.js';
import './03-preloader.js';
import './04-cursor.js';
import './05-nav.js';
import './06-chrome.js';
import '../fx/10-hero.js';
import '../fx/15-tape.js';
import '../fx/20-author.js';
import '../fx/30-book.js';
import '../fx/40-series.js';
import '../fx/50-trailer.js';
import '../fx/60-reviews.js';
import '../fx/80-contact.js';
import '../fx/95-footer.js';
export { bootSite } from './boot.js';
