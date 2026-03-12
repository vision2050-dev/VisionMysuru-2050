import {
  FiCompass,
  FiCpu,
  FiFeather,
  FiGlobe,
  FiLayers,
  FiMapPin,
  FiTarget,
  FiUsers,
} from "react-icons/fi";

const TOPICS = [
  {
    icon: FiMapPin,
    title: "Urban Infrastructure & Mobility",
    points: [
      "Public transport & last-mile connectivity",
      "Traffic, walkability & road safety",
      "Core civic infrastructure upgrades",
    ],
  },
  {
    icon: FiGlobe,
    title: "Environmental Sustainability",
    points: [
      "Water, waste & circular economy",
      "Urban greenery & biodiversity",
      "Clean energy & low-carbon solutions",
    ],
  },
  {
    icon: FiUsers,
    title: "Economic Development",
    points: [
      "Jobs, skills & entrepreneurship",
      "MSME growth & innovation ecosystems",
      "Investment, productivity & livelihoods",
    ],
  },
  {
    icon: FiCpu,
    title: "Digital Governance & Smart City",
    points: [
      "Citizen services & e-governance",
      "Data-driven operations & transparency",
      "Smart infrastructure & platforms",
    ],
  },
  {
    icon: FiLayers,
    title: "Education & Healthcare",
    points: [
      "Quality education & skilling pathways",
      "Public health, prevention & access",
      "Wellbeing & care delivery innovation",
    ],
  },
  {
    icon: FiFeather,
    title: "Heritage Conservation",
    points: [
      "Protect and restore heritage assets",
      "Heritage-sensitive urban development",
      "Community stewardship & awareness",
    ],
  },
  {
    icon: FiUsers,
    title: "Social Equity & Inclusion",
    points: [
      "Accessible public spaces and services",
      "Support for vulnerable communities",
      "Inclusive opportunities for all",
    ],
  },
  {
    icon: FiTarget,
    title: "Disaster Resilience",
    points: [
      "Flood/heat preparedness",
      "Early warning & response systems",
      "Resilient infrastructure planning",
    ],
  },
  {
    icon: FiCompass,
    title: "Tourism & Culture",
    points: [
      "Tourism experiences, trails & events",
      "Creative economy and local identity",
      "Sustainable visitor management",
    ],
  },
];

const TIMELINE = [
  {
    title: "Registration Opens",
    date: "Feb 01, 2026",
    eligibleFor: ["Students", "Corporates", "NGOs", "Citizens"],
    detail:
      "Registrations open for all participants to identify on-ground urban challenges across key city domains.",
  },
  {
    title: "Registration Closes",
    date: "Mar 13, 2026",
    eligibleFor: ["Students", "Corporates", "NGOs", "Citizens"],
    detail:
      "Final deadline to submit your ideas. Extended due to overwhelming demand! Ensure all required documents and field evidence are uploaded before this date.",
  },
  {
    title: "Round Zero: Administrative Check",
    date: "Mar 14, 2026",
    eligibleFor: ["Students", "Corporates", "NGOs", "Citizens"],
    detail:
      "All submissions undergo an administrative check to verify completeness and eligibility across all four categories.",
  },
  {
    title: "Round 1: The Student Qualifier",
    date: "Mar 14, 2026",
    eligibleFor: ["Students"],
    detail:
      "Student teams are evaluated and the top 50 teams are shortlisted to advance to the next round.",
  },
  {
    title: "Round 2: Expert Screening",
    date: "Mar 14, 2026",
    eligibleFor: ["Students", "Corporates", "NGOs", "Citizens"],
    detail:
      "Category experts review submissions. Top 10 teams from each category (40 in total) advance to the next round.",
  },
  {
    title: "Round 3: Category Showdown",
    date: "Mar 15, 2026",
    eligibleFor: ["Students", "Corporates", "NGOs", "Citizens"],
    detail:
      "Physical presentation at SDMIMD Campus before category-specific experts. The top 10 highest scoring teams (regardless of category) advance to the Grand Finale.",
  },
  {
    title: "Round 4: The Grand Finale",
    date: "Mar 16, 2026",
    eligibleFor: ["Top 10 Finalists"],
    detail:
      "Final pitch before high-ranking Government Representatives, Industry Leaders and Academic Directors. Attractive cash prizes for top 3 winners. Ideas of top 10 finalists will be published as a White Paper.",
  },
];

const CATEGORY = {
  CITIZENS: "citizens",
  STUDENT: "student",
  CORPORATE: "corporate",
  NGO: "ngo",
};

