import {
  FaGithub,
  FaFileAlt,
  FaBullseye,
} from "react-icons/fa";

const dashboardData = {
  user: {
    name: "Soham",
    greeting: "Welcome back 👋",
  },

  careerScore: {
    score: 84,
    status: "Good Progress",
  },

  scoreCards: [
    {
      id: 1,
      title: "GitHub Score",
      score: 64,
      total: 100,
      icon: FaGithub,
      color: "#8B5CF6",
    },

    {
      id:2,
      title:"Resume",
      score:88,
      total:100,
      icon:FaGithub,
      color:"#2563EB"
    },

    {
      id: 3,
      title: "Skill Match",
      score: 72,
      total: 100,
      icon: FaBullseye,
      color: "#22C55E",
    },
  ],

  insight: {
    title: "AI Insight",
    description:
      "Your GitHub activity has improved by 18% this month. Upload an updated resume to increase your AI Career Score.",
  },
};

export default dashboardData;