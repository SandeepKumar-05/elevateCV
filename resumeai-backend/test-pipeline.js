const resumeBuilder = require('./resume-builder');
require('dotenv').config();

const testPrompts = [
  {
    name: "Fresher Prompt",
    prompt: "I am Anjali Thomas, just completed B.Tech CS from CET Thrissur in 2024, CGPA 8.6. I built a final year project called CampusConnect using React and Django, used by 200 students. Did a 2 month internship at Experion Technologies working on React frontend. Know JavaScript, Python, React, Django, MySQL, Git. My email is anjali@gmail.com",
    pages: 1
  },
  {
    name: "Mid-level Prompt",
    prompt: "Rahul Menon, React developer, 3 years experience at UST Global Kochi since June 2021. Built customer portal used by 8000 users. Reduced API response time by 40% using Redis. Integrated Razorpay payment gateway. Before UST, worked at Soulpages startup for 1 year doing e-commerce features. B.Tech IT from APJ KTU 2021, 7.9 CGPA. Know React, Node.js, PostgreSQL, Redis, Docker, AWS S3, Git. LinkedIn: linkedin.com/in/rahulmenon GitHub: github.com/rahulmenon",
    pages: 2
  },
  {
    name: "Senior/Lead Prompt",
    prompt: "Priya Nair, Senior Software Engineer at Infosys Kochi since 2020, Tech Lead managing 5 developers. Architected microservices platform handling 2 million API calls per day using Node.js and Kubernetes on AWS. Reduced deployment time from 3 hours to 20 minutes using GitHub Actions CI/CD. Led migration of legacy Java monolith to microservices for a US banking client, cutting infrastructure cost by 40%. Previously at TCS 2017-2020 as developer. NIT Calicut CS 2017, 8.8 CGPA. AWS Solutions Architect Professional certified. TypeScript, Node.js, Java, Spring Boot, React, Kubernetes, Docker, AWS, PostgreSQL, Redis, Kafka. priya@gmail.com linkedin.com/in/priyanair",
    pages: 3
  }
];

async function runTests() {
  console.log('🚀 Starting ResumeAI Pipeline Verification...\n');

  for (const test of testPrompts) {
    console.log(`--------------------------------------------------`);
    console.log(`TEST CASE: ${test.name}`);
    console.log(`--------------------------------------------------`);

    try {
      const startTime = Date.now();
      const result = await resumeBuilder.buildResumeData({
        userPrompt: test.prompt,
        pages: test.pages,
        provider: 'auto'
      });
      const duration = (Date.now() - startTime) / 1000;

      console.log(`✅ Success in ${duration.toFixed(1)}s (Provider: ${result._provider})`);
      
      // Verification Checks
      const checks = [
        { name: "Has Summary", pass: !!result.summary },
        { name: "Has Experience", pass: result.experience.length > 0 },
        { name: "Strong Verbs", pass: result.experience.every(exp => exp.bullets.some(b => 
            /Architected|Engineered|Spearheaded|Orchestrated|Designed|Developed|Built|Deployed|Optimised|Streamlined|Automated|Implemented|Led|Delivered|Reduced|Increased|Improved|Scaled|Migrated|Refactored|Integrated|Launched|Established|Mentored|Collaborated|Negotiated/.test(b)
        ))},
        { name: "Has Metrics", pass: result.experience.every(exp => exp.bullets.some(b => /[0-9]+%|[0-9]+ms|[0-9]+\+|million|thousands/i.test(b)))},
        { name: "Skills Categorized", pass: Object.values(result.skills).some(s => s.length > 0) }
      ];

      checks.forEach(c => {
        console.log(`${c.pass ? '  ✔' : '  ✖'} ${c.name}`);
      });

      console.log(`\nGENERATED SUMMARY:\n"${result.summary}"\n`);
      
    } catch (error) {
      console.error(`❌ Test Failed:`, error.message);
    }
  }
}

runTests();
