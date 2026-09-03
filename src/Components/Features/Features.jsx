import { motion } from "framer-motion";
import { FeatureCard } from "./FeatureCard";
import "./Features.css";
import { FeaturesData } from "./FeaturesData";

export const Features = () => {
  return (
    <motion.section
      className="features-section"
      initial={{ opacity: 0, y: 120 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.8,
        ease: "easeOut",
      }}
      viewport={{ once: true, amount: 0.3 }}
    >
      <div className="section-heading">
        <motion.span
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          viewport={{ once: true }}
        >
          POWERFUL FEATURES
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          viewport={{ once: true }}
        >
          Everything You Need to Grow Your Career
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          viewport={{ once: true }}
        >
          AI-powered tools to analyze, improve and accelerate your journey.
        </motion.p>
      </div>

      <div className="features-grid">
        {FeaturesData.map((feature, index) => (
          <motion.div
            key={feature.id}
            initial={{ opacity: 0, y: 80 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{
              delay: index * 0.15,
              duration: 0.6,
            }}
            viewport={{ once: true }}
          >
            <FeatureCard feature={feature} />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};