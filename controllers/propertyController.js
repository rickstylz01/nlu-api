const pool = require('../db/db.js');

const getPropertyByAddress = async (req, res) => {
  const { address } = req.params;

  try {
    const violationsResult = await pool.query(
      `SELECT id, violation_date, violation_code, status, description, inspector_comments
      FROM violations
      WHERE LOWER(address) = LOWER($1)
      ORDER BY violation_date DESC`,
      [address]
    );

    const scofflawsResult = await pool.query(
      `SELECT id FROM scofflaws
      WHERE LOWER(address) = LOWER($1)
      LIMIT 1`,
      [address]
    );

    res.json({
      address,
      is_scofflaw: scofflawsResult.rows.length > 0,
      violations: violationsResult.rows,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const postComment = async(req, res) => {
  const { address } = req.params;
  const { author, comment } = req.body;


  if (!author || !comment) {
    return res.status(400).json({ error: 'author and comment are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO comments (address, author, comment)
      VALUES ($1, $2, $3)
      RETURNING id, address, author, comment, created_at`,
      [address, author, comment]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

const getScofflawsWithViolations = async (req, res) => {
  const { since } = req.query;

  if (!since) {
    return res.status(400).json({ error: 'since query parameter is required' });
  }

  try {
    const result = await pool.query(
      `SELECT s.address,
        json_agg(
          DISTINCT jsonb_build_object(
            'id', v.id,
            'violation_date', v.violation_date,
            'violation_code', v.violation_code,
            'status', v.status,
            'description', v.description
          )
        ) AS violations
      FROM scofflaws s
      JOIN violations v ON LOWER(s.address) = LOWER(v.address)
      WHERE v.violation_date >= $1
      GROUP BY s.address
      ORDER BY s.address`,
      [since]
    );

    res.json({
      since,
      count: result.rows.length,
      results: result.rows,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getPropertyByAddress, postComment, getScofflawsWithViolations };