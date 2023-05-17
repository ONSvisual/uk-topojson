import fs from "fs";
import { csvParse, autoType } from "d3-dsv";

const data = csvParse(
  fs.readFileSync("./input/ltla14-lookup.csv", {encoding: "utf8", flag: "r"}).replace(/\uFEFF/g, ''),
  autoType
);
const changes = csvParse(
  fs.readFileSync("./input/changes.csv", {encoding: "utf8", flag: "r"}).replace(/\uFEFF/g, ''),
  autoType
);
const chg = {};
changes.forEach(c => chg[c.oldcd] = c);

// Get the years up to the latest change
const years = [14];
const latest = Math.max(...changes.map(c => c.start)) - 2000;
for (let i = years[0] + 1; i <= latest; i ++) years.push(i);
fs.writeFileSync("./output/merge/years.json", JSON.stringify(years));

// Generate the lookup
const lookup = [];
let current;

for (let d of data) {
  // Add 2014 codes for LTLAs and paretns
  let row = {
    uk14cd: "K02000001",
    uk14nm: "United Kingdom",
    ctry14cd: d.ctrycd,
    ctry14nm: d.ctrynm,
    rgn14cd: d.rgncd,
    rgn14nm: d.rgnnm,
    ltla14cd: d.ltlacd,
    ltla14nm: d.ltlanm
  };
  ["cty", "mcty", "cauth"].forEach(key => {
    if (d[`${key}cd`]) {
      row[`${key}14cd`] = d[`${key}cd`];
      row[`${key}14nm`] = d[`${key}nm`];
    }
  });
  row.utla14cd = d.ctycd ? d.ctycd : d.ltlacd;
  row.utla14nm = d.ctycd ? d.ctynm : d.ltlanm;
  current = {
    ltla: {cd: row.ltla14cd, yr: 14},
    utla: {cd: row.utla14cd, yr: 14},
    cty: d.ctycd ? {cd: d.ctycd, yr: 14} : null
  };
  for (let yr of years.slice(1)) {
    let y = yr + 2000;
    let change = chg[current.ltla.cd];
    // Update codes for merged areas (by year)
    if (change && change.start === y) {
      row[`ltla${current.ltla.yr}_end`] = y - 1;
      row[`ltla${yr}cd`] = change.newcd;
      row[`ltla${yr}nm`] = change.newnm;
      row[`ltla${yr}_start`] = y;
      current.ltla = {cd: row[`ltla${yr}cd`], yr};
      if (row[`ltla${yr}cd`].slice(0, 3) !== "E07") {
        row[`utla${current.utla.yr}_end`] = y - 1;
        row[`utla${yr}cd`] = row[`ltla${yr}cd`];
        row[`utla${yr}nm`] = row[`ltla${yr}nm`];
        row[`utla${yr}_start`] = y;
        current.utla = {cd: row[`utla${yr}cd`], yr};
      }
    }
    // Update codes for terminated counties
    change = current.cty ? chg[current.cty.cd] : null;
    if (change && change.start === y) {
      row[`cty${current.cty.yr}_end`] = y - 1;
      if (change.newcd) {
        row[`cty${y}cd`] = change.newcd;
        row[`cty${y}nm`] = change.newnm;
        row[`cty${y}_start`] = y;
        current.cty = {cd: row[`cty${y}cd`], yr};
      }
    }
  }
  lookup.push(row);
}

fs.writeFileSync("./output/merge/lookup.json", JSON.stringify(lookup));
console.log("Generated lookup file...");