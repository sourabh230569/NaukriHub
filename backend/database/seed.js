'use strict';

/**
 * Seed script — inserts demo data into the SQLite database.
 * Run with: node database/seed.js
 *
 * WARNING: For development / demo use only.
 *          All passwords below must be changed before real deployment.
 *
 * Demo credentials
 * ─────────────────
 * Admin  : admin@example.com   / Admin@123
 * Users  : aarav@example.com   / User@1234
 *          priya@example.com   / User@1234
 *          rohan@example.com   / User@1234
 *          sneha@example.com   / User@1234
 *          karan@example.com   / User@1234
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const bcrypt    = require('bcryptjs');
const { getDb } = require('../config/database');

async function seed() {
  const db = getDb();
  console.log('Starting seed...\n');

  // ── Users ──────────────────────────────────────────────────────────────────
  const adminPw = await bcrypt.hash('Admin@123',  12);
  const userPw  = await bcrypt.hash('User@1234',  12);

  const users = [
    { name: 'System Admin',  email: 'admin@example.com', password: adminPw, role: 'admin' },
    { name: 'Aarav Sharma',  email: 'aarav@example.com', password: userPw,  role: 'user'  },
    { name: 'Priya Mehta',   email: 'priya@example.com', password: userPw,  role: 'user'  },
    { name: 'Rohan Gupta',   email: 'rohan@example.com', password: userPw,  role: 'user'  },
    { name: 'Sneha Patel',   email: 'sneha@example.com', password: userPw,  role: 'user'  },
    { name: 'Karan Singh',   email: 'karan@example.com', password: userPw,  role: 'user'  }
  ];

  const insertUser = db.prepare(
    `INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`
  );

  for (const u of users) {
    insertUser.run(u.name, u.email, u.password, u.role);
  }
  console.log(`Inserted/skipped ${users.length} users.`);

  // Fetch admin id
  const admin = db.prepare(`SELECT id FROM users WHERE email = 'admin@example.com'`).get();

  // ── Jobs ───────────────────────────────────────────────────────────────────
  const jobs = [
    {
      title: 'Frontend Developer Intern',
      company: 'TechNova Solutions',
      location: 'Bhopal, MP',
      employment_type: 'Internship',
      description: 'We are looking for a motivated Frontend Developer Intern to join our product team. You will work closely with senior engineers to build and maintain responsive web interfaces using modern HTML, CSS, and JavaScript. This is a hands-on role with a clear learning path.',
      requirements: 'Basic knowledge of HTML5, CSS3, and JavaScript. Familiarity with responsive design principles. Understanding of version control with Git. Good communication skills and willingness to learn.',
      salary: '8,000 - 12,000/month',
      experience: '0 - 1 year',
      application_deadline: '2027-03-31',
      status: 'Open',
      created_by: admin.id
    },
    {
      title: 'Backend Developer',
      company: 'CodeCraft Systems',
      location: 'Pune, MH',
      employment_type: 'Full-time',
      description: 'CodeCraft Systems is seeking a skilled Backend Developer to design and implement scalable server-side applications. You will own REST API development, database schema design, and third-party integrations. A strong focus on clean code and performance is essential.',
      requirements: 'Proficiency in Node.js or Python. Experience with relational databases (PostgreSQL/MySQL). Understanding of RESTful API design. Knowledge of authentication mechanisms (JWT/OAuth). Familiarity with Docker is a plus.',
      salary: '6,00,000 - 9,00,000/year',
      experience: '2 - 4 years',
      application_deadline: '2027-04-15',
      status: 'Open',
      created_by: admin.id
    },
    {
      title: 'Full Stack Developer Intern',
      company: 'BrightMind Technologies',
      location: 'Remote',
      employment_type: 'Internship',
      description: 'Join BrightMind Technologies as a Full Stack Developer Intern and contribute to real products used by thousands of users. You will work on both the frontend and backend layers, participate in code reviews, and collaborate in an agile team environment.',
      requirements: 'Knowledge of JavaScript (Node.js and browser). Exposure to any frontend framework or vanilla JS. Basic SQL knowledge. Ability to work independently in a remote setup. Strong problem-solving skills.',
      salary: '10,000 - 15,000/month',
      experience: '0 - 1 year',
      application_deadline: '2027-05-01',
      status: 'Open',
      created_by: admin.id
    },
    {
      title: 'Data Analyst',
      company: 'Insightful Analytics',
      location: 'Hyderabad, TS',
      employment_type: 'Full-time',
      description: 'Insightful Analytics is hiring a Data Analyst to turn raw data into actionable business insights. You will build dashboards, write complex SQL queries, and work with business stakeholders to understand their analytical needs.',
      requirements: 'Strong SQL skills. Proficiency in Excel or Google Sheets. Experience with a BI tool (Power BI, Tableau, or Metabase). Basic statistics knowledge. Python or R for data wrangling is a plus.',
      salary: '4,50,000 - 7,00,000/year',
      experience: '1 - 3 years',
      application_deadline: '2027-04-20',
      status: 'Open',
      created_by: admin.id
    },
    {
      title: 'Software Engineer',
      company: 'Nexus Software Labs',
      location: 'Bengaluru, KA',
      employment_type: 'Full-time',
      description: 'Nexus Software Labs is looking for a Software Engineer to join our core platform team. You will design distributed systems, contribute to architecture decisions, mentor junior developers, and ship features that impact millions of users globally.',
      requirements: 'Strong fundamentals in data structures and algorithms. Experience with microservices architecture. Proficiency in Java, Go, or Node.js. Experience with cloud platforms (AWS/GCP/Azure). Strong understanding of system design principles.',
      salary: '12,00,000 - 18,00,000/year',
      experience: '3 - 6 years',
      application_deadline: '2027-06-30',
      status: 'Open',
      created_by: admin.id
    },
    {
      title: 'Python Developer',
      company: 'DataPulse Corp',
      location: 'Chennai, TN',
      employment_type: 'Contract',
      description: 'DataPulse Corp is seeking an experienced Python Developer for a 6-month contract to build data pipelines and automation scripts. You will work with the data engineering team to process large datasets and integrate external APIs.',
      requirements: 'Strong Python proficiency. Experience with Pandas, NumPy, or similar libraries. Familiarity with REST API consumption. Knowledge of SQL and database design. Experience with task queues (Celery/RQ) is desirable.',
      salary: '60,000 - 80,000/month',
      experience: '2 - 5 years',
      application_deadline: '2027-03-15',
      status: 'Open',
      created_by: admin.id
    },
    {
      title: 'UI/UX Designer',
      company: 'PixelForge Studio',
      location: 'Mumbai, MH',
      employment_type: 'Full-time',
      description: 'PixelForge Studio is looking for a UI/UX Designer to create exceptional digital experiences. You will conduct user research, build wireframes, design high-fidelity prototypes, and work hand-in-hand with engineering teams to deliver polished interfaces.',
      requirements: 'Portfolio demonstrating product design work. Proficiency in Figma or Sketch. Understanding of design systems and component libraries. Knowledge of usability testing methodologies. Ability to communicate design rationale clearly.',
      salary: '5,00,000 - 8,00,000/year',
      experience: '1 - 4 years',
      application_deadline: '2027-04-10',
      status: 'Open',
      created_by: admin.id
    },
    {
      title: 'DevOps Engineer',
      company: 'CloudEdge Infrastructure',
      location: 'Noida, UP',
      employment_type: 'Full-time',
      description: 'CloudEdge Infrastructure needs a DevOps Engineer to manage our CI/CD pipelines, cloud infrastructure, and deployment automation. You will own system reliability, lead incident response, and drive infrastructure-as-code initiatives.',
      requirements: 'Experience with AWS or Azure. Strong knowledge of Linux administration. Proficiency with Docker and Kubernetes. Experience with CI/CD tools (Jenkins, GitHub Actions, or GitLab CI). Infrastructure-as-code experience with Terraform or Ansible.',
      salary: '10,00,000 - 15,00,000/year',
      experience: '3 - 7 years',
      application_deadline: '2026-12-31',
      status: 'Closed',
      created_by: admin.id
    }
  ];

  const insertJob = db.prepare(`
    INSERT OR IGNORE INTO jobs
      (title, company, location, employment_type, description, requirements,
       salary, experience, application_deadline, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const j of jobs) {
    insertJob.run(
      j.title, j.company, j.location, j.employment_type,
      j.description, j.requirements, j.salary, j.experience,
      j.application_deadline, j.status, j.created_by
    );
  }
  console.log(`Inserted/skipped ${jobs.length} jobs.`);

  // ── Applications ───────────────────────────────────────────────────────────
  const userRows = db.prepare(`SELECT id, email FROM users WHERE role = 'user'`).all();
  const jobRows  = db.prepare(`SELECT id, title FROM jobs`).all();

  // Map emails and titles to ids for convenience
  const userId  = email => userRows.find(u => u.email === email)?.id;
  const jobId   = title => jobRows.find(j => j.title === title)?.id;

  const applications = [
    { user: 'aarav@example.com', job: 'Frontend Developer Intern',    status: 'Shortlisted'  },
    { user: 'aarav@example.com', job: 'Full Stack Developer Intern',   status: 'Applied'      },
    { user: 'aarav@example.com', job: 'Python Developer',             status: 'Under Review' },
    { user: 'priya@example.com', job: 'Data Analyst',                 status: 'Selected'     },
    { user: 'priya@example.com', job: 'Software Engineer',            status: 'Applied'      },
    { user: 'rohan@example.com', job: 'Backend Developer',            status: 'Under Review' },
    { user: 'rohan@example.com', job: 'Software Engineer',            status: 'Rejected'     },
    { user: 'sneha@example.com', job: 'UI/UX Designer',               status: 'Applied'      },
    { user: 'sneha@example.com', job: 'Frontend Developer Intern',    status: 'Applied'      },
    { user: 'karan@example.com', job: 'Backend Developer',            status: 'Shortlisted'  },
    { user: 'karan@example.com', job: 'DevOps Engineer',              status: 'Rejected'     }
  ];

  const insertApp = db.prepare(
    `INSERT OR IGNORE INTO applications (user_id, job_id, status) VALUES (?, ?, ?)`
  );

  let appCount = 0;
  for (const a of applications) {
    const uid = userId(a.user);
    const jid = jobId(a.job);
    if (uid && jid) {
      insertApp.run(uid, jid, a.status);
      appCount++;
    }
  }
  console.log(`Inserted/skipped ${appCount} applications.`);

  console.log('\nSeed complete.\n');
  console.log('Demo credentials (DEVELOPMENT ONLY — change before deployment)');
  console.log('─────────────────────────────────────────────────────────────');
  console.log('Admin : admin@example.com  /  Admin@123');
  console.log('User  : aarav@example.com  /  User@1234');
  console.log('        priya@example.com  /  User@1234');
  console.log('        rohan@example.com  /  User@1234');
  console.log('        sneha@example.com  /  User@1234');
  console.log('        karan@example.com  /  User@1234');
  console.log('─────────────────────────────────────────────────────────────\n');

  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
