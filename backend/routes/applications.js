const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path
      .parse(file.originalname)
      .name.replace(/[^a-z0-9_-]+/gi, '-')
      .replace(/^-+|-+$/g, '') || 'file';

    const uniqueName = `${timestamp}-${base}${ext}`;
    cb(null, uniqueName);
  },
});

const allowedMime = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (allowedMime.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: pdf, doc, docx, txt'));
    }
  },
});

function parseJSONField(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (_err) {
    return fallback;
  }
}

function buildApplicationsRouter(pool) {
  const router = express.Router();

  router.post('/', upload.single('resume'), async (req, res) => {
    const body = req.body || {};
    const appleDevices = parseJSONField(body.appleDevices, []);
    const programmingSkills = parseJSONField(body.programmingSkills, {});

    const {
      email,
      fullName,
      university,
      enrollmentNumber,
      contactNumber,
      cgpa,
      activeBacklogs,
      otherLanguages = '',
      leetcodeRank = '',
      leetcodeLink = '',
      hackerrankRank = '',
      hackerrankLink = '',
      githubLink = '',
      hackathonsParticipated = 'no',
      hackathonDetails = '',
      projectsDone = 'no',
      projectDetails = '',
      entrepreneurshipPrograms = 'no',
      entrepreneurshipDetails = '',
      otherSkillBuilding = 'no',
      otherSkillDetails = '',
      specialSkills = '',
      awards = '',
      planAfterGraduation = null,
      planOther = '',
      motivation = '',
    } = body;

    const requiredFields = {
      email,
      fullName,
      university,
      enrollmentNumber,
      contactNumber,
      cgpa,
      planAfterGraduation,
      motivation,
    };

    const missing = Object.entries(requiredFields)
      .filter(([, value]) => value === undefined || value === null || String(value).trim() === '')
      .map(([key]) => key);

    if (missing.length) {
      return res.status(400).json({ message: `Missing required fields: ${missing.join(', ')}` });
    }

    const cgpaNumber = Number(cgpa);
    if (Number.isNaN(cgpaNumber)) {
      return res.status(400).json({ message: 'CGPA must be a number' });
    }

    if (req.file?.size && req.file.size > 10 * 1024 * 1024) {
      return res.status(400).json({ message: 'Resume file exceeds 10MB limit' });
    }

    const resumePath = req.file ? `/uploads/${req.file.filename}` : null;

    const toYesNo = (value) => String(value).toLowerCase() === 'yes';
    const hackathonsFlag = toYesNo(hackathonsParticipated);
    const projectsFlag = toYesNo(projectsDone);
    const entrepreneurshipFlag = toYesNo(entrepreneurshipPrograms);
    const otherSkillFlag = toYesNo(otherSkillBuilding);

    try {
      const insertQuery = `
        INSERT INTO applications (
          email,
          full_name,
          university,
          enrollment_number,
          contact_number,
          apple_devices,
          cgpa,
          active_backlogs,
          programming_skills,
          other_languages,
          leetcode_rank,
          leetcode_link,
          hackerrank_rank,
          hackerrank_link,
          github_link,
          hackathons_participated,
          hackathon_details,
          projects_done,
          project_details,
          entrepreneurship_programs,
          entrepreneurship_details,
          other_skill_building,
          other_skill_details,
          special_skills,
          awards,
          plan_after_graduation,
          plan_other,
          motivation,
          resume_path
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await pool.execute(insertQuery, [
        email,
        fullName,
        university,
        enrollmentNumber,
        contactNumber,
        JSON.stringify(appleDevices || []),
        cgpaNumber,
        activeBacklogs || null,
        JSON.stringify(programmingSkills || {}),
        otherLanguages,
        leetcodeRank,
        leetcodeLink,
        hackerrankRank,
        hackerrankLink,
        githubLink,
        hackathonsFlag ? 1 : 0,
        hackathonDetails,
        projectsFlag ? 1 : 0,
        projectDetails,
        entrepreneurshipFlag ? 1 : 0,
        entrepreneurshipDetails,
        otherSkillFlag ? 1 : 0,
        otherSkillDetails,
        specialSkills,
        awards,
        planAfterGraduation,
        planOther,
        motivation,
        resumePath,
      ]);

      res.status(201).json({ message: 'Application submitted successfully' });
    } catch (error) {
      console.error('Failed to save application', error);
      res.status(500).json({ message: 'Failed to save application' });
    }
  });

  return router;
}

module.exports = buildApplicationsRouter;
