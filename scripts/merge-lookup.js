import fs from "fs";

const lookup = JSON.parse(
  fs.readFileSync("./output/merge/lookup.json", {encoding: "utf8", flag: "r"})
);
const geojson = JSON.parse(
  fs.readFileSync("./input/ltla16-bsc.json", {encoding: "utf8", flag: "r"})
);

geojson.features = geojson.features.map(f => {
  let code = f.properties.areacd;
  f.properties = lookup.find(l => l.ltla14cd === code);
  return f;
});

fs.writeFileSync("./output/merge/ltla-merge.json", JSON.stringify(geojson));
console.log("Merged lookup with GeoJSON...");