const TOPIC_OPTIONS = [
  "Urban Infrastructure & Mobility",
  "Environmental Sustainability",
  "Economic Development",
  "Digital Governance & Smart City",
  "Education & Healthcare",
  "Heritage Conservation",
  "Social Equity & Inclusion",
  "Disaster Resilience",
  "Tourism & Culture",
];

const CORE_OBJECTIVES = [
  {
    title: 'To Create a Neutral "Think-Tank"',
    desc: "Create a non-partisan platform where academia, industry, and government collaborate on Mysuru’s long-term urban challenges.",
    outcome:
      "Enables informed dialogue, shared understanding, and research-backed policy inputs.",
  },
  {
    title: "To Bridge the Civic Data Gap",
    desc: "Engage students to capture granular, hyper-local civic data often missed by conventional surveys.",
    outcome:
      "Builds a living data layer reflecting real conditions across neighbourhoods.",
  },
  {
    title: "To Foster Safe and Responsible Innovation",
    desc: "Provide a controlled environment to test bold ideas, technologies, and new approaches before deployment.",
    outcome:
      "Encourages experimentation while reducing real-world implementation risk.",
  },
  {
    title: "To Institutionalise the Future",
    desc: "Convert validated insights and proposals into a formal, institutionally recognised white paper.",
    outcome: "Ensures continuity, accountability, and long-term civic impact.",
  },
];

