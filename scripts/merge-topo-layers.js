import fs from "fs";
import mapshaper from "mapshaper";

const lookup = JSON.parse(
  fs.readFileSync("./output/merge/lookup.json", {encoding: "utf8", flag: "r"})
);

const dir = "./output/layers/";
const files = fs.readdirSync(dir);

mapshaper.applyCommands(`-i ${files.map(f => `${dir}${f}`).join(" ")} combine-files -snap -clean -o all.json format=topojson`)
  .then(res => {
    const topo = JSON.parse(res["all.json"]);
    const layers = Object.keys(topo.objects);
    const objects = {};

    layers.forEach(l => {
      const key = l.slice(0, l.length - 2);
      const geometries = topo.objects[l].geometries;
      if (!objects[key]) objects[key] = {type:"GeometryCollection", geometries:[]};
      geometries.forEach(g => {
        let lkp = lookup.find(d => d[`${l}cd`] === g.properties.areacd);
        // console.log(l, g, `${l}cd`, g.properties.areacd, lkp);
        if (lkp[`${l}_start`]) g.properties.start = lkp[`${l}_start`];
        if (lkp[`${l}_end`]) g.properties.end = lkp[`${l}_end`];
        objects[key].geometries.push(g);
      });
    })

    topo.objects = objects;
    const str = JSON.stringify(topo);
    fs.writeFileSync("./output/topo.json", str);
    fs.writeFileSync("./public/data/topo.json", str);
    console.log("Generated final TopoJSON file ./output/topo.json");
});