// @gpa-gruppo-progetti-avanzati-srl/ng-core-ui — generate-mongo
// Run from the consuming app root: node node_modules/@gpa-gruppo-progetti-avanzati-srl/ng-core-ui/bin/generate-mongo.mjs
// Output: dist/caps/ui/acl.mongo.js

// projects/ng-core-ui/src/lib/system/routes-export.ts
function toRoutesMongo(routes, actions, appId2 = "", appDescription2 = "") {
  const entries = toRoutesList(routes, actions);
  const lines = [];
  for (const e of entries) {
    const doc = {
      _id: e._id,
      _et: "cap-def",
      app: appId2,
      category: e.category
    };
    if (e.name !== void 0) doc["name"] = e.name;
    if (e.description !== void 0) doc["description"] = e.description;
    if (e.endpoint !== void 0) doc["endpoint"] = e.endpoint;
    if (e.icon !== void 0) doc["icon"] = e.icon;
    if (e.order !== void 0) doc["order"] = e.order;
    if (e.menu !== void 0) doc["menu"] = e.menu;
    doc["sys_info"] = "__SYS_INFO__";
    const json = JSON.stringify(doc, null, 4).replace('"__SYS_INFO__"', '{\n        status: "active",\n        created_at: new Date(),\n        modified_at: new Date()\n    }');
    lines.push(
      `db.getCollection(COLLECTION).replaceOne(
    { _id: ${JSON.stringify(e._id)} },
    ${json},
    { upsert: true }
)`
    );
  }
  const capabilities = entries.map((e) => `        ${JSON.stringify(e._id)}`).join(",\n");
  const groupId = `grp:${appId2}:ALL`;
  const groupDoc = `{
    _id: ${JSON.stringify(groupId)},
    _et: "cap-group",
    description: ${JSON.stringify(appDescription2)},
    capabilities: [
${capabilities}
    ],
    sys_info: {
        status: "active",
        created_at: new Date(),
        modified_at: new Date()
    }
}`;
  lines.push(
    `db.getCollection(COLLECTION).replaceOne(
    { _id: ${JSON.stringify(groupId)} },
    ${groupDoc},
    { upsert: true }
)`
  );
  return `const COLLECTION = "acl";

` + lines.join("\n\n") + "\n";
}
function toRoutesList(routes, actions) {
  const ui = routes.map((r) => {
    const { name, description, icon, endpoint, order, menu } = r;
    const _id = r.id;
    return {
      category: "ui",
      _id,
      ...name !== void 0 && { name },
      ...description !== void 0 && { description },
      ...icon !== void 0 && { icon },
      endpoint: endpoint != null ? endpoint === "" ? "/" : endpoint.startsWith("/") ? endpoint : `/${endpoint}` : void 0,
      ...order !== void 0 && { order },
      ...menu !== void 0 && { menu }
    };
  });
  const action = (actions ?? []).map((a) => ({
    category: "action",
    _id: a.id,
    ...a.description !== void 0 && { description: a.description }
  }));
  const entries = [...ui, ...action];
  const seen = /* @__PURE__ */ new Map();
  const duplicates = [];
  for (const e of entries) {
    const count = (seen.get(e._id) ?? 0) + 1;
    seen.set(e._id, count);
    if (count === 2) duplicates.push(e._id);
  }
  if (duplicates.length > 0) {
    throw new Error(
      `ACL generation failed \u2014 duplicate route/action IDs detected:
` + duplicates.map((id) => `  \u2022 ${id}`).join("\n") + `

Each entry in APP_ROUTES and APP_ACTIONS must have a unique id.`
    );
  }
  return entries;
}

// projects/ng-core-ui/bin/generate-mongo.ts
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { pathToFileURL } from "url";
var appRoot = process.cwd();
var angularJson = JSON.parse(readFileSync(join(appRoot, "angular.json"), "utf-8"));
var appId = angularJson.defaultProject ?? Object.keys(angularJson.projects)[0];
var packageJson = JSON.parse(readFileSync(join(appRoot, "package.json"), "utf-8"));
var appDescription = packageJson.description ?? "";
var routesConfigPath = pathToFileURL(join(appRoot, "src/app/app.routes.config.ts")).href;
var actionsConfigPath = pathToFileURL(join(appRoot, "src/app/app.actions.config.ts")).href;
var { APP_ROUTES } = await import(routesConfigPath);
var APP_ACTIONS;
try {
  const actionsModule = await import(actionsConfigPath);
  APP_ACTIONS = actionsModule.APP_ACTIONS;
} catch {
}
var outDir = join(appRoot, "dist", "caps", "ui");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "acl.mongo.js"), toRoutesMongo(APP_ROUTES, APP_ACTIONS, appId, appDescription));
console.log("acl.mongo.js written to", join(outDir, "acl.mongo.js"));
