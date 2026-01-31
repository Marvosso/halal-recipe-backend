import fetch from "node-fetch";
import { parse } from "csv-parse/sync"; // <-- correct ES module import
import { httpsAgent } from "./httpAgent.js";

export async function fetchHalalDB() {
  const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ2yqFIB_FkeIKnfZJPzJizFnpxbs5v3RqWfcR9yjn3sat_cVm3jC56zOfatWLU_SrTAY48G_d2rQGi/pub?output=csv"; // Replace with your published CSV URL ending in ?output=csv
  const res = await fetch(url, {
    agent: httpsAgent, // Reuse HTTP connections with keep-alive
  });
  const text = await res.text();

  // Parse CSV to array of objects
  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  // Map each record into proper format
  return records.map(r => ({
    haram: r.aliases.split(",").map(a => a.trim().toLowerCase()), // array of aliases
    halal: r.halal_alternative.trim(),
    ratio: parseFloat(r.conversion_ratio) || 1,
    severity: r.severity.trim()
  }));
}
