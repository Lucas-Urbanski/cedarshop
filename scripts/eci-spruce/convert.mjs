#!/usr/bin/env node
// Converts an ECI Spruce export into Firestore-shaped JSON using the guessed
// field mapping in ./mapping.mjs.
//
//   npm run migrate:eci -- items exports/spruce-items.json
//   npm run migrate:eci -- sales exports/spruce-invoices.csv --csv
//
// Writes out/eci-spruce/<entity>.json (documents keyed by id, ready to load)
// and out/eci-spruce/<entity>-report.json (unmapped columns, missing ids,
// duplicate ids, sample document). Nothing is written to Firestore.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

import { ENTITY_NAMES, MAPPINGS } from "./mapping.mjs";

function usage(message) {
  if (message) console.error(`\n${message}`);
  console.error(
    "\nUsage: node scripts/eci-spruce/convert.mjs <entity> <file> [--csv] [--out dir]",
  );
  console.error(`Entities: ${ENTITY_NAMES.join(", ")}`);
  process.exit(1);
}

function parseCsv(source) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];

    if (quoted) {
      if (character === '"' && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && source[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (field !== "" || row.length) {
    row.push(field);
    if (row.some((value) => value.trim() !== "")) rows.push(row);
  }

  const [header, ...records] = rows;
  if (!header) return [];

  return records.map((values) =>
    Object.fromEntries(
      header.map((column, index) => [
        column.trim().replace(/^\uFEFF/, ""),
        values[index] ?? "",
      ]),
    ),
  );
}

// Export headers vary in casing between Spruce versions ("ItemCode" vs
// "ITEMCODE"), so every lookup falls back to a case-insensitive match.
function makeLookup(record) {
  const lowerCaseColumns = new Map(
    Object.keys(record).map((column) => [column.toLowerCase(), column]),
  );

  return (name) => {
    if (name in record) return { value: record[name], column: name };

    const actual = lowerCaseColumns.get(name.toLowerCase());

    return actual === undefined
      ? { value: undefined, column: null }
      : { value: record[actual], column: actual };
  };
}

function readFirst(lookup, candidates) {
  for (const candidate of candidates) {
    const hit = lookup(candidate);
    if (
      hit.value !== undefined &&
      hit.value !== null &&
      String(hit.value).trim() !== ""
    ) {
      return hit;
    }
  }

  return { value: undefined, column: null };
}

function setPath(target, path, value) {
  const segments = path.split(".");
  let cursor = target;

  segments.slice(0, -1).forEach((segment) => {
    if (typeof cursor[segment] !== "object" || cursor[segment] === null) {
      cursor[segment] = {};
    }
    cursor = cursor[segment];
  });

  cursor[segments.at(-1)] = value;
}

function convert(records, mapping) {
  const documents = {};
  const consumedColumns = new Set();
  const missingIds = [];
  const duplicateIds = [];
  const allSourceColumns = new Set();

  records.forEach((record) => {
    Object.keys(record).forEach((column) => allSourceColumns.add(column));

    const lookup = makeLookup(record);
    const valueOf = (name) => lookup(name).value;
    const idHit = readFirst(lookup, mapping.id);
    const id = idHit.value === undefined ? "" : String(idHit.value).trim();
    if (idHit.column) consumedColumns.add(idHit.column);

    if (!id) {
      missingIds.push(record);
      return;
    }

    if (documents[id]) duplicateIds.push(id);

    const byCollection = {};

    mapping.fields.forEach((field) => {
      const hit = readFirst(lookup, field.source);
      if (hit.column) consumedColumns.add(hit.column);

      const rawValue = hit.value;
      let value;

      if (rawValue === undefined) {
        if (field.fallback) {
          value = field.fallback(valueOf);
          (field.fallbackColumns ?? []).forEach((column) => {
            const used = lookup(column);
            if (used.column) consumedColumns.add(used.column);
          });
        }
      } else {
        value = field.transform ? field.transform(rawValue) : rawValue;
      }

      if (value === undefined) return;

      const target = field.collection ?? mapping.collection;
      byCollection[target] ??= {};
      setPath(byCollection[target], field.target, value);
    });

    documents[id] = {
      id,
      documents: byCollection[mapping.collection]
        ? { [mapping.collection]: byCollection[mapping.collection] }
        : {},
    };

    Object.entries(byCollection).forEach(([collectionName, data]) => {
      if (collectionName === mapping.collection) return;
      documents[id].documents[collectionName] = data;
    });
  });

  const unmappedColumns = [...allSourceColumns]
    .filter((column) => !consumedColumns.has(column))
    .sort();

  return {
    documents,
    report: {
      entity: mapping.label,
      primaryCollection: mapping.collection,
      companionCollections: mapping.companionCollections ?? [],
      sourceRecords: records.length,
      convertedRecords: Object.keys(documents).length,
      missingIds: missingIds.length,
      duplicateIds: [...new Set(duplicateIds)],
      unmappedColumns,
      sampleSource: records[0] ?? null,
      sampleDocument: Object.values(documents)[0] ?? null,
    },
  };
}

async function main() {
  const args = process.argv.slice(2);
  const entity = args[0];
  const file = args[1];

  if (!entity || !file) usage();
  if (!MAPPINGS[entity]) usage(`Unknown entity "${entity}".`);

  const isCsv = args.includes("--csv");
  const outIndex = args.indexOf("--out");
  const outDir =
    outIndex === -1 ? "out/eci-spruce" : resolve(args[outIndex + 1] ?? "out/eci-spruce");

  const raw = await readFile(resolve(file), "utf8");
  const records = isCsv ? parseCsv(raw) : JSON.parse(raw);

  if (!Array.isArray(records)) {
    usage("Expected a JSON array of records (or pass --csv for a CSV export).");
  }

  const { documents, report } = convert(records, MAPPINGS[entity]);

  await mkdir(outDir, { recursive: true });

  const documentsPath = join(outDir, `${entity}.json`);
  const reportPath = join(outDir, `${entity}-report.json`);

  await writeFile(documentsPath, `${JSON.stringify(documents, null, 2)}\n`);
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  console.log(`\n${report.entity}`);
  console.log(`  source records     ${report.sourceRecords}`);
  console.log(`  converted          ${report.convertedRecords}`);
  console.log(`  primary collection ${report.primaryCollection}`);
  if (report.companionCollections.length) {
    console.log(`  also writes        ${report.companionCollections.join(", ")}`);
  }
  if (report.missingIds) {
    console.log(`  missing ids        ${report.missingIds} (see report)`);
  }
  if (report.duplicateIds.length) {
    console.log(`  duplicate ids      ${report.duplicateIds.join(", ")}`);
  }
  console.log(
    `  unmapped columns   ${
      report.unmappedColumns.length
        ? report.unmappedColumns.join(", ")
        : "none"
    }`,
  );
  console.log(`\nWrote ${dirname(documentsPath)}/${entity}.json`);
  console.log(`Wrote ${reportPath}\n`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
