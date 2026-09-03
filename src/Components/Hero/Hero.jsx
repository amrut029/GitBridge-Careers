import React from "react";
import { HeroLeft } from "./HeroLeft";
import { HeroRight } from "./HeroRight";
import "./Hero.css";

const Hero = () => {
  return (
    <section className="hero-section">

      <div className="hero-container">

        <HeroLeft />

        <HeroRight />

      </div>

    </section>
  );
};

export default Hero;