const GUIDELINES = {
  categories: [
    {
      id: "citizens",
      title: "Citizens Category",
      subtitle: "OPEN TO ALL CITIZENS",
      eligibility: [
        "Open to any individual or informal group interested in civic improvement",
        "No organizational affiliation required",
        "Team Size: 1–3 members (individual submissions allowed)",
      ],
      purpose: [
        "Encourage citizen-driven ideas",
        "Capture diverse perspectives from all walks of life",
        "Enable individuals to contribute to Mysuru's future",
      ],
      submissionComponents: [
        {
          title: "Community Problem Description",
          details: [
            "Must include: Area / locality name",
            "Nature of community impact",
            "Duration of the issue",
          ],
        },
        {
          title: "Evidence of Ground Engagement",
          details: [
            "Suggested Evidences(if applicable): Photographic evidence, Community petition summary, Prior representations to authorities",
          ],
        },
        {
          title: "Suggested Intervention",
          details: [
            "Practical and community-oriented",
            "Can involve: Awareness programs, Infrastructure support, Policy reform suggestions",
          ],
        },
      ],
    },
    {
      id: "student",
      title: "Student Category",
      subtitle: "CITY CONSULTANTS IN MAKING",
      eligibility: [
        "Open to Undergraduate and Postgraduate students from: Engineering, Management, Arts, Science",
        "Students must be enrolled in institutions located in or associated with Mysuru",
        "Inter-college teams are permitted",
        "Team Size: 2–3 students",
      ],
      purpose: [
        "Civic problem identifiers",
        "Ground-level data collectors",
        "Future policy thinkers",
        "This is NOT an idea contest. It is a problem-validation-first civic exercise.",
      ],
      submissionComponents: [
        {
          title: "Evidence Component (Compulsory)",
          details: [
            "One clear geotagged photograph taken by the team",
            "Photo must clearly show the civic issue",
            "Be taken within Mysuru city limits",
            "Not be downloaded or reused from online sources",
            "❌ Stock images or edited visuals will lead to immediate disqualification",
          ],
        },
        {
          title: "Problem Statement (Max 100 words)",
          details: [
            "Must clearly answer: What exactly is the problem?",
            "Who is affected?",
            "Why does it matter to Mysuru’s future?",
            "Focus on clarity, not complexity.",
          ],
        },
        {
          title: "Domain Mapping",
          details: [
            "The problem must fall strictly under one domain from the general list.",
          ],
        },
      ],
    },
    {
      id: "corporate",
      title: "Corporate Category",
      subtitle: "EXECUTION PARTNERS OF THE CITY",
      eligibility: [
        "Open to Startups, MSMEs, Large enterprises",
        "Operating in or planning expansion in Mysuru region",
        "Registered entities only",
        "One submission per organization (recommended)",
      ],
      purpose: [
        "Provide execution realism",
        "Highlight infrastructure & policy bottlenecks",
        "Propose Public–Private Partnership (PPP) models",
        "This is not a branding exercise.",
      ],
      submissionComponents: [
        {
          title: "Problem Identification (Optional)",
          details: [
            "Corporates may adopt an existing student-identified problem",
            "OR present a systemic industry-related issue",
          ],
        },
        {
          title: "Solution Blueprint (Mandatory)",
          details: [
            "Proposed intervention",
            "Estimated investment range",
            "Required government facilitation",
            "Timeline (Short / Medium / Long term)",
          ],
        },
        {
          title: "Feasibility Justification",
          details: [
            "Operational capability",
            "Financial reasoning (indicative, not audited)",
            "Scalability beyond pilot stage",
          ],
        },
      ],
    },
    {
      id: "ngo",
      title: "NGO / Community Category",
      subtitle: "THE VOICE OF THE PEOPLE",
      eligibility: [
        "Open to NGOs, Resident Welfare Associations (RWAs), Trade Associations, Civil Society Groups",
        "Operating within Mysuru district",
        "✔ Must have verifiable community presence",
      ],
      purpose: [
        "Represent citizen realities",
        "Validate grassroots issues",
        "Ensure inclusivity and social balance in policy",
      ],
      submissionComponents: [
        {
          title: "Community Problem Description",
          details: [
            "Must include: Area / locality name",
            "Nature of community impact",
            "Duration of the issue",
          ],
        },
        {
          title: "Evidence of Ground Engagement",
          details: [
            "Any one of: Photographic evidence, Community petition summary, Prior representations to authorities",
          ],
        },
        {
          title: "Suggested Intervention",
          details: [
            "Practical and community-oriented",
            "Can involve: Awareness programs, Infrastructure support, Policy reform suggestions",
          ],
        },
      ],
    },
  ],
};
const STATUS_STYLES = {
  Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  screening_shortlisted: "bg-blue-100 text-blue-800 border-blue-200",
  screening_rejected: "bg-red-100 text-red-800 border-red-200",
  r1_shortlisted: "bg-indigo-100 text-indigo-800 border-indigo-200",
  r1_eliminated: "bg-red-100 text-red-800 border-red-200",
  r2_eliminated: "bg-red-100 text-red-800 border-red-200",
  finalist: "bg-purple-100 text-purple-800 border-purple-200",
  winner: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

const STATUS_GROUPS = [
  {
    key: "submission",
    label: "Submission",
    statuses: ["Pending"],
  },
  {
    key: "screening",
    label: "Online Screening",
    statuses: ["screening_shortlisted", "screening_rejected"],
  },
  {
    key: "r1",
    label: "Round 1 · Student Elimination",
    statuses: ["r1_shortlisted", "r1_eliminated"],
  },
  {
    key: "r2",
    label: "Round 2 · Corporate Summit",
    statuses: ["r2_eliminated", "finalist"],
  },
  {
    key: "final",
    label: "Final Stage",
    statuses: ["winner"],
  },
];

const GROUPS = [
  {
    title: "Media Partners",
    items: [{ name: "Star of Mysore", src: "/Spons/starmys.jpeg" }],
  },
  {
    title: "Academic Partners",
    items: [
      { name: "JSS", src: "/Spons/jss.jpeg" },
      { name: "NIE", src: "/Spons/nie.jpeg" },
      { name: "VVCE", src: "/Spons/vvce.jpeg" },
    ],
  },
  {
    title: "Association Partners",
    items: [
      { name: "MGP", src: "/Spons/mgp.jpeg" },
      { name: "CII", src: "/Spons/cii.png" },
      { name: "TIE", src: "/Spons/tie.png" },
    ],
  },
  {
    title: "Industry-Academia Partner",
    items: [
      {
        name: "Edin Foundation",
        src: "/Spons/edin2.png",
      },
      {
        name: "MCCI",
        src: "/Spons/MCCI.jpg",
      },
    ],
  },
  {
    title: "HR Partner",
    items: [
      {
        name: "Mysore CHRO Forum",
        src: "/Spons/MCF.png",
      },
    ],
  },
  {
    title: "Cause Partner",
    items: [
      {
        name: "Young India Foundation",
        src: "/Spons/yi.jpeg",
      },
    ],
  },
  {
    title: "Corporate Partner",
    items: [
      {
        name: "ET MARK",
        src: "/Spons/etmark.png",
      },
    ],
  },
];

export {
  TOPICS,
  TIMELINE,
  CATEGORY,
  TOPIC_OPTIONS,
  CORE_OBJECTIVES,
  GUIDELINES,
  STATUS_STYLES,
  STATUS_GROUPS,
  GROUPS,
};
