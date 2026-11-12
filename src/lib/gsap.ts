import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

gsap.registerPlugin(ScrollTrigger, CustomEase, ScrollToPlugin);
CustomEase.create("lux", "0.22,1,0.36,1");
ScrollTrigger.config({ ignoreMobileResize: true });

export { gsap, ScrollTrigger };
