import { motion } from "framer-motion";
import "./WhyChooseUs.css";
import { ComparisonTable } from "./ComparisonTable";
import WhyChooseImage from "../../assets/1whychoose.png";

export const WhyChooseUs = () => {
  return (
    <section className="why-section">

      <motion.div
        className="why-left"
        initial={{
          opacity: 0,
          x: -120,
        }}
        whileInView={{
          opacity: 1,
          x: 0,
        }}
        transition={{
          duration: 0.8,
          ease: "easeOut",
        }}
        viewport={{
          once: true,
          amount: 0.3,
        }}
      >
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          viewport={{ once: true }}
        >
          Why Choose GitBridge AI?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          viewport={{ once: true }}
        >
          We go beyond traditional job portals by combining AI,
          GitHub analysis and resume intelligence into one platform.
        </motion.p>

        <motion.div
          className="graduate-box"
          initial={{
            opacity: 0,
            scale: 0.8,
            rotate: -5,
          }}
          whileInView={{
            opacity: 1,
            scale: 1,
            rotate: 0,
          }}
          transition={{
            delay: 0.5,
            duration: 0.7,
          }}
          viewport={{ once: true }}
        >
          <img src={WhyChooseImage} alt="" />
        </motion.div>
      </motion.div>

      <motion.div
        className="why-right"
        initial={{
          opacity: 0,
          x: 120,
        }}
        whileInView={{
          opacity: 1,
          x: 0,
        }}
        transition={{
          duration: 0.8,
          delay: 0.2,
          ease: "easeOut",
        }}
        viewport={{
          once: true,
          amount: 0.3,
        }}
      >
        <ComparisonTable />
      </motion.div>

    </section>
  );
};