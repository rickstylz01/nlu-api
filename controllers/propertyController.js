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

module.exports = { getPropertyByAddress };