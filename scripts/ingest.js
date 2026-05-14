require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const pool = require('../db/db');

const VIOLATIONS_FILE = path.join(process.env.HOME, 'Desktop/NLU_backEnd_takeHome_assessment_final/datasets/Building_Violations_20250815.csv');
const SCOFFLAWS_FILE = path.join(process.env.HOME, 'Desktop/NLU_backEnd_takeHome_assessment_final/datasets/Building_Code_Scofflaw_List_20250807.csv');

async function ingestViolations() {
  console.log('Ingesting violations...');
  const parser = fs.createReadStream(VIOLATIONS_FILE).pipe(
    parse({columns: true, skip_empty_lines: true, trim: true}) // convert text chunks to JS Objects
  );

  let count = 0;
  for await (const row of parser) {
    await pool.query(
      `INSERT INTO violations (address, violation_date, violation_code, status, description, inspector_comments)
      VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        row['ADDRESS'],
        row['VIOLATION DATE'] || null,
        row['VIOLATION CODE'] || null,
        row['VIOLATION STATUS'] || null,
        row['VIOLATION DESCRIPTION'] || null,
        row['VIOLATION INSPECTOR COMMENTS'] || null
      ]
    );
    count++;
    if (count % 1000 === 0) console.log(` ${count} violations inserted...`);
  }
  console.log(`Violations done - ${count} rows inserted`);
}

async function ingestScofflaws() {
  console.log('Ingesting scofflaws...');
  const parser = fs.createReadStream(SCOFFLAWS_FILE).pipe(
    parse({columns: true, skip_empty_lines: true, trim: true})
  );

  let count = 0;
  for await (const row of parser) {
    await pool.query(
      `INSERT INTO scofflaws (address) VALUES ($1)`,
      [row['ADDRESS']]
    );
    count++;
    if (count % 1000 === 0) console.log(` ${count} scofflaws inserted...`);
  }
  console.log(`Scofflaws done - ${count} rows inserted`);
}

async function main() {
  try {
    await ingestViolations();
    await ingestScofflaws();
    console.log('All done!');
  } catch (err) {
    console.error('Error ingesting data:', err);
  } finally {
    await pool.end();
  }
}