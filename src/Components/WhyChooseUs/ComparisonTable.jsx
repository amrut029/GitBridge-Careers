import { motion } from "framer-motion";
import { ComparisonData } from "./ComparisonData";
import "./ComparisonTable.css";

const tableVariant = {
  hidden: {
    opacity: 0,
    x: 100,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.7,
      ease: "easeOut",
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
};

const rowVariant = {
  hidden: {
    opacity: 0,
    y: 25,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export const ComparisonTable = () => {
  return (
    <motion.table
      className="comparison-table"
      variants={tableVariant}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
    >
      <thead>
        <motion.tr variants={rowVariant}>
          <th>Features</th>
          <th>Other Platforms</th>
          <th>GitBridge AI</th>
        </motion.tr>
      </thead>

      <tbody>
        {ComparisonData.map((item) => (
          <motion.tr key={item.id} variants={rowVariant}>
            <td>{item.feature}</td>
            <td>{item.other}</td>
            <td>{item.gitBridge}</td>
          </motion.tr>
        ))}
      </tbody>
    </motion.table>
  );
};