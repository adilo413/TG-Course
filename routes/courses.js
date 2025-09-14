const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const auth = require('./auth');
const verifyToken = auth.verifyToken;
const router = express.Router();

// Get all courses (admin only)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { subject } = req.query;
    
    let queryText = 'SELECT * FROM courses';
    let params = [];
    
    if (subject) {
      queryText += ' WHERE subject = $1';
      params.push(subject);
    }
    
    queryText += ' ORDER BY created_at DESC';
    
    const result = await query(queryText, params);
    
    res.json({
      success: true,
      courses: result.rows
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get course by ID (public - for students)
router.get('/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Access token required' });
    }

    // Verify token
    const tokenResult = await query(
      'SELECT t.*, c.* FROM tokens t JOIN courses c ON t.course_id = c.course_id WHERE t.token = $1 AND c.course_id = $2',
      [token, courseId]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found or invalid token' });
    }

    const course = tokenResult.rows[0];

    // Check if course is active
    if (!course.is_active) {
      return res.status(403).json({ error: 'Course is deactivated' });
    }

    // Return course data (without sensitive info)
    res.json({
      success: true,
      course: {
        course_id: course.course_id,
        title: course.title,
        subject: course.subject,
        content: course.content,
        images: course.images,
        created_at: course.created_at
      }
    });

  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new course (admin only)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, subject, content, images = [] } = req.body;

    if (!title || !subject || !content) {
      return res.status(400).json({ error: 'Title, subject, and content are required' });
    }

    const courseId = uuidv4();

    const result = await query(
      `INSERT INTO courses (course_id, title, subject, content, images) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [courseId, title, subject, content, JSON.stringify(images)]
    );

    res.status(201).json({
      success: true,
      course: result.rows[0]
    });

  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update course (admin only)
router.put('/:courseId', verifyToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, subject, content, images, is_active } = req.body;

    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      updateFields.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (subject !== undefined) {
      updateFields.push(`subject = $${paramCount++}`);
      values.push(subject);
    }
    if (content !== undefined) {
      updateFields.push(`content = $${paramCount++}`);
      values.push(content);
    }
    if (images !== undefined) {
      updateFields.push(`images = $${paramCount++}`);
      values.push(JSON.stringify(images));
    }
    if (is_active !== undefined) {
      updateFields.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(courseId);

    const result = await query(
      `UPDATE courses SET ${updateFields.join(', ')} 
       WHERE course_id = $${paramCount} 
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({
      success: true,
      course: result.rows[0]
    });

  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete course (admin only)
router.delete('/:courseId', verifyToken, async (req, res) => {
  try {
    const { courseId } = req.params;

    const result = await query(
      'DELETE FROM courses WHERE course_id = $1 RETURNING *',
      [courseId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });

  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate access token for course (admin only)
router.post('/:courseId/token', verifyToken, async (req, res) => {
  try {
    const { courseId } = req.params;

    // Check if course exists
    const courseResult = await query(
      'SELECT * FROM courses WHERE course_id = $1',
      [courseId]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Generate new token
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // Token valid for 1 year

    // Delete old tokens for this course
    await query('DELETE FROM tokens WHERE course_id = $1', [courseId]);

    // Insert new token
    await query(
      'INSERT INTO tokens (course_id, token, expires_at) VALUES ($1, $2, $3)',
      [courseId, token, expiresAt]
    );

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const accessLink = `${baseUrl}#/course/${courseId}?token=${token}`;

    res.json({
      success: true,
      token,
      accessLink,
      expiresAt
    });

  } catch (error) {
    console.error('Generate token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
