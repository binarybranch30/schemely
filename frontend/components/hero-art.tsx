"use client";
import { motion, useReducedMotion } from "framer-motion";
import { GraduationCap, HeartPulse, Landmark, Sprout, Compass } from "lucide-react";

export function HeroArt() {
  const reduced = useReducedMotion();
  return <motion.div aria-hidden className="hero-art" initial={reduced ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
    <div className="orbit orbit-outer" /><div className="orbit orbit-inner" />
    <div className="hero-emblem"><Landmark size={76} strokeWidth={1.2} /></div>
    <span className="art-tile art-student"><GraduationCap size={28}/></span>
    <span className="art-tile art-farm"><Sprout size={28}/></span>
    <span className="art-tile art-health"><HeartPulse size={26}/></span>
    <span className="art-tile art-compass"><Compass size={24}/></span>
    <span className="art-dot dot-top"/><span className="art-dot dot-bottom"/>
  </motion.div>;
}
