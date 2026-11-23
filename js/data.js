/**
 * AFOSTECH - Association of Food Science and Technology Students
 * Central Data Store
 */

const AFOSTECH_DATA = {
  organization: {
    name: "Association of Food Science and Technology Students",
    acronym: "AFOSTECH",
    officialEmail: "secretariat@afostech-students.org",
    partnershipsEmail: "partnerships@afostech-students.org",
    motto: "Pioneering Sustainable Nutrition & Food Innovation Across Borders",
    established: "1997",
    description: "AFOSTECH is the premier inter-university collegiate consortium dedicated to uniting food science, technology, and clinical nutrition students. We empower the next generation of food scientists to transform agricultural bounties into fortified, climate-resilient, and commercially viable food products through rigorous scientific research, inter-collegiate collaboration, and positive peer competition.",
    vision: "To be Africa and the globe's foremost student-led catalyst for zero-hunger, safe food processing, and breakthrough nutritional sciences.",
    mission: "To inspire innovation, foster healthy peer competition among universities, provide mentorship from food industry leaders, and translate classroom food chemistry and microbiology into high-impact community products.",
    pillars: [
      {
        icon: "microscope",
        title: "Nutritional Biotechnology & R&D",
        desc: "Transforming indigenous crops and underutilized bio-resources into high-bioavailability functional foods."
      },
      {
        icon: "trophy",
        title: "Inter-University Peer Competition",
        desc: "Annual Food Innovation hackathons, sensory panels, and competitive pitch cups that push academic excellence."
      },
      {
        icon: "shield-check",
        title: "Food Safety & Quality Assurance",
        desc: "Standardizing HACCP protocols, shelf-life testing, and microbiology best practices across university labs."
      },
      {
        icon: "recycle",
        title: "Circular Economy & Agro-Waste Upcycling",
        desc: "Developing biodegradable packaging and functional ingredients from post-harvest food processing by-products."
      }
    ],
    stats: {
      partnerUniversities: 7,
      studentInnovators: 23,
      prototypesDeveloped: 8,
      peerReviewsLogged: 124,
      patentsPending: 8,
      thesesPublished: 6
    }
  },

  staffOfficials: [
    {
      id: "staff-1",
      name: "Dr. Kwabena Mensah",
      role: "Director of Academic Partnerships & Standards",
      email: "admin@afostech-students.org",
      password: "admin123", // Demo credentials
      department: "Consortium Secretariat"
    },
    {
      id: "staff-2",
      name: "Prof. Mary Anyango",
      role: "Head of Competition & Sensory Verification Board",
      email: "sensory@afostech-students.org",
      password: "admin123",
      department: "Ethics & Quality Council"
    }
  ],

  news: [
    {
      id: "news-1",
      badge: "Competition Alert",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
      title: "Registration Live: All-African Inter-University Food Innovation Pitch Cup 2026",
      date: "Nov 18, 2026",
      summary: "University teams across East, West, and Southern Africa are invited to submit laboratory prototypes. Top 5 finalists pitch live before international food venture capitalists and win $7,500 seed grants.",
      actionLabel: "Register Team / View Guidelines →",
      link: "#submit"
    },
    {
      id: "news-2",
      badge: "Partnership Milestone",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
      title: "3 New Campuses Apply to Join AFOSTECH Consortium",
      date: "Nov 12, 2026",
      summary: "University of Cape Coast (Ghana), Hawassa University (Ethiopia), and LUANAR (Malawi) have submitted institutional partnership applications. Staff officials will review lab certifications this month.",
      actionLabel: "Learn About Partnership Requirements →",
      link: "#partner"
    },
    {
      id: "news-3",
      badge: "HACCP & Standards",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
      title: "AFOSTECH Standards Council Releases 2026 Student Lab Guidelines",
      date: "Oct 29, 2026",
      summary: "Standardized protocols for sensory hedonic testing, accelerated shelf-life analysis, and toxicological assays are now available for all registered university chapters.",
      actionLabel: "Download Lab Manual (PDF) →",
      link: "#standards"
    },
    {
      id: "news-4",
      badge: "Industry Mentorship",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
      title: "Nestle & Africa Food Labs Launch $25,000 Incubation Cohort",
      date: "Oct 15, 2026",
      summary: "Verified Innovators from the AFOSTECH Board of Honour will receive pilot manufacturing support, packaging machinery access, and retail distribution mentoring.",
      actionLabel: "View Innovators Board of Honour →",
      link: "#innovators"
    }
  ],

  universities: [
    {
      id: "jkuat",
      name: "Jomo Kenyatta University of Agriculture & Technology",
      shortName: "JKUAT",
      country: "Kenya",
      city: "Juja",
      logoColor: "#15803d",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
      totalPoints: 4850,
      rank: 1,
      projectsCount: 1,
      studentScientistsCount: 3,
      chapterLead: "Dr. Faith Ndunge & Brenda Muthoni (Chapter President)",
      strengths: "Post-Harvest Engineering, Fermentation Tech, Food Extrusion",
      verificationEmail: "registrar.academic@jkuat.ac.ke",
      deanEmail: "dean.foodscience@jkuat.ac.ke",
      faculty: "School of Food and Nutritional Sciences (SoFNS)",
      registrarOfficer: "Office of the Academic Registrar - JKUAT"
    },
    {
      id: "uon",
      name: "University of Nairobi",
      shortName: "UoN - Kabete",
      country: "Kenya",
      city: "Nairobi",
      logoColor: "#1d4ed8",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
      totalPoints: 4620,
      rank: 2,
      projectsCount: 1,
      studentScientistsCount: 3,
      chapterLead: "Emmanuel Kiprono (Lead Student Researcher)",
      strengths: "Applied Human Nutrition, Dairy Technology, Clinical Dietetics",
      verificationEmail: "registrar.acad@uonbi.ac.ke",
      deanEmail: "dean.cavs@uonbi.ac.ke",
      faculty: "Faculty of Agriculture & Food Science - Upper Kabete",
      registrarOfficer: "Academic Registrar's Directorate - UoN"
    },
    {
      id: "makerere",
      name: "Makerere University",
      shortName: "Makerere",
      country: "Uganda",
      city: "Kampala",
      logoColor: "#b91c1c",
      badgeColor: "bg-red-100 text-red-800 border-red-300",
      totalPoints: 4390,
      rank: 3,
      projectsCount: 1,
      studentScientistsCount: 3,
      chapterLead: "Trevor Okello & Grace Nabirye",
      strengths: "Indigenous Crop Bio-fortification, Edible Packaging, Food Microbiology",
      verificationEmail: "academic.registrar@mak.ac.ug",
      deanEmail: "dean.caes@mak.ac.ug",
      faculty: "College of Agricultural & Environmental Sciences (CAES)",
      registrarOfficer: "Office of the Academic Registrar - Makerere"
    },
    {
      id: "knust",
      name: "Kwame Nkrumah Univ. of Science & Technology",
      shortName: "KNUST",
      country: "Ghana",
      city: "Kumasi",
      logoColor: "#d97706",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
      totalPoints: 3980,
      rank: 4,
      projectsCount: 2,
      studentScientistsCount: 5,
      chapterLead: "Kwame Asante",
      strengths: "Cocoa By-Product Upcycling, Starch Rheology, Emulsion Chemistry",
      verificationEmail: "registrar@knust.edu.gh",
      deanEmail: "dean.foodscience@knust.edu.gh",
      faculty: "Faculty of Biosciences & Food Technology",
      registrarOfficer: "Academic Affairs Directorate - KNUST"
    },
    {
      id: "egerton",
      name: "Egerton University",
      shortName: "Egerton",
      country: "Kenya",
      city: "Njoro",
      logoColor: "#047857",
      badgeColor: "bg-teal-100 text-teal-800 border-teal-300",
      totalPoints: 3750,
      rank: 5,
      projectsCount: 1,
      studentScientistsCount: 3,
      chapterLead: "Lucy Chebet",
      strengths: "Dairy Science & Technology, Cereal Chemistry, Malting Science",
      verificationEmail: "registrar.aa@egerton.ac.ke",
      deanEmail: "dean.agric@egerton.ac.ke",
      faculty: "Faculty of Agriculture - Dept of Dairy & Food Science",
      registrarOfficer: "Registrar (Academic Affairs) - Egerton"
    },
    {
      id: "ibadan",
      name: "University of Ibadan",
      shortName: "UI Ibadan",
      country: "Nigeria",
      city: "Ibadan",
      logoColor: "#4338ca",
      badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-300",
      totalPoints: 3510,
      rank: 6,
      projectsCount: 1,
      studentScientistsCount: 3,
      chapterLead: "Oluwaseun Adeleke",
      strengths: "Tubers & Root Processing, Nano-encapsulation, Sensory Science",
      verificationEmail: "registrar@ui.edu.ng",
      deanEmail: "dean.technology@ui.edu.ng",
      faculty: "Faculty of Technology - Food Technology Dept",
      registrarOfficer: "Academic Affairs Division - UI Ibadan"
    },
    {
      id: "stellenbosch",
      name: "Stellenbosch University",
      shortName: "Stellenbosch",
      country: "South Africa",
      city: "Stellenbosch",
      logoColor: "#9333ea",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
      totalPoints: 3420,
      rank: 7,
      projectsCount: 1,
      studentScientistsCount: 3,
      chapterLead: "Pieter Van Zyl",
      strengths: "Alternative Proteins, Near-Infrared Food Spectroscopy, Viticulture Tech",
      verificationEmail: "registrar@sun.ac.za",
      deanEmail: "agrisciences@sun.ac.za",
      faculty: "Faculty of AgriSciences - Dept of Food Science",
      registrarOfficer: "Registrar & Student Records Directorate - Stellenbosch"
    }
  ],

  categories: [
    { id: "all", name: "All Innovations", icon: "sparkles" },
    { id: "functional", name: "Functional Foods & Beverages", icon: "coffee" },
    { id: "biofortified", name: "Biofortification & Clinical Nutrition", icon: "heart-pulse" },
    { id: "packaging", name: "Eco-Packaging & Waste Upcycling", icon: "leaf" },
    { id: "fermentation", name: "Fermentation & Probiotics", icon: "flask-conical" },
    { id: "alt-protein", name: "Alternative Proteins & Future Foods", icon: "dna" }
  ],

  thesisCategories: [
    { id: "all", name: "All Theses", icon: "📚" },
    { id: "biofortified", name: "Biofortification & Nutrition", icon: "🍠" },
    { id: "functional", name: "Functional Bioactives", icon: "🍹" },
    { id: "fermentation", name: "Microbiology & Ferment", icon: "🧪" },
    { id: "packaging", name: "Eco-Packaging & Storage", icon: "♻️" },
    { id: "alt-protein", name: "Alternative Proteins", icon: "🥩" }
  ],

  // Student Innovators on the Verified Board of Honour
  innovators: [
    {
      id: "inn-1",
      name: "Faith Wanjiru",
      email: "f.wanjiru@students.jkuat.ac.ke",
      admissionNo: "AG211-0452/2022",
      universityId: "jkuat",
      universityName: "JKUAT Kenya",
      degree: "B.Sc. Food Science & Postharvest Tech",
      yearOfStudy: "Final Year",
      password: "innovator2026",
      membershipStatus: "Authenticated Member",
      institutionalVerified: true,
      verified: true,
      boardOfHonour: true,
      pitchedCompetition: "Grand Champion — All-African Food Pitch Cup 2025",
      productName: "SpiroCracker™ Wafer",
      productId: "proj-1",
      bio: "Focuses on microalgae cultivation, carotenoid stabilization, and vacuum baking unit operations. Holds certified training in HACCP Level 3 and Sensory Hedonic Analysis.",
      cvFileName: "Faith_Wanjiru_CV_FoodScience.pdf",
      cvFileSize: "245 KB",
      publicSafetyCertified: true,
      investorAsk: {
        title: "Seed Grant for Continuous Pilot Baking Line",
        amountNeeded: "$14,500",
        category: "Equipment & Pilot Plant",
        description: "Looking for an agribusiness angel investor or grant partner to acquire a continuous belt vacuum drying oven to produce 2,500 wafers/day for school feeding pilots.",
        contactEmail: "f.wanjiru@students.jkuat.ac.ke"
      },
      inquiriesCount: 6
    },
    {
      id: "inn-2",
      name: "Amina Hassan",
      email: "amina.hassan@students.uonbi.ac.ke",
      admissionNo: "A22/45102/2021",
      universityId: "uon",
      universityName: "University of Nairobi",
      degree: "M.Sc. Food Microbiology & Dairy Science",
      yearOfStudy: "Postgraduate Year 2",
      password: "innovator2026",
      membershipStatus: "Authenticated Member",
      institutionalVerified: true,
      verified: true,
      boardOfHonour: true,
      pitchedCompetition: "1st Runner-Up — Pan-African Dairy Innovation Derby 2025",
      productName: "MobiYog: Synbiotic Baobab Camel Ferment",
      productId: "proj-2",
      bio: "Specializes in autochthonous lactic acid starter cultures adapted to arid rangelands. Has published 2 journal papers on camel milk antimicrobial peptides.",
      cvFileName: "Amina_Hassan_Microbiology_Resume.pdf",
      cvFileSize: "310 KB",
      publicSafetyCertified: true,
      investorAsk: {
        title: "Sterile Aseptic Bottling Line & Cold-Chain Exemption Validation",
        amountNeeded: "$18,000",
        category: "Manufacturing Scale-Up",
        description: "Partnering with northern pastoralist camel dairy cooperatives; we need working capital for glass packaging supply and third-party ISO 22000 commercial testing.",
        contactEmail: "amina.hassan@students.uonbi.ac.ke"
      },
      inquiriesCount: 9
    },
    {
      id: "inn-3",
      name: "Grace Nabirye",
      email: "g.nabirye@mak.ac.ug",
      admissionNo: "20/U/5120/EVE",
      universityId: "makerere",
      universityName: "Makerere University",
      degree: "B.Sc. Food Science & Technology",
      yearOfStudy: "Final Year",
      password: "innovator2026",
      membershipStatus: "Authenticated Member",
      institutionalVerified: true,
      verified: true,
      boardOfHonour: true,
      pitchedCompetition: "Gold Medal — Global Green Biopolymer Challenge 2025",
      productName: "BioChitoWrap: Antimicrobial Film",
      productId: "proj-3",
      bio: "Biopolymer chemist engineering sustainable food contact surfaces from agro-industrial wastes (crustacean shells and mango peel polyphenols).",
      cvFileName: "Grace_Nabirye_Biomaterials_CV.pdf",
      cvFileSize: "185 KB",
      publicSafetyCertified: true,
      investorAsk: {
        title: "Pilot Extrusion Blower & Biodegradability Certification",
        amountNeeded: "$22,000",
        category: "Industrial Machinery",
        description: "Seeking industry partners in commercial horticulture to co-fund trial runs for fresh strawberry and avocado export packaging.",
        contactEmail: "g.nabirye@mak.ac.ug"
      },
      inquiriesCount: 11
    },
    {
      id: "inn-4",
      name: "Kofi Boateng",
      email: "kofi.boateng@st.knust.edu.gh",
      admissionNo: "KNUST/FT/2021/088",
      universityId: "knust",
      universityName: "KNUST Ghana",
      degree: "B.Sc. Food Technology & Processing",
      yearOfStudy: "Final Year",
      password: "innovator2026",
      membershipStatus: "Authenticated Member",
      institutionalVerified: true,
      verified: true,
      boardOfHonour: true,
      pitchedCompetition: "Finalist — Future Food Alt-Protein Cup 2026",
      productName: "ProGrub: Mycomeat Sausage",
      productId: "proj-4",
      bio: "Pioneering high-moisture extrusion of defatted insect flours combined with striated indigenous plant fibers for affordable meat analogues.",
      cvFileName: "Kofi_Boateng_FoodTech_CV.pdf",
      cvFileSize: "290 KB",
      publicSafetyCertified: true,
      investorAsk: {
        title: "Commercial Sensory Kitchen & Consumer Retail Trial",
        amountNeeded: "$9,500",
        category: "Market Trial & Branding",
        description: "Seeking commercial food distributor to stock ready-to-cook chilled sausage links in 20 pilot supermarkets in Accra and Kumasi.",
        contactEmail: "kofi.boateng@st.knust.edu.gh"
      },
      inquiriesCount: 5
    }
  ],

  // University Partnership Requests (Pending Staff Review & Letter Viewing)
  partnershipRequests: [
    {
      id: "req-1",
      universityName: "University of Cape Coast",
      shortName: "UCC",
      country: "Ghana",
      city: "Cape Coast",
      referenceNo: "UCC/FST/DIR/2026/044",
      facultyDepartment: "School of Agriculture & Natural Sciences • Department of Food Science",
      officialEmail: "dept.foodscience@ucc.edu.gh",
      contactPerson: "Prof. Joseph Mensah, Ph.D.",
      contactTitle: "Dean, School of Agriculture",
      studentEnrollment: "320 Food Science & Nutrition Students",
      status: "Under Review",
      dateApplied: "Nov 14, 2026",
      letterDocumentFile: {
        name: "UCC_Official_Affiliation_Request_Letter_Signed.pdf",
        size: "2.8 MB",
        type: "application/pdf",
        uploadedAt: "Nov 14, 2026"
      },
      letterSubject: "FORMAL APPLICATION FOR INTER-UNIVERSITY CHAPTER AFFILIATION & STUDENT PRODUCT SHOWCASE ACCESS",
      letterOfIntent: "We wish to affiliate our Department of Food Science with AFOSTECH to allow our undergraduate and postgraduate students to enter the 2026 Pitch Cup and benchmark their novel plantain processing innovations.",
      fullLetterBody: `To: The Executive Council & Secretariat Directorate
Association of Food Science and Technology Students (AFOSTECH)
Collegiate Secretariat Office, School of Food & Nutritional Sciences

SUBJECT: FORMAL APPLICATION FOR INTER-UNIVERSITY CHAPTER AFFILIATION & STUDENT PRODUCT SHOWCASE ACCESS

Dear Executive Council Members and Faculty Advisors,

On behalf of the Faculty of Agriculture and Natural Sciences at the University of Cape Coast (UCC), Ghana, I write to formally apply for institutional affiliation with the Association of Food Science and Technology Students (AFOSTECH).

Our Department of Food Science currently trains over 320 undergraduate and postgraduate students specializing in post-harvest technology, tropical fruit and tuber processing, and indigenous food fermentation. For several years, our faculty has observed that final-year student product formulations—ranging from fortified plantain flour blends to probiotic fermented millet beverages—often lack a competitive inter-collegiate platform to receive rigorous cross-border peer review.

We have followed AFOSTECH's remarkable work in fostering positive peer competition, standardizing laboratory sensory evaluation, and connecting young African food scientists directly with industry investors. We are eager to formalize an active UCC Student Chapter under your charter.

In support of this affiliation, the University of Cape Coast commits to:
1. Adopting the AFOSTECH Standardized Laboratory HACCP & 9-point Hedonic Sensory protocols for all student prototype submissions.
2. Designating two full-time food microbiology faculty members to serve on the AFOSTECH Inter-Varsity Peer Review Committee.
3. Facilitating student participation in the annual All-African Food Innovation Pitch Cup.
4. Providing laboratory workspace, moisture extrusion machinery, and spectrophotometry equipment for collaborative inter-varsity trials.

We look forward to an expedited review of our institutional credentials and to welcoming AFOSTECH officials for the formal campus chapter commissioning ceremony.

Yours sincerely in agricultural and food advancement,

[Signed]
Prof. Joseph Mensah, Ph.D.
Dean, School of Agriculture & Natural Sciences
University of Cape Coast, Ghana
Institutional Domain: dept.foodscience@ucc.edu.gh`
    },
    {
      id: "req-2",
      universityName: "Hawassa University",
      shortName: "Hawassa",
      country: "Ethiopia",
      city: "Hawassa",
      referenceNo: "HU/ENG/FPE/2026/112",
      facultyDepartment: "Institute of Technology • Department of Food Process Engineering",
      officialEmail: "food.tech@hu.edu.et",
      contactPerson: "Dr. Berhanu Wolde, D.Sc.",
      contactTitle: "Head of Food Process Engineering & Nutrition",
      studentEnrollment: "280 Students",
      status: "Under Review",
      dateApplied: "Nov 09, 2026",
      letterDocumentFile: {
        name: "Hawassa_Dean_Affiliation_Request_Letter_Signed.pdf",
        size: "3.2 MB",
        type: "application/pdf",
        uploadedAt: "Nov 09, 2026"
      },
      letterSubject: "REQUEST FOR INSTITUTIONAL MEMBERSHIP & ENTRY INTO 2026 INTER-VARSITY LEADERBOARD",
      letterOfIntent: "Hawassa University's Food Science institute is eager to bring our research on Teff biofortification and Enset (false banana) fermentation onto the AFOSTECH inter-university leaderboard.",
      fullLetterBody: `To: The Directorate of Inter-University Affiliations
Association of Food Science and Technology Students (AFOSTECH)
secretariat@afostech-students.org / partnerships@afostech-students.org

SUBJECT: REQUEST FOR INSTITUTIONAL MEMBERSHIP & ENTRY INTO 2026 INTER-VARSITY LEADERBOARD

Dear Colleagues and Student Innovator Leaders,

It is with great academic enthusiasm that Hawassa University's Department of Food Process Engineering submits this official request for institutional chapter membership within the AFOSTECH consortium.

Hawassa University is renowned for pioneering research in indigenous Ethiopian food systems, notably the micronutrient bio-enrichment of Teff grain and the solid-state microbial fermentation of Enset (false banana) into nutritional staple matrices (Kocho and Bulla). Our student body comprises 280 aspiring food engineers who are formulating climate-smart, gluten-free food products with extraordinary market potential.

We strongly endorse AFOSTECH's philosophy that healthy, positive peer rivalry between universities elevates continental food security. Our students are eager to bench-test their formulations against peers at JKUAT, University of Nairobi, Makerere, and KNUST on your Inter-University Leaderboard.

We confirm that our laboratories meet international food safety requirements, including pilot freeze-drying units, high-pressure homogenizers, and a certified 20-booth sensory evaluation laboratory.

We respectfully request your approval to register the Hawassa University AFOSTECH Student Chapter and look forward to participating in the upcoming 2026 Pitch Cup.

Respectfully submitted,

[Signed]
Dr. Berhanu Wolde, D.Sc.
Head of Food Process Engineering & Nutrition
Hawassa University, Ethiopia
Email: food.tech@hu.edu.et`
    }
  ],

  // Institutional Verification Dispatch Log (Automated emails to University Registrars)
  verificationDispatches: [
    {
      id: "disp-101",
      referenceCode: "AFOST-VER-JKUAT-9281",
      projectId: "proj-1",
      projectTitle: "SpiroCracker™: Spirulina & OFSP High-Micronutrient Wafer",
      authorName: "Faith Wanjiru",
      admissionNo: "AG211-0452/2022",
      universityId: "jkuat",
      universityName: "Jomo Kenyatta University of Agriculture & Technology",
      recipientEmail: "registrar.academic@jkuat.ac.ke",
      ccEmails: "dean.foodscience@jkuat.ac.ke, secretariat@afostech-students.org",
      dispatchedAt: "Oct 24, 2026, 09:40 AM",
      status: "Institutionally Verified & Authenticated",
      confirmedAt: "Oct 25, 2026, 02:15 PM",
      confirmedBy: "Office of the Academic Registrar - JKUAT",
      dissertationDoc: "SpiroCracker_Thesis_Dissertation_Final.pdf",
      remarks: "Bonafide candidate in 4th Year B.Sc. Food Science & Technology confirmed. Enrollment active for 2025/2026 academic year."
    },
    {
      id: "disp-102",
      referenceCode: "AFOST-VER-UON-4820",
      projectId: "proj-2",
      projectTitle: "MobiYog: Ambient-Stable Synbiotic Baobab Camel Ferment",
      authorName: "Amina Hassan",
      admissionNo: "A22/45102/2021",
      universityId: "uon",
      universityName: "University of Nairobi",
      recipientEmail: "registrar.acad@uonbi.ac.ke",
      ccEmails: "dean.cavs@uonbi.ac.ke, secretariat@afostech-students.org",
      dispatchedAt: "Oct 28, 2026, 11:15 AM",
      status: "Institutionally Verified & Authenticated",
      confirmedAt: "Oct 29, 2026, 10:30 AM",
      confirmedBy: "Academic Registrar's Directorate - UoN",
      dissertationDoc: "MobiYog_Thesis_Dissertation.pdf",
      remarks: "Bonafide postgraduate student registered in Department of Food Science, Nutrition & Technology."
    },
    {
      id: "disp-103",
      referenceCode: "AFOST-VER-MAK-7731",
      projectId: "proj-3",
      projectTitle: "BioChito-Wrap: Chitosan-Infused Mango-Wax Antimicrobial Film",
      authorName: "Grace Nabirye",
      admissionNo: "20/U/5120/EVE",
      universityId: "makerere",
      universityName: "Makerere University",
      recipientEmail: "academic.registrar@mak.ac.ug",
      ccEmails: "dean.caes@mak.ac.ug, secretariat@afostech-students.org",
      dispatchedAt: "Nov 02, 2026, 03:22 PM",
      status: "Institutionally Verified & Authenticated",
      confirmedAt: "Nov 03, 2026, 09:12 AM",
      confirmedBy: "Office of the Academic Registrar - Makerere CAES",
      dissertationDoc: "BioChitoWrap_Thesis_Makerere.pdf",
      remarks: "Bonafide undergraduate student confirmed in School of Food Technology, Nutrition & Bio-Engineering."
    }
  ],

  // Research Theses & Dissertations Repository (Submitted by verified or unverified student innovators)
  theses: [
    {
      id: "thesis-1",
      title: "Optimization of Vacuum-Baking Protocols for Provitamin-A Carotenoid Retention in Extruded Microalgae-OFSP Matrix",
      tagline: "Overcoming thermal beta-carotene degradation in school feeding biscuits using Spirulina and Orange-Fleshed Sweet Potato.",
      author: "Faith Wanjiru",
      authorAdmissionNo: "AG211-0452/2022",
      authorDegree: "B.Sc. Food Science and Postharvest Technology",
      authorVerified: true,
      universityId: "jkuat",
      universityName: "JKUAT Kenya",
      supervisors: "Prof. Anselimo Makokha (Lead) & Dr. Willis Owino",
      department: "Department of Food Science and Technology",
      category: "biofortified",
      categoryLabel: "Biofortification & Clinical Nutrition",
      dateSubmitted: "October 2026",
      year: "2026",
      abstract: "Vitamin A deficiency (VAD) remains a leading cause of preventable childhood blindness and immune impairment across Sub-Saharan Africa. This research investigated the synergistic fortification of Orange-Fleshed Sweet Potato (Ipomoea batatas, cultivar Beauregard) with dried Spirulina platensis biomass (8% w/w) to deliver recommended daily allowances (RDA) for school-age children (4–8 years). Conventional atmospheric baking causes 45–65% degradation of trans-beta-carotene due to thermal oxidation. In this study, a laboratory-scale vacuum drying oven (0.6 bar vacuum, 105°C) was calibrated against traditional air baking (175°C). Beta-carotene retention was quantified via reverse-phase High-Performance Liquid Chromatography (RP-HPLC). Sensory evaluation across a 120-child hedonic panel indicated 91.2% overall acceptability when encapsulated citrus terpenes were added to mitigate algae chlorophyll aftertaste. Vacuum baking preserved 91.4 ± 1.8% of all-trans-beta-carotene compared to only 38.6% under standard convective baking. In vitro simulated gastrointestinal digestion revealed a 3.4-fold increase in micellar bioaccessibility. The findings establish that low-temperature vacuum baking is an economically viable intervention for school nutrition snack manufacturing across rural East Africa.",
      keywords: ["Beta-Carotene", "Spirulina platensis", "Vacuum Baking", "RP-HPLC", "Bioaccessibility", "OFSP"],
      file: {
        fileName: "Wanjiru_F_2026_VacuumBaking_OFSP_Spirulina_Thesis.pdf",
        fileSize: "4.8 MB",
        pages: 84,
        downloadsCount: 218
      },
      viewsCount: 740,
      comments: [
        {
          id: "c1-1",
          author: "Dr. Faith Ndunge",
          role: "Senior Lecturer, JKUAT",
          university: "JKUAT Kenya",
          date: "Nov 02, 2026",
          content: "Outstanding defense, Faith! The HPLC chromatograms showing all-trans vs 13-cis isomer distribution under vacuum baking are particularly rigorous and ready for peer-reviewed journal submission."
        },
        {
          id: "c1-2",
          author: "Trevor Okello",
          role: "Biopolymer Student Researcher",
          university: "Makerere University",
          date: "Nov 06, 2026",
          content: "Very applicable methodology. Did you observe any retrogradation changes or acoustic crispness losses during the 90-day accelerated shelf-life trial in metallized pouches?"
        }
      ]
    },
    {
      id: "thesis-2",
      title: "Isolation, Characterization and Thermotolerance Optimization of Autochthonous Lactic Acid Bacteria in Fermented Camel Milk (Suusac)",
      tagline: "Formulating an ambient-stable synbiotic camel milk beverage without cold-chain storage for arid pastoralist regions.",
      author: "Amina Hassan",
      authorAdmissionNo: "A22/45102/2021",
      authorDegree: "M.Sc. Food Microbiology and Dairy Technology",
      authorVerified: true,
      universityId: "uon",
      universityName: "University of Nairobi",
      supervisors: "Prof. Patrick Njage & Dr. George Ooko Abong'",
      department: "Department of Food Science, Nutrition & Technology",
      category: "fermentation",
      categoryLabel: "Fermentation & Probiotics",
      dateSubmitted: "September 2026",
      year: "2026",
      abstract: "Post-harvest spoilage claims over 40% of camel milk produced in northern Kenya due to excessive ambient temperatures (>38°C) and absence of uninterrupted cold chain infrastructure. This dissertation isolated indigenous starter cultures from traditional spontaneous pastoralist fermentations (Suusac) across Garissa and Isiolo counties. Phenotypic and 16S rRNA gene sequencing identified Lactobacillus plantarum strain AS-4 and Leuconostoc mesenteroides as the dominant resilient phenotypes. Strain AS-4 demonstrated exceptional heat shock tolerance, surviving exposure to 65°C for 25 minutes with viability exceeding 10^7 CFU/mL. Synergistic incorporation of Adansonia digitata (baobab fruit pulp) at 4.5% (w/v) acted as a potent prebiotic fructooligosaccharide substrate, lowering fermentation time to pH 4.3 within 6 hours at 37°C. Total plate counts remained above therapeutic thresholds (>10^6 CFU/mL) after 30 days of storage at 30°C without synthetic preservatives. Antimicrobial disk diffusion assays demonstrated broad-spectrum inhibition against Salmonella enterica and Staphylococcus aureus through natural bacteriocin secretion. This research provides a scalable technical blueprint for nomadic dairy cooperatives to commercialize shelf-stable functional probiotics.",
      keywords: ["Camel Milk", "Lactobacillus plantarum", "Suusac", "Thermotolerance", "Baobab Prebiotic", "Bacteriocins"],
      file: {
        fileName: "Hassan_A_2026_CamelMilk_Suusac_Probiotics_MSc.pdf",
        fileSize: "5.2 MB",
        pages: 108,
        downloadsCount: 345
      },
      viewsCount: 920,
      comments: [
        {
          id: "c2-1",
          author: "Emmanuel Kiprono",
          role: "Student Researcher",
          university: "University of Nairobi",
          date: "Oct 18, 2026",
          content: "Fascinating work on Suusac isolates, Amina. Did you conduct SDS-PAGE analysis of camel milk whey proteins to test if the strain degraded lactoferrin and lysozyme fractions?"
        },
        {
          id: "c2-2",
          author: "Lucy Chebet",
          role: "Dairy Technologist",
          university: "Egerton University",
          date: "Oct 24, 2026",
          content: "Egerton's dairy pilot plant would love to replicate this thermization curve for our camel milk yogurt trials in Baringo county. Very well articulated dissertation!"
        }
      ]
    },
    {
      id: "thesis-3",
      title: "Physicochemical and Antimicrobial Characterization of Chitosan-Based Biopolymer Films Plasticized with Mango Peel Polyphenols",
      tagline: "Replacing petrochemical cling wrap with biodegradable post-harvest packaging synthesized from crustacean chitin and discarded mango skins.",
      author: "Grace Nabirye",
      authorAdmissionNo: "20/U/5120/EVE",
      authorDegree: "B.Sc. Food Science and Technology",
      authorVerified: true,
      universityId: "makerere",
      universityName: "Makerere University",
      supervisors: "Dr. Ivan Muzira Mukisa & Assoc. Prof. John Muyonga",
      department: "School of Food Technology, Nutrition & Bio-Engineering",
      category: "packaging",
      categoryLabel: "Eco-Packaging & Waste Upcycling",
      dateSubmitted: "August 2026",
      year: "2026",
      abstract: "Post-harvest fruit rot caused by fungal pathogens (Colletotrichum gloeosporioides) inflicts severe export revenue losses in East African horticulture. Simultaneously, synthetic plastic films pose severe environmental accumulation hazards. This research developed an active, edible nanocomposite packaging material by blending waste freshwater crustacean chitosan (deacetylation degree 88.5%) with ultrasound-extracted polyphenols from discarded Tommy Atkins mango peels. Films cast with 1.5% (w/v) chitosan, 25% (w/w) glycerol, and 0.8% (w/v) mango peel phenolic extract exhibited tensile strength of 32.4 ± 1.6 MPa and water vapor permeability (WVP) of 1.42 × 10^-10 g/m·s·Pa. DPPH free-radical scavenging capacity exceeded 82%. When applied as an active wrapping for fresh strawberries and mangoes stored at 8°C, the composite film suppressed microbial growth, reduced weight loss by 44%, and extended marketable shelf-life from 6 to 19 days. Soil burial composting tests demonstrated complete biodegradation within 28 days with zero ecotoxic residue. The study demonstrates high industrial feasibility for closed-loop agro-waste valorization in sustainable fruit export logistics.",
      keywords: ["Chitosan", "Mango Peel Extract", "Active Packaging", "Biodegradable Film", "Fruit Shelf-Life", "Polyphenols"],
      file: {
        fileName: "Nabirye_G_2026_BioChito_Active_Packaging_Thesis.pdf",
        fileSize: "6.1 MB",
        pages: 96,
        downloadsCount: 412
      },
      viewsCount: 1150,
      comments: [
        {
          id: "c3-1",
          author: "Kwame Asante",
          role: "Starch Rheologist",
          university: "KNUST Ghana",
          date: "Sept 12, 2026",
          content: "Brilliant tensile strength numbers, Grace! Did you test oxygen transmission rates (OTR) across varying relative humidity gradients (e.g. 50% vs 90% RH)?"
        },
        {
          id: "c3-2",
          author: "Ronald Katende",
          role: "Agricultural Engineer",
          university: "Makerere University",
          date: "Sept 20, 2026",
          content: "Proud to have assisted in the tensile stress testing! The soil composting timeline is a game-changer for municipal solid waste reduction."
        }
      ]
    },
    {
      id: "thesis-4",
      title: "Rheological and Textural Properties of Black Soldier Fly (Hermetia illucens) Protein Isolate in Extruded Meat Analogs",
      tagline: "Engineering textured emulsion meat alternatives with jackfruit fiber and defatted entomoculture proteins.",
      author: "Kofi Boateng",
      authorAdmissionNo: "KNUST/FT/2021/088",
      authorDegree: "B.Sc. Food Process Engineering",
      authorVerified: false,
      universityId: "knust",
      universityName: "KNUST Ghana",
      supervisors: "Prof. Ibok Oduro & Dr. Herman Lutterodt",
      department: "Department of Food Science & Technology",
      category: "alt-protein",
      categoryLabel: "Alternative Proteins & Future Foods",
      dateSubmitted: "November 2026",
      year: "2026",
      abstract: "With global protein demand surging and livestock water consumption becoming unsustainable, insect entomoculture presents an environmentally superior alternative protein stream. This investigation evaluated defatted black soldier fly (Hermetia illucens) larval meal (HILM) as a functional replacer for soy protein concentrate in high-moisture extrusion texturization (HMET). Supercritical CO2 defatting produced a protein isolate with 78.4% crude protein and balanced essential amino acid profiles comparable to FAO/WHO reference standards. Blends incorporating 40% defatted HILM and 60% young jackfruit (Artocarpus heterophyllus) insoluble fiber were extruded in a co-rotating twin-screw extruder under barrel temperatures ranging from 110°C to 155°C. Warner-Bratzler shear force analysis revealed anisotropic fiber indices (1.68) closely matching cooked poultry breast. Texture profile analysis (TPA) showed springiness of 0.88 and chewiness of 14.2 N. Heavy metal and allergen assays confirmed values well below Codex Alimentarius limits. The findings illustrate a viable technical route to producing affordable, climate-resilient meat alternatives across West Africa.",
      keywords: ["Hermetia illucens", "Insect Protein", "Extrusion Texturization", "Jackfruit Fiber", "Meat Analog", "Anisotropic Index"],
      file: {
        fileName: "Boateng_K_2026_InsectProtein_Extrusion_Thesis.pdf",
        fileSize: "5.7 MB",
        pages: 102,
        downloadsCount: 189
      },
      viewsCount: 580,
      comments: [
        {
          id: "c4-1",
          author: "Pieter Van Zyl",
          role: "Spectroscopy Lead",
          university: "Stellenbosch University",
          date: "Nov 15, 2026",
          content: "The anisotropic fibrous alignment images from your scanning electron microscopy (SEM) are exceptional. Did the lipid defatting completely eliminate insect off-flavors during consumer sensory trials?"
        }
      ]
    },
    {
      id: "thesis-5",
      title: "Enzymatic Saccharification and Bioactive Peptide Kinetics in Sprouted Finger Millet and Bambara Groundnut Malts",
      tagline: "Formulating a high-protein, gluten-free malting extract for infant weaning foods and therapeutic beverages.",
      author: "Lucy Chebet",
      authorAdmissionNo: "EB12/1044/2022",
      authorDegree: "B.Sc. Food Science and Technology",
      authorVerified: false,
      universityId: "egerton",
      universityName: "Egerton University",
      supervisors: "Prof. Symon Mahungu & Dr. Joseph Wambui",
      department: "Department of Dairy & Food Science",
      category: "functional",
      categoryLabel: "Functional Foods & Bioactives",
      dateSubmitted: "July 2026",
      year: "2026",
      abstract: "Protein-energy malnutrition (PEM) persists as a critical nutritional challenge during early infant complementary feeding in pastoralist and agrarian communities. Indigenous finger millet (Eleusine coracana) and Bambara groundnut (Vigna subterranea) are hardy drought-tolerant grains, but their nutritional bioavailability is inhibited by high phytate and condensed tannin concentrations. This thesis optimized controlled steeping (24h at 22°C), germination (72h at 25°C), and kilning (50°C) cycles to maximize endogenous alpha- and beta-amylase and phytase activities. Germination yielded an 82% reduction in phytate complexes and increased in vitro protein digestibility (IVPD) from 58.2% to 89.6%. Kinetic analysis of bioactive peptides released during enzymatic mashing showed potent ACE-inhibitory activity (IC50 = 0.42 mg/mL) and DPPH radical quenching. Infant viscosity testing verified that slurry flow met WHO pediatric weaning viscosity thresholds (<2500 cP at 40°C) while providing 16.5% bioavailable protein. This dissertation demonstrates how low-cost grain malting can replace costly imported infant formulas.",
      keywords: ["Finger Millet", "Bambara Groundnut", "Enzymatic Malting", "Phytate Reduction", "Weaning Viscosity", "Bioactive Peptides"],
      file: {
        fileName: "Chebet_L_2026_FingerMillet_Bambara_Malting_Thesis.pdf",
        fileSize: "4.1 MB",
        pages: 78,
        downloadsCount: 275
      },
      viewsCount: 810,
      comments: [
        {
          id: "c5-1",
          author: "Dr. Faith Ndunge",
          role: "Faculty, JKUAT",
          university: "JKUAT Kenya",
          date: "Aug 04, 2026",
          content: "Very practical research for community nutrition programs. The phytate-to-iron molar ratios you reported (below 1.0) prove true clinical nutritional impact for anemic pediatric cohorts."
        }
      ]
    },
    {
      id: "thesis-6",
      title: "Nano-Encapsulation of Ginger Oleoresin in Modified Cassava Starch Matrices for Postharvest Yam Tuber Preservation",
      tagline: "Reducing fungal dry-rot in stored white yams using green nanotechnology and native cassava biopolymers.",
      author: "Oluwaseun Adeleke",
      authorAdmissionNo: "UI/TEC/2021/419",
      authorDegree: "M.Sc. Food Process Engineering",
      authorVerified: true,
      universityId: "ibadan",
      universityName: "University of Ibadan",
      supervisors: "Prof. Folake Henshaw & Dr. Babatunde Otegbayo",
      department: "Department of Food Technology",
      category: "packaging",
      categoryLabel: "Postharvest Tech & Storage",
      dateSubmitted: "October 2026",
      year: "2026",
      abstract: "Postharvest losses in stored white guinea yam (Dioscorea rotundata) exceed 30% throughout West Africa primarily due to wound rot induced by Penicillium oxalicum and Botryodiplodia theobromae. Traditional chemical fungicides leave hazardous residues on edible tubers. In this work, natural ginger (Zingiber officinale) oleoresin was nano-encapsulated into octenyl succinic anhydride (OSA) modified cassava starch matrices via high-pressure homogenization (80 MPa). Dynamic light scattering (DLS) confirmed uniform nanocapsule droplet diameters of 124 ± 8 nm with a polydispersity index of 0.14. In vitro antifungal disk assay demonstrated minimum inhibitory concentrations (MIC) of 15 µg/mL against yam rots. Spray coating 120 freshly harvested yam tubers with a 1.2% nano-emulsion film reduced postharvest storage rotting by 76% across a 120-day storage trial under tropical ambient conditions (28–34°C, 75% RH). Respiration rates and sprouting incidence were also significantly retarded without altering boiling and pounding rheological characteristics. The research offers a clean, green bio-fungicidal solution for industrial yam storage.",
      keywords: ["Yam Preservation", "Ginger Oleoresin", "Nano-Encapsulation", "OSA Cassava Starch", "Postharvest Loss", "Bio-Fungicide"],
      file: {
        fileName: "Adeleke_O_2026_Ginger_Nanoencapsulation_Yam_Thesis.pdf",
        fileSize: "5.9 MB",
        pages: 114,
        downloadsCount: 360
      },
      viewsCount: 890,
      comments: [
        {
          id: "c6-1",
          author: "Kwame Asante",
          role: "Starch Researcher",
          university: "KNUST Ghana",
          date: "Nov 04, 2026",
          content: "OSA modified cassava starch is an excellent wall material choice. Did you measure the zeta potential stability of the nanocapsules across a 6-month storage period?"
        },
        {
          id: "c6-2",
          author: "Oluwaseun Adeleke",
          role: "Author",
          university: "University of Ibadan",
          date: "Nov 05, 2026",
          content: "Thank you Kwame! Yes, the zeta potential stayed at -38.2 mV over 180 days, indicating robust steric and electrostatic repulsion without creaming or phase separation."
        }
      ]
    }
  ],

  projects: [
    {
      id: "proj-1",
      title: "SpiroCracker™: Spirulina & OFSP High-Micronutrient Wafer",
      tagline: "Combating Vitamin A deficiency and stunting in school-age children with microalgae-fortified crisps.",
      universityId: "jkuat",
      universityName: "JKUAT",
      leadAdmissionNo: "AG211-0452/2022",
      category: "biofortified",
      categoryLabel: "Biofortification & Clinical Nutrition",
      authors: [
        { 
          name: "Faith Wanjiru", 
          admissionNo: "AG211-0452/2022", 
          role: "Team Lead / Food Technologist", 
          year: "Finalist, B.Sc. Food Science", 
          email: "f.wanjiru@students.jkuat.ac.ke",
          contribution: "Formulated vacuum baking parameters, optimized starch retrogradation and terpene micro-encapsulation."
        },
        { 
          name: "Kelvin Mutua", 
          admissionNo: "AG214-0199/2023", 
          role: "Nutritional Biochemist", 
          year: "3rd Year, B.Sc. Human Nutrition", 
          email: "k.mutua@students.jkuat.ac.ke",
          contribution: "Conducted in vitro beta-carotene gastrointestinal bioavailability assays and mineral spectrophotometry."
        },
        { 
          name: "Brenda Muthoni", 
          admissionNo: "AG211-0812/2022", 
          role: "Sensory & Shelf-Life Analyst", 
          year: "Finalist, B.Sc. Food Science", 
          email: "b.muthoni@students.jkuat.ac.ke",
          contribution: "Supervised 120-panelist 9-point hedonic testing and acoustic crispness texture-analyzer trials."
        }
      ],
      dissertationFile: {
        name: "SpiroCracker_Thesis_Dissertation_Final.pdf",
        size: "3.4 MB",
        pages: 74,
        dateSubmitted: "October 2026",
        certifiedByDean: true
      },
      featured: true,
      award: "National Innovation Cup 2026 - 1st Place",
      upvotes: 412,
      peerReviews: 38,
      sustainabilityScore: 4.9,
      sensoryScore: 9.2,
      status: "Pitched & Certified for Public Pilot Trial",
      summary: "SpiroCracker blends carotenoid-rich Orange Fleshed Sweet Potato (OFSP) flour with 8% dried Spirulina platensis microalgae. Utilizing low-temperature vacuum baking, the wafer retains 91% beta-carotene bioavailability while masking earthy algae aromas through cold-pressed orange zest terpene encapsulation.",
      ingredients: [
        "Biofortified Orange Fleshed Sweet Potato Flour (65%)",
        "Culinary grade Spirulina platensis powder (8%)",
        "Cassava Resistant Starch",
        "Cold-pressed Sunflower Seed Oil",
        "Citrus sinensis natural peel oil (encapsulated aroma)",
        "Pink Himalayan rock salt"
      ],
      nutritionPer100g: {
        calories: "385 kcal",
        protein: "18.4 g (36% DV)",
        vitaminA: "850 mcg RAE (94% DV)",
        iron: "9.2 mg (51% DV)",
        zinc: "4.8 mg (43% DV)",
        dietaryFiber: "7.1 g"
      },
      sensoryProfile: {
        taste: 9.1,
        aroma: 8.8,
        textureCrunch: 9.6,
        colorAppeal: 8.9,
        overallAcceptability: 9.2
      },
      processFlow: [
        "Raw Material Preparation: Solar-drying OFSP slices at 55°C to preserve carotenoids.",
        "Precision Milling: Jet milling of spirulina and OFSP to <75 micron particle size.",
        "Emulsion Blending: High-shear micro-encapsulation of orange oil into cassava matrix.",
        "Thin Sheeting & Stamping: Formed into 1.2mm acoustic-tested crisp geometry.",
        "Vacuum Baking: Moisture reduction below 3.5% at 110°C under 0.6 bar vacuum."
      ],
      image: "assets/spirocracker.svg",
      badges: ["🏆 1st Place JKUAT", "✨ High Bioavailability", "🌱 Clean Label"],
      institutionalVerification: {
        status: "Institutionally Verified & Authenticated",
        recipientEmail: "registrar.academic@jkuat.ac.ke",
        admissionNo: "AG211-0452/2022",
        referenceCode: "AFOST-VER-JKUAT-9281",
        confirmedBy: "Office of the Academic Registrar - JKUAT",
        dispatchedAt: "Oct 24, 2026, 09:40 AM",
        confirmedAt: "Oct 25, 2026, 02:15 PM"
      },
      commercial: {
      "singleUnit": "Pack of 150g Spirulina & OFSP Wafers",
      "singlePriceUSD": 2,
      "singlePriceFormatted": "KES 260 ($2.00)",
      "wholesaleUnit": "Carton of 24 Packs (3.6kg Bulk Box)",
      "wholesalePriceUSD": 40,
      "wholesalePriceFormatted": "KES 5,200 ($40.00)",
      "wholesaleMinQuantity": 1,
      "originCountry": "Kenya",
      "originCity": "Juja / Nairobi",
      "leadInnovatorPayoutPct": 85,
      "organizationRevenuePct": 15,
      "inStock": true,
      "leadTimeDays": "1 - 2 Days Domestic / 4 - 6 Days Regional Freight",
      "stockists": [
              {
                      "name": "JKUAT Food Processing Pilot Plant Outlet",
                      "city": "Juja",
                      "country": "Kenya",
                      "address": "Gate B, Department of Food Science & Technology, JKUAT Main Campus",
                      "phone": "+254 67 5870001",
                      "hours": "Mon-Sat 8:00 AM - 5:00 PM",
                      "status": "In Stock (Fresh Daily Batch)"
              },
              {
                      "name": "HealthyU Organics Hub",
                      "city": "Nairobi",
                      "country": "Kenya",
                      "address": "Sarit Centre, Lower Ground Level, Westlands, Nairobi",
                      "phone": "+254 711 002300",
                      "hours": "Daily 9:00 AM - 8:00 PM",
                      "status": "In Stock"
              },
              {
                      "name": "Chandani Supermarket Agro-Corner",
                      "city": "Nairobi",
                      "country": "Kenya",
                      "address": "Diamond Plaza II, 4th Parklands Ave, Nairobi",
                      "phone": "+254 722 450123",
                      "hours": "Daily 8:30 AM - 9:00 PM",
                      "status": "Limited Stock"
              }
      ]
}
    },
    {
      id: "proj-2",
      title: "MobiYog: Synbiotic Baobab & Camel Milk Probiotic Ferment",
      tagline: "Heat-stable synbiotic drink engineered for arid pastoralist communities.",
      universityId: "uon",
      universityName: "University of Nairobi",
      leadAdmissionNo: "A22/45102/2021",
      category: "fermentation",
      categoryLabel: "Fermentation & Probiotics",
      authors: [
        { 
          name: "Amina Hassan", 
          admissionNo: "A22/45102/2021", 
          role: "Microbiology Lead", 
          year: "M.Sc. Food Microbiology", 
          email: "a.hassan@students.uonbi.ac.ke",
          contribution: "Isolated and characterized heat-tolerant L. plantarum AS-4 from traditional suusac."
        },
        { 
          name: "Dennis Ochieng", 
          admissionNo: "A24/38910/2022", 
          role: "Process Chemist", 
          year: "Finalist, B.Sc. Food Tech", 
          email: "d.ochieng@students.uonbi.ac.ke",
          contribution: "Designed gentle thermization protocol at 68°C to retain camel milk immunoglobulins."
        }
      ],
      dissertationFile: {
        name: "MobiYog_CamelDairy_Synbiotic_Report.pdf",
        size: "4.1 MB",
        pages: 82,
        dateSubmitted: "September 2026",
        certifiedByDean: true
      },
      featured: true,
      award: "Best Gut Health Innovation 2026",
      upvotes: 384,
      peerReviews: 29,
      sustainabilityScore: 4.8,
      sensoryScore: 9.0,
      status: "Pitched & Certified for Public Pilot Trial",
      summary: "Pasteurized camel milk co-fermented with indigenous lactic acid bacteria (Lactobacillus plantarum AS-4) alongside wild baobab fruit pulp (Adansonia digitata). Baobab pectin and polyphenols act as protective prebiotics, boosting probiotic viability during ambient 30-day shelf storage without artificial refrigeration.",
      ingredients: [
        "Grass-fed Camel Whole Milk (82%)",
        "Cold-extracted Organic Baobab Fruit Pulp (12%)",
        "Selected L. plantarum & Bifidobacterium infantis culture",
        "Raw Acacia Wildflower Honey (6%)"
      ],
      nutritionPer100g: {
        calories: "78 kcal",
        protein: "4.1 g",
        vitaminC: "42 mg (70% DV)",
        calcium: "148 mg",
        probiotics: "2.4 x 10^9 CFU/ml",
        potassium: "310 mg"
      },
      sensoryProfile: {
        taste: 9.3,
        aroma: 9.0,
        textureCrunch: 8.7,
        colorAppeal: 9.0,
        overallAcceptability: 9.0
      },
      processFlow: [
        "Camel Milk Thermization: Gentle thermal treatment at 68°C for 20 mins to retain immunoglobulins.",
        "Baobab Slurry Clarification: Enzymatic depectinization and sterile cold micro-filtration.",
        "Starter Inoculation: Dosing with heat-adapted autochthonous lactic cultures.",
        "Controlled Fermentation: 37°C incubation to target pH 4.4.",
        "Aseptic Glass Bottling with nitrogen headspace flushing."
      ],
      image: "assets/mobiyog.svg",
      badges: ["🐪 Camel Dairy Tech", "⚡ Zero Cold-Chain Required", "🥇 UoN Top Pick"],
      institutionalVerification: {
        status: "Institutionally Verified & Authenticated",
        recipientEmail: "registrar.acad@uonbi.ac.ke",
        admissionNo: "A22/45102/2021",
        referenceCode: "AFOST-VER-UON-4820",
        confirmedBy: "Academic Registrar's Directorate - UoN",
        dispatchedAt: "Oct 28, 2026, 11:15 AM",
        confirmedAt: "Oct 29, 2026, 10:30 AM"
      },
      commercial: {
      "singleUnit": "500ml Chilled Bottle",
      "singlePriceUSD": 2.5,
      "singlePriceFormatted": "KES 325 ($2.50)",
      "wholesaleUnit": "Crate of 12 Chilled Bottles (6 Litres)",
      "wholesalePriceUSD": 26,
      "wholesalePriceFormatted": "KES 3,380 ($26.00)",
      "wholesaleMinQuantity": 1,
      "originCountry": "Kenya",
      "originCity": "Nairobi",
      "leadInnovatorPayoutPct": 85,
      "organizationRevenuePct": 15,
      "inStock": true,
      "leadTimeDays": "Same-Day Cold Chain / 3 - 5 Days Chilled Freight",
      "stockists": [
              {
                      "name": "UoN Upper Kabete Field Station Dairy Kiosk",
                      "city": "Nairobi",
                      "country": "Kenya",
                      "address": "Faculty of Agriculture & Food Technology, Upper Kabete Campus",
                      "phone": "+254 20 4916000",
                      "hours": "Mon-Fri 7:30 AM - 4:30 PM",
                      "status": "In Stock (Cold Storage)"
              },
              {
                      "name": "Green Spoon Organic Grocer",
                      "city": "Nairobi",
                      "country": "Kenya",
                      "address": "Karen Hub Mall, Nairobi",
                      "phone": "+254 743 998811",
                      "hours": "Daily 8:00 AM - 7:00 PM",
                      "status": "In Stock"
              },
              {
                      "name": "HealthyU Junction Mall",
                      "city": "Nairobi",
                      "country": "Kenya",
                      "address": "Junction Mall, Ngong Road, Nairobi",
                      "phone": "+254 722 890123",
                      "hours": "Daily 9:00 AM - 8:30 PM",
                      "status": "In Stock"
              }
      ]
}
    },
    {
      id: "proj-3",
      title: "BioChitoWrap: Antimicrobial Chitosan-Mango Waste Food Film",
      tagline: "Active biodegradable packaging synthesized from crustacean chitin and discarded mango peel extract.",
      universityId: "makerere",
      universityName: "Makerere University",
      leadAdmissionNo: "20/U/5120/EVE",
      category: "packaging",
      categoryLabel: "Eco-Packaging & Waste Upcycling",
      authors: [
        { 
          name: "Grace Nabirye", 
          admissionNo: "20/U/5120/EVE", 
          role: "Biopolymer Specialist", 
          year: "B.Sc. Food Science & Tech", 
          email: "g.nabirye@mak.ac.ug",
          contribution: "Formulated sol-gel matrix of chitosan with mango peel phenolic crosslinking."
        },
        { 
          name: "Ronald Katende", 
          admissionNo: "21/U/4011/PS", 
          role: "Material Testing Analyst", 
          year: "3rd Year Agricultural Engineering", 
          email: "r.katende@mak.ac.ug",
          contribution: "Executed tensile strength, water vapor transmission rate (WVTR), and soil composting assays."
        }
      ],
      dissertationFile: {
        name: "BioChitoWrap_Biopolymer_Thesis.pdf",
        size: "5.2 MB",
        pages: 96,
        dateSubmitted: "August 2026",
        certifiedByDean: true
      },
      featured: true,
      award: "Global Green Challenge Silver Medal",
      upvotes: 356,
      peerReviews: 34,
      sustainabilityScore: 5.0,
      sensoryScore: 8.9,
      status: "Pitched & Certified for Public Pilot Trial",
      summary: "BioChitoWrap replaces single-use polyethylene cling wrap with a fully compostable biopolymer film. Infused with polyphenolic extract from agro-industrial Tommy Atkins mango peels, the active film inhibits fungal growth and lipid oxidation, tripling the shelf-life of refrigerated strawberries and fresh beef cuts.",
      ingredients: [
        "Crab/Shrimp Shell Chitosan (Deacetylation degree >88%)",
        "Upcycled Mango Peel Phenolic Extract (0.8% w/v)",
        "Glycerol (Plant-derived plasticizer, 20% w/w)",
        "Glacial Acetic Acid (0.5% Food grade dissolution solvent)",
        "Distilled Water"
      ],
      nutritionPer100g: {
        calories: "N/A (Packaging Material)",
        tensileStrength: "32.4 MPa",
        elongationAtBreak: "48.2%",
        waterVaporPermeability: "1.42 x 10^-10 g/m.s.Pa",
        antimicrobialZone: "18.5 mm vs E. coli & Listeria",
        biodegradabilityTime: "28 days in compost"
      },
      sensoryProfile: {
        taste: 8.5,
        aroma: 9.0,
        textureCrunch: 9.2,
        colorAppeal: 8.9,
        overallAcceptability: 8.9
      },
      processFlow: [
        "Waste Chitin Extraction: Alkaline deproteinization & acid demineralization of shells.",
        "Mango Peel Extraction: Ultrasound-assisted extraction of gallic and ellagic acids.",
        "Sol-Gel Matrix Formulation: Crosslinking chitosan with mango polyphenols via citric acid.",
        "Casting & Vacuum Degassing: Pouring onto Teflon plates to uniform 50µm thickness.",
        "Conditioning: Curing in RH-controlled chamber at 25°C."
      ],
      image: "assets/biochitowrap.svg",
      badges: ["♻️ 100% Compostable", "🛡️ Extends Shelf-Life 3x", "🇺🇬 Makerere Lead"],
      institutionalVerification: {
        status: "Institutionally Verified & Authenticated",
        recipientEmail: "academic.registrar@mak.ac.ug",
        admissionNo: "20/U/5120/EVE",
        referenceCode: "AFOST-VER-MAK-7731",
        confirmedBy: "Office of the Academic Registrar - Makerere CAES",
        dispatchedAt: "Nov 02, 2026, 03:22 PM",
        confirmedAt: "Nov 03, 2026, 09:12 AM"
      },
      commercial: {
      "singleUnit": "Roll of 30m Biodegradable Food Film",
      "singlePriceUSD": 4.5,
      "singlePriceFormatted": "UGX 17,000 ($4.50)",
      "wholesaleUnit": "Master Box of 20 Commercial Rolls",
      "wholesalePriceUSD": 75,
      "wholesalePriceFormatted": "UGX 280,000 ($75.00)",
      "wholesaleMinQuantity": 1,
      "originCountry": "Uganda",
      "originCity": "Kampala",
      "leadInnovatorPayoutPct": 85,
      "organizationRevenuePct": 15,
      "inStock": true,
      "leadTimeDays": "1 - 2 Days Domestic / 3 - 6 Days Regional Freight",
      "stockists": [
              {
                      "name": "Makerere Food Technology Incubation Centre (FTBIC)",
                      "city": "Kampala",
                      "country": "Uganda",
                      "address": "School of Food Technology, Nutrition & Bio-engineering, Makerere Main Campus",
                      "phone": "+256 414 533865",
                      "hours": "Mon-Fri 8:30 AM - 5:00 PM",
                      "status": "In Stock"
              },
              {
                      "name": "Capital Shoppers Supermarket Eco-Aisle",
                      "city": "Kampala",
                      "country": "Uganda",
                      "address": "Plot 1-3 Duster Street, Nakawa, Kampala",
                      "phone": "+256 312 263100",
                      "hours": "Mon-Sun 8:00 AM - 9:30 PM",
                      "status": "In Stock"
              },
              {
                      "name": "Quality Supermarket Naalya",
                      "city": "Kampala",
                      "country": "Uganda",
                      "address": "Naalya Roundabout, Northern Bypass, Kampala",
                      "phone": "+256 393 280011",
                      "hours": "Daily 8:00 AM - 10:00 PM",
                      "status": "In Stock"
              }
      ]
}
    },
    {
      id: "proj-4",
      title: "ProGrub: Defatted Hermetia & Jackfruit Textured Meat Analog",
      tagline: "High-protein, low-water-footprint cold-cut sausage analog engineered from black soldier fly larvae and jackfruit fiber.",
      universityId: "knust",
      universityName: "KNUST",
      leadAdmissionNo: "KNUST/FT/2021/088",
      category: "alt-protein",
      categoryLabel: "Alternative Proteins & Future Foods",
      authors: [
        { 
          name: "Kofi Boateng", 
          admissionNo: "KNUST/FT/2021/088", 
          role: "Protein Texturization Lead", 
          year: "Finalist, B.Sc. Food Tech", 
          email: "kofi.boateng@st.knust.edu.gh",
          contribution: "Designed supercritical CO2 defatting and twin-screw high moisture extrusion barrel profile."
        },
        { 
          name: "Akua Mansa", 
          admissionNo: "KNUST/HN/2022/104", 
          role: "Sensory & Consumer Science", 
          year: "3rd Year Nutrition", 
          email: "akua.mansa@st.knust.edu.gh",
          contribution: "Formulated spice blend and conducted blind consumer preference tests against conventional beef sausages."
        }
      ],
      dissertationFile: {
        name: "ProGrub_Extrusion_Report_KNUST.pdf",
        size: "2.9 MB",
        pages: 68,
        dateSubmitted: "November 2026",
        certifiedByDean: true
      },
      featured: false,
      award: "Future Food Prize Nominee 2026",
      upvotes: 310,
      peerReviews: 24,
      sustainabilityScore: 4.9,
      sensoryScore: 8.8,
      status: "Pitched & Certified for Public Pilot Trial",
      summary: "Addressing rising meat production costs and deforestation, ProGrub blends defatted Hermetia illucens larval protein flour (62% crude protein) with high-fiber shredded young jackfruit. Twin-screw high-moisture extrusion generates authentic striated muscular fibrous texture with complete essential amino acid profile.",
      ingredients: [
        "Defatted Insect Protein Isolate (Hermetia illucens, 35%)",
        "Immature Jackfruit Striated Fiber (30%)",
        "Soybean Phosphatidylcholine (Emulsifier)",
        "Fermented Beetroot Powder (Natural heme coloration)",
        "Smoke-infused cold pressed coconut oil",
        "Smoked Paprika, Coriander & Garlic spice blend"
      ],
      nutritionPer100g: {
        calories: "172 kcal",
        protein: "22.6 g (45% DV)",
        totalFat: "4.8 g (Only 1.2g Saturated)",
        iron: "6.4 mg (35% DV)",
        vitaminB12: "2.1 mcg (88% DV)",
        dietaryFiber: "5.8 g"
      },
      sensoryProfile: {
        taste: 8.8,
        aroma: 8.7,
        textureCrunch: 9.1,
        colorAppeal: 8.6,
        overallAcceptability: 8.8
      },
      processFlow: [
        "Larval Protein Fractionation: Supercritical CO2 defatting to remove lipid off-flavors.",
        "Jackfruit Shredding & Alkaline Cooking: Softening fibers into longitudinal strands.",
        "High Moisture Extrusion (HMEC): Heating barrel to 145°C with targeted shear to align protein filaments.",
        "Flavor Infusion: Vacuum tumbling in savory marinade with natural fermented beetroot pigment.",
        "Caseless Link Forming & Gentle Beechwood Smoking."
      ],
      image: "assets/progrub.svg",
      badges: ["🥩 22g Clean Protein", "🌍 92% Less Carbon", "🇬🇭 KNUST Innovator"],
      commercial: {
      "singleUnit": "1kg Defatted Protein Flour Pouch",
      "singlePriceUSD": 5,
      "singlePriceFormatted": "GHS 65 ($5.00)",
      "wholesaleUnit": "Bale of 10 Flour Pouches (10kg Wholesale Sack)",
      "wholesalePriceUSD": 42,
      "wholesalePriceFormatted": "GHS 550 ($42.00)",
      "wholesaleMinQuantity": 1,
      "originCountry": "Ghana",
      "originCity": "Kumasi",
      "leadInnovatorPayoutPct": 85,
      "organizationRevenuePct": 15,
      "inStock": true,
      "leadTimeDays": "2 Days Domestic / 5 - 8 Days Air Cargo",
      "stockists": [
              {
                      "name": "KNUST Agribusiness & Food Processing Centre",
                      "city": "Kumasi",
                      "country": "Ghana",
                      "address": "Department of Food Science and Technology, KNUST Campus",
                      "phone": "+233 322 060012",
                      "hours": "Mon-Fri 8:00 AM - 4:30 PM",
                      "status": "In Stock"
              },
              {
                      "name": "MaxMart Family Mart Kumasi",
                      "city": "Kumasi",
                      "country": "Ghana",
                      "address": "Ahodwo Roundabout, Kumasi",
                      "phone": "+233 244 550011",
                      "hours": "Daily 8:30 AM - 8:00 PM",
                      "status": "In Stock"
              },
              {
                      "name": "Koala Supermarket Osu",
                      "city": "Accra",
                      "country": "Ghana",
                      "address": "Danquah Circle, Osu, Accra",
                      "phone": "+233 302 774888",
                      "hours": "Daily 8:00 AM - 9:00 PM",
                      "status": "In Stock"
              }
      ]
}
    },
    {
      id: "proj-5",
      title: "EnziBrew: Low-GI Sorghum & Finger Millet Functional Tonic",
      tagline: "Naturally malted, enzyme-hydrolyzed non-alcoholic functional beverage rich in resistant starches.",
      universityId: "egerton",
      universityName: "Egerton University",
      leadAdmissionNo: "ED11/04918/2021",
      category: "functional",
      categoryLabel: "Functional Foods & Beverages",
      authors: [
        { 
          name: "Collins Kipkorir", 
          admissionNo: "ED11/04918/2021", 
          role: "Cereal Chemist", 
          year: "Finalist, B.Sc. Dairy & Food Tech", 
          email: "c.kipkorir@students.egerton.ac.ke",
          contribution: "Controlled kilning and single-infusion mashing to optimize endogenous phytase activity."
        },
        { 
          name: "Diana Cherono", 
          admissionNo: "ED12/03120/2022", 
          role: "Quality Assurance Analyst", 
          year: "4th Year, B.Sc. Food Engineering", 
          email: "d.cherono@students.egerton.ac.ke",
          contribution: "Evaluated in vitro starch digestion rates and determined Glycemic Index (GI 42)."
        }
      ],
      dissertationFile: {
        name: "EnziBrew_Functional_Beverage_Thesis.pdf",
        size: "3.8 MB",
        pages: 70,
        dateSubmitted: "September 2026",
        certifiedByDean: true
      },
      featured: false,
      award: "Egerton Agri-Enterprise Cup 2025",
      upvotes: 295,
      peerReviews: 19,
      sustainabilityScore: 4.7,
      sensoryScore: 9.1,
      status: "Pitched & Lab Validated",
      summary: "EnziBrew uses controlled malting of red sorghum and finger millet to activate endogenous amylases and phytases. Phytase activity breaks down anti-nutrients by 76%, releasing bioavailable minerals while enzymatic steeping preserves prebiotic arabinoxylans, yielding a refreshing beverage with a clinically low Glycemic Index (GI 42).",
      ingredients: [
        "Malted Red Sorghum Grains (60%)",
        "Germinated Finger Millet (Eleusine coracana, 30%)",
        "Hibiscus sabdariffa (Roselle) calyx extract (Flavor & Anthocyanins)",
        "Ginger rhizome cold press juice",
        "Sparkling Mountain Spring Water"
      ],
      nutritionPer100g: {
        calories: "45 kcal / 250ml",
        carbohydrates: "9.8 g (Low GI: 42)",
        anthocyanins: "35 mg",
        calcium: "85 mg",
        magnesium: "44 mg",
        sugars: "3.2 g (Natural maltose, zero added cane sugar)"
      },
      sensoryProfile: {
        taste: 9.2,
        aroma: 9.1,
        textureCrunch: 8.9,
        colorAppeal: 9.3,
        overallAcceptability: 9.1
      },
      processFlow: [
        "Steeping & Germination: 48h malting at 22°C to maximize endogenous alpha/beta amylases.",
        "Kilning: Hot-air drying at 50°C to preserve thermosensitive enzymes.",
        "Mashing & Enzymatic Hydrolysis: Single-infusion mashing at 65°C for optimal oligosaccharide conversion.",
        "Botanical Infusion: Steeped with roselle and fresh ginger at 80°C for 15 mins.",
        "Sterile Membrane Filtration & Light Carbonation (2.2 volumes CO2)."
      ],
      image: "assets/enzibrew.svg",
      badges: ["🌾 Low Glycemic Index", "🍹 100% Indigenous Cereals", "🇰🇪 Egerton Pride"],
      commercial: {
      "singleUnit": "500ml Amber Bottle",
      "singlePriceUSD": 1.8,
      "singlePriceFormatted": "KES 235 ($1.80)",
      "wholesaleUnit": "Case of 24 Bottles (12 Litres)",
      "wholesalePriceUSD": 38,
      "wholesalePriceFormatted": "KES 4,950 ($38.00)",
      "wholesaleMinQuantity": 1,
      "originCountry": "Kenya",
      "originCity": "Njoro / Nakuru",
      "leadInnovatorPayoutPct": 85,
      "organizationRevenuePct": 15,
      "inStock": true,
      "leadTimeDays": "1 - 2 Days Rift Valley / 2 - 3 Days Nationwide",
      "stockists": [
              {
                      "name": "Egerton Guildford Dairy & Beverage Pilot Plant",
                      "city": "Njoro",
                      "country": "Kenya",
                      "address": "Egerton Main Campus, Njoro-Mau Narok Road",
                      "phone": "+254 51 2217781",
                      "hours": "Mon-Fri 8:00 AM - 5:00 PM",
                      "status": "In Stock"
              },
              {
                      "name": "Nakuru Farmers Market Agro-Hub",
                      "city": "Nakuru",
                      "country": "Kenya",
                      "address": "Kenyatta Avenue, Nakuru CBD",
                      "phone": "+254 721 992233",
                      "hours": "Daily 7:00 AM - 6:30 PM",
                      "status": "In Stock"
              },
              {
                      "name": "Woolmart Supermarket Nakuru",
                      "city": "Nakuru",
                      "country": "Kenya",
                      "address": "Club Road, Nakuru CBD",
                      "phone": "+254 51 2214455",
                      "hours": "Daily 8:00 AM - 8:30 PM",
                      "status": "In Stock"
              }
      ]
}
    },
    {
      id: "proj-6",
      title: "MoringaVita: Nano-Encapsulated Iron Fortification Seasoning",
      tagline: "Thermostable, odor-masked bouillon cube addressing maternal anemia through daily cooking.",
      universityId: "ibadan",
      universityName: "University of Ibadan",
      leadAdmissionNo: "UI/FST/2020/012",
      category: "biofortified",
      categoryLabel: "Biofortification & Clinical Nutrition",
      authors: [
        { 
          name: "Boluwatife Adeleke", 
          admissionNo: "UI/FST/2020/012", 
          role: "Nano-formulation Lead", 
          year: "Ph.D. Candidate Food Tech", 
          email: "b.adeleke@ui.edu.ng",
          contribution: "Developed microfluidic liposome encapsulation using moringa leaf polar lipids."
        },
        { 
          name: "Fatima Aliyu", 
          admissionNo: "UI/HN/2021/045", 
          role: "Dietetic Researcher", 
          year: "M.Sc. Human Nutrition", 
          email: "f.aliyu@ui.edu.ng",
          contribution: "Tested in vitro gastrointestinal release and masked metallic sensory thresholds."
        }
      ],
      dissertationFile: {
        name: "MoringaVita_IronFortification_Doctoral.pdf",
        size: "6.5 MB",
        pages: 112,
        dateSubmitted: "October 2026",
        certifiedByDean: true
      },
      featured: false,
      award: "WFP Youth Food Systems Finalist",
      upvotes: 278,
      peerReviews: 22,
      sustainabilityScore: 4.8,
      sensoryScore: 8.7,
      status: "Pitched & Lab Validated",
      summary: "Traditional iron fortification in hot stew preparations causes severe lipid oxidation and metallic aftertastes. MoringaVita encapsulates ferrous bisglycinate inside a lipid-pectin nano-shell synthesized from Moringa oleifera leaf lipids. The shell remains intact during 100°C boiling and releases bioavailable iron strictly in the intestinal duodenum.",
      ingredients: [
        "Nano-encapsulated Ferrous Bisglycinate chelate",
        "Moringa oleifera dehydrated leaf powder (antioxidant carrier)",
        "Fermented Locust Bean (Iru/Dawadawa) natural umami base",
        "Dehydrated Onion, Garlic & African Nutmeg (Monodora myristica)",
        "Sea Salt (Low sodium formulation)"
      ],
      nutritionPer100g: {
        calories: "14 kcal per 4g cube",
        iron: "12 mg (80% Daily Recommended Intake)",
        zinc: "3.5 mg",
        vitaminC: "15 mg (Enhances non-heme iron absorption)",
        sodium: "280 mg (40% less than conventional bouillon)"
      },
      sensoryProfile: {
        taste: 8.9,
        aroma: 9.0,
        textureCrunch: 8.6,
        colorAppeal: 8.4,
        overallAcceptability: 8.7
      },
      processFlow: [
        "Nano-Liposome Formation: Microfluidic high-pressure homogenization of ferrous chelate with moringa polar lipids.",
        "Coacervation: Electrostatic coating with high-methoxyl citrus pectin.",
        "Spray Chilling: Converting lipid droplets into stable free-flowing micro-granules.",
        "Umami Matrix Blending: Dry blending with freeze-dried fermented locust bean powder.",
        "Hydraulic Compression into 4g moisture-sealed culinary cubes."
      ],
      image: "assets/moringavita.svg",
      badges: ["🔬 Nano-Encapsulation", "🩸 Zero Metallic Taste", "🇳🇬 UI Ibadan"],
      commercial: {
      "singleUnit": "60ml Dropper Bottle (Concentrate)",
      "singlePriceUSD": 3.5,
      "singlePriceFormatted": "NGN 5,200 ($3.50)",
      "wholesaleUnit": "Pack of 12 Dropper Bottles (Wholesale Display Box)",
      "wholesalePriceUSD": 36,
      "wholesalePriceFormatted": "NGN 54,000 ($36.00)",
      "wholesaleMinQuantity": 1,
      "originCountry": "Nigeria",
      "originCity": "Ibadan",
      "leadInnovatorPayoutPct": 85,
      "organizationRevenuePct": 15,
      "inStock": true,
      "leadTimeDays": "2 Days Domestic / 5 - 7 Days Regional Air",
      "stockists": [
              {
                      "name": "UI Food Science Pilot Formulation Centre",
                      "city": "Ibadan",
                      "country": "Nigeria",
                      "address": "Faculty of Technology, University of Ibadan",
                      "phone": "+234 803 123 4567",
                      "hours": "Mon-Fri 8:30 AM - 4:00 PM",
                      "status": "In Stock"
              },
              {
                      "name": "HealthPlus Pharmacy & Wellness",
                      "city": "Ibadan",
                      "country": "Nigeria",
                      "address": "Bodija Market Road, Ibadan",
                      "phone": "+234 802 345 6789",
                      "hours": "Daily 8:00 AM - 9:00 PM",
                      "status": "In Stock"
              },
              {
                      "name": "Prince Ebeano Supermarket",
                      "city": "Lagos",
                      "country": "Nigeria",
                      "address": "Admiralty Way, Lekki Phase 1, Lagos",
                      "phone": "+234 1 291 0022",
                      "hours": "Daily 8:00 AM - 9:00 PM",
                      "status": "In Stock"
              }
      ]
}
    },
    {
      id: "proj-7",
      title: "AquaCrisp: Upcycled Tilapia Skin Marine Collagen Puffs",
      tagline: "Crispy, puffed high-collagen snack transformed from fish filleting waste streams.",
      universityId: "stellenbosch",
      universityName: "Stellenbosch University",
      leadAdmissionNo: "SU-FS-240191",
      category: "packaging",
      categoryLabel: "Eco-Packaging & Waste Upcycling",
      authors: [
        { 
          name: "Lize Brand", 
          admissionNo: "SU-FS-240191", 
          role: "Marine Biomass Chemist", 
          year: "Finalist, B.Sc. Food Science", 
          email: "l.brand@sun.ac.za",
          contribution: "Enzymatic papain tenderizing and sodium bicarbonate neutralization of fishy volatiles."
        },
        { 
          name: "Thabo Mthembu", 
          admissionNo: "SU-FS-239804", 
          role: "Extrusion & Puffing Specialist", 
          year: "Postgrad Diploma", 
          email: "t.mthembu@sun.ac.za",
          contribution: "Optimized microwave-assisted moisture puffing curves to achieve 300% volume expansion."
        }
      ],
      dissertationFile: {
        name: "AquaCrisp_CollagenPuffs_Research.pdf",
        size: "3.1 MB",
        pages: 62,
        dateSubmitted: "October 2026",
        certifiedByDean: true
      },
      featured: false,
      award: "Blue Economy Innovation Spotlight",
      upvotes: 260,
      peerReviews: 18,
      sustainabilityScore: 5.0,
      sensoryScore: 9.0,
      status: "Consumer Panel Approved",
      summary: "Aquaculture filleting leaves behind nutrient-dense skins that are traditionally discarded. AquaCrisp utilizes enzymatic descaling and controlled alkaline de-flavoring, followed by microwave-assisted puffing. The result is a hyper-crispy, 68% collagen-rich chip with zero fishy odor and a satisfying acoustic snap.",
      ingredients: [
        "Upcycled Oreochromis niloticus (Tilapia) Skin (75%)",
        "Enzymatic Papain Tenderizing Solution",
        "Tapioca Dextrin crisping glaze",
        "Vinegar & Cape Sea Salt seasoning",
        "Rosemary Extract (Natural lipid antioxidant)"
      ],
      nutritionPer100g: {
        calories: "410 kcal",
        protein: "68.2 g (Pure Marine Collagen Type I)",
        fat: "11.4 g (Rich in Omega-3 EPA/DHA: 420mg)",
        carbohydrates: "4.1 g",
        salt: "1.2 g"
      },
      sensoryProfile: {
        taste: 9.1,
        aroma: 8.9,
        textureCrunch: 9.7,
        colorAppeal: 8.8,
        overallAcceptability: 9.0
      },
      processFlow: [
        "Biomass Washing & Descaling: High-velocity wash and enzymatic treatment to strip residual scales.",
        "Alkaline Odor Removal: Short bath in sodium bicarbonate to neutralize volatile trimethylamine.",
        "Dehydration & Gelatinization: Drying to 12% moisture at 60°C to lock in collagen gelatin matrix.",
        "Microwave-Assisted Expansion: Rapid volume expansion (300% puff) without oil deep-frying.",
        "Electrostatic Seasoning: Tumble application of sea salt and malt vinegar glaze."
      ],
      image: "assets/aquacrisp.svg",
      badges: ["🐟 68% Marine Collagen", "♻️ 100% Upcycled Waste", "🇿🇦 Stellenbosch"],
      commercial: {
      "singleUnit": "100g Snack Pack",
      "singlePriceUSD": 2.2,
      "singlePriceFormatted": "ZAR 40 ($2.20)",
      "wholesaleUnit": "Carton of 20 Snack Packs (2kg Box)",
      "wholesalePriceUSD": 38,
      "wholesalePriceFormatted": "ZAR 700 ($38.00)",
      "wholesaleMinQuantity": 1,
      "originCountry": "South Africa",
      "originCity": "Stellenbosch",
      "leadInnovatorPayoutPct": 85,
      "organizationRevenuePct": 15,
      "inStock": true,
      "leadTimeDays": "1 - 2 Days Western Cape / 3 - 5 Days National",
      "stockists": [
              {
                      "name": "Stellenbosch Food Science Sensory & Sales Shop",
                      "city": "Stellenbosch",
                      "country": "South Africa",
                      "address": "Paul van der Bijl Laboratories, Hammanshand Road, Stellenbosch",
                      "phone": "+27 21 808 3578",
                      "hours": "Mon-Fri 8:30 AM - 4:30 PM",
                      "status": "In Stock"
              },
              {
                      "name": "Wellness Warehouse Waterfront",
                      "city": "Cape Town",
                      "country": "South Africa",
                      "address": "Shop 6105, Victoria Wharf, V&A Waterfront, Cape Town",
                      "phone": "+27 21 425 2400",
                      "hours": "Daily 9:00 AM - 8:00 PM",
                      "status": "In Stock"
              },
              {
                      "name": "Checkers Hyper Stellenbosch Square",
                      "city": "Stellenbosch",
                      "country": "South Africa",
                      "address": "Webbers Valley Rd, Stellenbosch",
                      "phone": "+27 21 888 2300",
                      "hours": "Daily 8:00 AM - 8:00 PM",
                      "status": "In Stock"
              }
      ]
}
    },
    {
      id: "proj-8",
      title: "PulseGel: Thermostable Bambara Groundnut Emulsion Stabilizer",
      tagline: "Plant-based hydrocolloid egg & dairy yolk replacement for clean-label bakery applications.",
      universityId: "knust",
      universityName: "KNUST",
      leadAdmissionNo: "KNUST/FT/2022/194",
      category: "functional",
      categoryLabel: "Functional Foods & Beverages",
      authors: [
        { 
          name: "Ama Serwaa", 
          admissionNo: "KNUST/FT/2022/194", 
          role: "Rheology Researcher", 
          year: "3rd Year, B.Sc. Food Tech", 
          email: "ama.serwaa@st.knust.edu.gh",
          contribution: "Ultrasonic cavitation unfolding of globulin protein fractions."
        },
        { 
          name: "David Osei", 
          admissionNo: "KNUST/ENG/2021/040", 
          role: "Pilot Plant Manager", 
          year: "4th Year Food Engineering", 
          email: "david.osei@st.knust.edu.gh",
          contribution: "Evaluated industrial emulsion stability at 90°C and 200°C bakery oven testing."
        }
      ],
      dissertationFile: {
        name: "PulseGel_BambaraHydrocolloid_Study.pdf",
        size: "3.5 MB",
        pages: 66,
        dateSubmitted: "November 2026",
        certifiedByDean: true
      },
      featured: false,
      award: "Inter-University Formulation Runner-up",
      upvotes: 242,
      peerReviews: 16,
      sustainabilityScore: 4.9,
      sensoryScore: 8.9,
      status: "Industrial Bakery Testing in Brioche & Mayo",
      summary: "Bambara groundnut (Vigna subterranea) is an underutilized, drought-tolerant legume. By isolating its globulin protein fraction and cross-linking it with ultrasonic cavity shearing, PulseGel creates an emulsification capacity exceeding commercial egg yolk, remaining stable during 200°C commercial baking.",
      ingredients: [
        "Micronized Bambara Groundnut Protein Isolate (85% purity)",
        "Cold-pressed Chia Seed Polysaccharide Gum",
        "Food-grade Calcium Citrate (cross-linker)",
        "Sunflower Lecithin"
      ],
      nutritionPer100g: {
        calories: "320 kcal",
        protein: "54.0 g",
        dietaryFiber: "18.5 g",
        emulsionStability: "98.4% at 90°C for 60 min",
        foamCapacity: "165%"
      },
      sensoryProfile: {
        taste: 8.9,
        aroma: 9.0,
        textureCrunch: 9.1,
        colorAppeal: 8.7,
        overallAcceptability: 8.9
      },
      processFlow: [
        "Isoelectric Protein Solubilization: Extracting at pH 9.0, precipitating at isoelectric point pH 4.5.",
        "Ultrasonic Cavitation: 20 kHz probe disruption to unfold globular hydrophobic pockets.",
        "Polymer Interaction: Coupling with chia mucilage at 1:4 ratio.",
        "Freeze Drying & Jet Micronization into soluble pale cream powder."
      ],
      image: "assets/pulsegel.svg",
      badges: ["🥚 1:1 Egg Replacer", "💧 Drought-Tolerant Crop", "🇬🇭 KNUST Innovation"],
      commercial: {
      "singleUnit": "500g Culinary Tub",
      "singlePriceUSD": 3,
      "singlePriceFormatted": "KES 390 ($3.00)",
      "wholesaleUnit": "Crate of 12 Tubs (6kg Catering Pail)",
      "wholesalePriceUSD": 32,
      "wholesalePriceFormatted": "KES 4,160 ($32.00)",
      "wholesaleMinQuantity": 1,
      "originCountry": "Kenya",
      "originCity": "Juja / Nairobi",
      "leadInnovatorPayoutPct": 85,
      "organizationRevenuePct": 15,
      "inStock": true,
      "leadTimeDays": "1 - 2 Days Domestic / 4 - 6 Days Freight",
      "stockists": [
              {
                      "name": "JKUAT Enterprise Ltd (JKUATES) Showroom",
                      "city": "Juja",
                      "country": "Kenya",
                      "address": "Technology House Ground Floor, JKUAT Main Campus",
                      "phone": "+254 67 5870002",
                      "hours": "Mon-Fri 8:00 AM - 5:00 PM",
                      "status": "In Stock"
              },
              {
                      "name": "Bakers World Ingredients Kenya",
                      "city": "Nairobi",
                      "country": "Kenya",
                      "address": "Lusaka Road, Industrial Area, Nairobi",
                      "phone": "+254 720 112233",
                      "hours": "Mon-Sat 8:00 AM - 5:30 PM",
                      "status": "In Stock"
              },
              {
                      "name": "Naivas Supermarket Food Ingredients Hub",
                      "city": "Nairobi",
                      "country": "Kenya",
                      "address": "Thika Road Mall (TRM), Roysambu, Nairobi",
                      "phone": "+254 724 400112",
                      "hours": "Daily 8:30 AM - 9:00 PM",
                      "status": "In Stock"
              }
      ]
}
    }
  ],

  competitions: [
    {
      id: "comp-2026",
      title: "AFOSTECH All-African Inter-University Food Innovation Challenge 2026",
      theme: "Indigenous Crops, Zero-Waste & Climate-Proof Nutrition",
      grandPrize: "$7,500 Seed Grant + Incubation at Africa Food Labs",
      deadline: "August 30, 2026",
      daysLeft: 42,
      participants: "24 University Chapters Registered",
      stages: [
        { name: "Phase 1: Abstract & Lab Formulation", status: "Completed", date: "May 2026" },
        { name: "Phase 2: Sensory Validation & Prototype Testing", status: "Active Now", date: "July - August 2026" },
        { name: "Phase 3: Grand Pitch & Live Tasting Finals", status: "Upcoming", date: "September 18, 2026" }
      ]
    }
  ],

  
  productOrders: [
    {
      id: "AFOST-ORD-2026-8841",
      date: "2026-11-19 14:22",
      projectId: "proj-1",
      productName: "SpiroCracker™: Spirulina & OFSP High-Micronutrient Wafer",
      universityName: "JKUAT",
      buyerName: "Dr. Angela Omondi",
      buyerEmail: "a.omondi@nutrinet.org",
      buyerPhone: "+254 712 345678",
      buyerCountry: "Kenya",
      buyerCity: "Nairobi",
      buyerAddress: "Kilimani, Argwings Kodhek Rd, Suite 4B",
      originCountry: "Kenya",
      isCrossBorder: false,
      tier: "wholesale",
      unitName: "Carton of 24 Packs (3.6kg Bulk Box)",
      quantity: 1,
      unitPriceUSD: 40.00,
      subtotalUSD: 40.00,
      shippingFeeUSD: 3.00,
      totalUSD: 43.00,
      studentPayoutUSD: 34.00,
      afostechRevenueUSD: 6.00,
      paymentMethod: "M-Pesa / Mobile Money",
      paymentRef: "MPESA-QK894129X",
      status: "Dispatched",
      courier: "AFOSTECH Inter-Campus Courier (Tracking: AGY-KE-8841)"
    },
    {
      id: "AFOST-ORD-2026-8854",
      date: "2026-11-20 09:45",
      projectId: "proj-3",
      productName: "BioChitoWrap™: Chitosan-Enriched Biodegradable Cassava Film",
      universityName: "Makerere University",
      buyerName: "EcoPack Distributors Ltd",
      buyerEmail: "procurement@ecopack.co.ke",
      buyerPhone: "+254 733 987654",
      buyerCountry: "Kenya",
      buyerCity: "Mombasa",
      buyerAddress: "Mombasa Port Logistics Hub, Bay 12",
      originCountry: "Uganda",
      isCrossBorder: true,
      tier: "wholesale",
      unitName: "Master Box of 20 Commercial Rolls",
      quantity: 2,
      unitPriceUSD: 75.00,
      subtotalUSD: 150.00,
      shippingFeeUSD: 24.00,
      totalUSD: 174.00,
      studentPayoutUSD: 127.50,
      afostechRevenueUSD: 22.50,
      paymentMethod: "Pan-African Bank Transfer",
      paymentRef: "SWIFT-UG-KE-77291",
      status: "Cross-Border Transit",
      courier: "East African Regional Freight Logistics (Tracking: AGY-EA-9912)"
    },
    {
      id: "AFOST-ORD-2026-8869",
      date: "2026-11-20 16:30",
      projectId: "proj-2",
      productName: "MobiYog-Pro™: Camel Milk & Baobab Synbiotic Yoghurt",
      universityName: "University of Nairobi",
      buyerName: "Brian Kiprono",
      buyerEmail: "b.kiprono@wellnesshub.ke",
      buyerPhone: "+254 701 554433",
      buyerCountry: "Kenya",
      buyerCity: "Nairobi",
      buyerAddress: "Westlands, Mpaka Road, Nairobi",
      originCountry: "Kenya",
      isCrossBorder: false,
      tier: "retail",
      unitName: "500ml Chilled Bottle",
      quantity: 4,
      unitPriceUSD: 2.50,
      subtotalUSD: 10.00,
      shippingFeeUSD: 2.50,
      totalUSD: 12.50,
      studentPayoutUSD: 8.50,
      afostechRevenueUSD: 1.50,
      paymentMethod: "M-Pesa / Mobile Money",
      paymentRef: "MPESA-QK894982M",
      status: "Delivered",
      courier: "Nairobi Cold-Chain Courier (Delivered)"
    }
  ],
  feedPosts: [
    {
      id: "post-1",
      authorName: "Faith Wanjiru",
      authorAdmissionNo: "AG211-0452/2022",
      authorDegree: "B.Sc. Food Science & Postharvest Tech",
      authorRole: "Student Innovator / Food Technologist",
      authorAvatar: "FW",
      authorColor: "#15803d",
      universityId: "jkuat",
      universityName: "JKUAT (Kenya)",
      timeAgo: "2 hours ago",
      datePosted: "Nov 22, 2026",
      topicTag: "#FoodChemistry",
      topicLabel: "Food Chemistry & Kitchen Science",
      title: "Why Cut Apples & Avocados Turn Brown — And How Lemon Juice Actually Stops It! 🥑🍎",
      content: `Have you ever wondered why slicing an apple or scooping an avocado turns it unappetizingly dark within 20 minutes? 🥑

It's NOT rot or bacterial decay! It's an enzymatic biochemical reaction called Enzymatic Browning.

When you cut plant tissue, you rupture cell vacuoles. An intracellular enzyme called Polyphenol Oxidase (PPO) is suddenly exposed to atmospheric oxygen (O₂). PPO oxidizes phenolic compounds into ortho-quinones, which quickly cross-link and polymerize into melanin—the same dark pigment found in human skin and hair!

💡 The Food Scientist's Hack:
When you squeeze fresh lemon juice over your avocado, two distinct chemical defenses occur simultaneously:
1. Low pH Deactivation: Citric acid drops surface pH below 3.0. PPO's active catalytic copper-binding sites denature and become completely inactive.
2. Ascorbic Acid Reduction: Vitamin C acts as a sacrificial electron donor, reducing ortho-quinones back to colorless diphenols before any melanin pigment can form!

What everyday kitchen chemistry puzzles do you encounter when cooking? Drop your questions below or message me! 👇`,
      mediaType: "image",
      mediaUrl: "assets/feed_avocado.svg",
      mediaCaption: "Microscopic visualization of Polyphenol Oxidase (PPO) enzymatic oxidation vs citric acid chelation in avocado tissue.",
      likesCount: 142,
      repostsCount: 29,
      isLiked: false,
      isReposted: false,
      comments: [
        {
          id: "c1-1",
          authorName: "Marcus Vance",
          authorRole: "Home Cook & Food Blogger",
          authorAvatar: "MV",
          timeAgo: "1 hour ago",
          text: "Fascinating! Does quick blanching in boiling water achieve the same thing by denaturing the enzymes?"
        },
        {
          id: "c1-2",
          authorName: "Faith Wanjiru",
          authorRole: "Innovator / Food Technologist (JKUAT)",
          authorAvatar: "FW",
          timeAgo: "45 mins ago",
          text: "Spot on Marcus! Heating above 85°C for 30–60 seconds irreversibly unravels the tertiary polypeptide chains of PPO. That's why commercial frozen apple slices and canned peaches stay permanently bright!"
        },
        {
          id: "c1-3",
          authorName: "Dr. Willis Owino",
          authorRole: "Senior Lecturer in Post-Harvest Tech",
          authorAvatar: "WO",
          timeAgo: "20 mins ago",
          text: "Great public communication Faith! You can also mention that vacuum packaging or submerging in cold water starves the reaction of atmospheric O₂."
        }
      ]
    },
    {
      id: "post-2",
      authorName: "Amina Hassan",
      authorAdmissionNo: "A22/45102/2021",
      authorDegree: "M.Sc. Food Microbiology & Dairy Science",
      authorRole: "Postgrad Innovator / Dairy Chemist",
      authorAvatar: "AH",
      authorColor: "#1d4ed8",
      universityId: "uon",
      universityName: "University of Nairobi (Kenya)",
      timeAgo: "5 hours ago",
      datePosted: "Nov 22, 2026",
      topicTag: "#FoodProcessingTech",
      topicLabel: "Pilot Plant Unit Operations",
      title: "Live Pilot Plant Demo: High-Shear Microfluidization for 0% Oil Mayonnaise! 🥛⚡",
      content: `Commercial mayonnaise is typically 65% to 80% vegetable oil by weight—the oil droplets pack tightly together to produce that rich, scoopable spread texture.

How do food engineers achieve the same velvety mouthfeel with ZERO fat? 

Here in the UoN food engineering pilot plant, we feed baobab fruit pectin and camel milk whey protein through a high-pressure microfluidizer operating at 1,800 bar (over 26,000 PSI!). 

When the stream collides in the diamond Y-shaped micro-channels, intense shear and acoustic cavitation shatter macro-droplets down into uniform sub-150 nanometer spheres. These nano-droplets refract light identically to fat globules and fool our tongue's mechanoreceptors into perceiving rich creaminess!

Watch the live demo clip below showing the Y-channel collision zone! 🎥`,
      mediaType: "video",
      mediaUrl: "assets/feed_microfluidizer.svg",
      mediaCaption: "Pilot plant high-pressure interaction chamber operating at 1,800 bar. Sub-150nm nano-emulsion collision zone.",
      videoDuration: "03:15",
      likesCount: 218,
      repostsCount: 47,
      isLiked: false,
      isReposted: false,
      comments: [
        {
          id: "c2-1",
          authorName: "Chef Roland Dubois",
          authorRole: "Executive Pastry Chef",
          authorAvatar: "RD",
          timeAgo: "3 hours ago",
          text: "Is the mouth-coating sensation really indistinguishable from egg-yolk mayonnaise? Does it break when heated?"
        },
        {
          id: "c2-2",
          authorName: "Amina Hassan",
          authorRole: "Innovator / Dairy Chemist (UoN)",
          authorAvatar: "AH",
          timeAgo: "2 hours ago",
          text: "Chef Roland: Because camel milk whey proteins contain heat-stable immunoglobulins, the nano-gel network doesn't synerese (weep) up to 78°C! Feel free to click 'Message Innovator' above if you'd like a sample batch dispatched to your kitchen!"
        }
      ]
    },
    {
      id: "post-3",
      authorName: "Grace Nabirye",
      authorAdmissionNo: "20/U/5120/EVE",
      authorDegree: "B.Sc. Food Processing Technology",
      authorRole: "Biopolymer Packaging Researcher",
      authorAvatar: "GN",
      authorColor: "#0f766e",
      universityId: "makerere",
      universityName: "Makerere University (Uganda)",
      timeAgo: "8 hours ago",
      datePosted: "Nov 22, 2026",
      topicTag: "#WasteUpcycling",
      topicLabel: "Circular Bio-Economy",
      title: "Bio-Active Mango Peel Packaging in Action: 3x Longer Strawberry Freshness! 🥭🍓",
      content: `Plastic cling wrap (polyethylene) creates an anaerobic sweatbox that traps condensation and accelerates mold proliferation within 4 days.

Our student research team at Makerere took discarded Nile Perch fish processing waste and mango cannery peels to solve this.

By blending extracted marine chitosan with polyphenolic mango-wax, we synthesized BioChito-Wrap:
✅ 100% Edible & Marine Biodegradable (dissolves in garden compost in 18 days)
✅ Active Antimicrobial Action: Positively charged chitosan amino groups puncture bacterial cell membranes of E. coli and Listeria
✅ Selective Gas Permeability: Allows ethylene gas to escape while maintaining moisture equilibrium!

Check out the side-by-side trial photo below after 14 days in ambient 24°C storage. The cling wrap strawberries succumbed to gray mold on Day 4, while the bio-wrapped berries remain firm and mold-free!`,
      mediaType: "image",
      mediaUrl: "assets/feed_bioplastic.svg",
      mediaCaption: "Day 14 ambient shelf-life trial: Standard synthetic polyethylene vs Makerere Chitosan-Mango biopolymer film.",
      likesCount: 312,
      repostsCount: 84,
      isLiked: false,
      isReposted: false,
      comments: [
        {
          id: "c3-1",
          authorName: "Linda K.",
          authorRole: "Supermarket Produce Buyer",
          authorAvatar: "LK",
          timeAgo: "6 hours ago",
          text: "Can this film be heat-sealed on standard automated tray flow-wrappers?"
        },
        {
          id: "c3-2",
          authorName: "Grace Nabirye",
          authorRole: "Innovator / Bio-Packaging (Makerere)",
          authorAvatar: "GN",
          timeAgo: "4 hours ago",
          text: "Yes Linda! Its tensile thermal seal window is 115°C–125°C, making it a drop-in replacement for conventional polyolefin roll-stock without retrofitting packing line jaws."
        }
      ]
    },
    {
      id: "post-4",
      authorName: "Kofi Boateng",
      authorAdmissionNo: "KNUST/FT/2021/088",
      authorDegree: "B.Sc. Food Technology",
      authorRole: "Extrusion & Alternative Protein Lead",
      authorAvatar: "KB",
      authorColor: "#d97706",
      universityId: "knust",
      universityName: "KNUST (Ghana)",
      timeAgo: "12 hours ago",
      datePosted: "Nov 22, 2026",
      topicTag: "#AlternativeProtein",
      topicLabel: "Next-Gen Protein Systems",
      title: "Why Black Soldier Fly Larvae are the Ultimate Protein Generator (And No, It Doesn't Taste Like Bugs!) 🦗🥩",
      content: `Let's talk about the uncomfortable truth of animal agriculture: Beef requires 15,400 liters of fresh water per single kilogram of protein and produces significant greenhouse gas emissions.

Meet Hermetia illucens (Black Soldier Fly larvae). 

In our KNUST pilot lab:
1. They grow on spent brewer's spent grain and cocoa pod husks that breweries and plantations pay to dispose of.
2. They consume 98% less water and 93% less arable land than cattle.
3. Protein Quality: A complete amino acid profile with a PDCAAS of 0.94 (competing toe-to-toe with egg albumen and casein).

🍽️ The Food Science Magic:
People ask: 'Doesn't it taste insect-like?' 
Answer: No! In raw form, insect oils carry nutty, earthy aromas. We defat the flour via supercritical CO₂ extraction and twin-screw extrude it at 145°C with jackfruit resistant starch fibers. The heat cross-links disulfide bonds, generating the exact fibrous, tearable chew of deli sausage!

What are your thoughts on entomophagy and sustainable protein? Ask me anything!`,
      mediaType: "image",
      mediaUrl: "assets/feed_bsf_protein.svg",
      mediaCaption: "Life Cycle Assessment (LCA) comparison: Water footprint, PDCAAS essential amino score, and Feed Conversion Ratio.",
      likesCount: 189,
      repostsCount: 36,
      isLiked: false,
      isReposted: false,
      comments: [
        {
          id: "c4-1",
          authorName: "Prof. Joseph Mensah",
          authorRole: "Dean, School of Agriculture (UCC)",
          authorAvatar: "JM",
          timeAgo: "9 hours ago",
          text: "Brilliant research Kofi. What is the allergenicity profile regarding tropomyosin cross-reactivity with crustacean allergies?"
        },
        {
          id: "c4-2",
          authorName: "Kofi Boateng",
          authorRole: "Innovator (KNUST)",
          authorAvatar: "KB",
          timeAgo: "7 hours ago",
          text: "Excellent inquiry Dean Mensah. Because insects and crustaceans share the pan-allergen tropomyosin, our consumer packaging carries a clear allergen warning for individuals allergic to shrimp or crab."
        }
      ]
    },
    {
      id: "post-5",
      authorName: "Collins Kipkorir",
      authorAdmissionNo: "ED11/04918/2021",
      authorDegree: "B.Sc. Food Science & Technology",
      authorRole: "Cereal Chemist & Fermentation Lead",
      authorAvatar: "CK",
      authorColor: "#047857",
      universityId: "egerton",
      universityName: "Egerton University (Kenya)",
      timeAgo: "1 day ago",
      datePosted: "Nov 21, 2026",
      topicTag: "#KitchenScience",
      topicLabel: "Food Physics & Daily Science",
      title: "Why Stale Bread Goes Rock Hard, But Stale Potato Chips Go Soft! 🍞🥔",
      content: `Here is a fun kitchen riddle that puzzles almost everyone:
Leave a slice of fresh bread on the counter for 48 hours: It turns as hard as a brick.
Leave a bowl of crispy potato chips on the counter for 48 hours: They turn completely limp and soft!

Why the opposite behavior? 

It all comes down to Water Activity (Aw) and Starch Retrogradation!

🥖 Why Bread Goes Hard:
Fresh bread is approx 35–40% water. As bread sits, water does NOT simply evaporate away. Instead, gelatinized starch molecules (specifically amylose and amylopectin) slowly recrystallize into tightly aligned crystalline lattices. This process—called retrogradation—traps water inside the crystals, creating a rigid crumb matrix. 
Pro-Tip: Popping stale bread into a toaster or oven at 60°C melts those crystals and makes the bread soft again!

🥔 Why Chips Go Soft:
Potato chips have an extremely low water activity (Aw < 0.2, only 1.5% moisture). Ambient room humidity (Aw ~0.5–0.7) is much higher. Due to chemical vapor pressure gradients, the thirsty starch matrix absorbs water molecules from the air, transitioning past the glass transition temperature (Tg) into a rubbery, soggy state!

Food physics is at play in every meal! Any other kitchen science mysteries you want unpacked?`,
      mediaType: "text",
      mediaUrl: "",
      mediaCaption: "",
      likesCount: 274,
      repostsCount: 65,
      isLiked: false,
      isReposted: false,
      comments: [
        {
          id: "c5-1",
          authorName: "Sarah Jenkins",
          authorRole: "Culinary Student",
          authorAvatar: "SJ",
          timeAgo: "18 hours ago",
          text: "I always wondered this! Does keeping bread in the refrigerator prevent this or make it worse?"
        },
        {
          id: "c5-2",
          authorName: "Collins Kipkorir",
          authorRole: "Innovator (Egerton)",
          authorAvatar: "CK",
          timeAgo: "16 hours ago",
          text: "Great question Sarah! The refrigerator actually ACCELERATES bread staling by up to 6x! Amylose retrogradation occurs fastest at 4°C (standard fridge temperature). For long storage, always freeze bread below -18°C, which halts molecular migration entirely!"
        }
      ]
    }
  ],

  testimonials: [
    {
      name: "Prof. Mary Anyango",
      title: "Dean of Food Science, JKUAT & AFOSTECH Faculty Advisor",
      quote: "AFOSTECH has shattered the university silo. For the first time, our students aren't just filing their final-year projects in library archives—they are competing with peers in Uganda, Ghana, and South Africa, refining prototypes to commercial international standards."
    },
    {
      name: "Kelvin Mutua",
      title: "Co-creator of SpiroCracker, JKUAT",
      quote: "When we saw the University of Nairobi's camel milk ferment on the leaderboard, it pushed our team to work extra late in the sensory lab. That positive rivalry drove us to optimize our wafer crunch and win our first patent filing!"
    },
    {
      name: "Dr. Kwabena Mensah",
      title: "Senior Food Technologist, Nestle Central & West Africa",
      quote: "The quality of prototypes on AFOSTECH's showcase rivals venture-backed food tech startups. Industry recruiters now look here first when hiring fresh talent."
    }
  ]
};
