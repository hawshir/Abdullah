import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, CustomEase);
ScrollTrigger.config({ ignoreMobileResize: true });
CustomEase.create("lux", ".22,1,.36,1");

export { gsap, ScrollTrigger };
