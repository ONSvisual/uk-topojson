import fs from "fs";
import mapshaper from "mapshaper";

const keys = ["ltla", "utla", "cty", "mcty", "cauth", "rgn", "ctry", "uk"];
const years = JSON.parse(
  fs.readFileSync("./output/merge/years.json", {encoding: "utf8", flag: "r"})
);
const lookup = JSON.parse(
  fs.readFileSync("./output/merge/lookup.json", {encoding: "utf8", flag: "r"})
);

const layers = [];
keys.forEach(key => {
  years.forEach(y => {
    if (lookup.find(l => l[`${key}${y}cd`])) {
      mapshaper.runCommands(`-i ./output/merge/ltla-merge.json -rename-fields areacd=${key}${y}cd,areanm=${key}${y}nm -filter 'areacd !== undefined' -dissolve2 areacd,areanm name=${key}${y} -clean -o ./output/layers/${key}${y}.json format=geojson`);
      layers.push(`${key}${y}`);
    }
  });
});
console.log("Generated GeoJSON for each geography + unique year...");