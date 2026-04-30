// @gpa-gruppo-progetti-avanzati-srl/ng-core-ui — generate-routes
// Run from the consuming app root: node node_modules/@gpa-gruppo-progetti-avanzati-srl/ng-core-ui/bin/generate-routes.mjs
// Output: dist/caps/ui/routes.yaml

// projects/ng-core-ui/src/lib/system/routes-export.ts
function entryToYaml(e) {
  const lines = [`  - category: ${e.category}`, `    id: ${e.id}`];
  const rest = e;
  for (const key of ["name", "description", "icon", "endpoint", "order", "menu"]) {
    if (rest[key] !== void 0) lines.push(`    ${key}: ${rest[key]}`);
  }
  return lines.join("\n");
}
function toRoutesYaml(routes, actions) {
  const entries = toRoutesList(routes, actions);
  return "cap_defs:\n" + entries.map(entryToYaml).join("\n") + "\n";
}
function toRoutesList(routes, actions) {
  const ui = routes.map(({ id, name, description, icon, endpoint, order, menu }) => ({
    category: "ui",
    id,
    ...name !== void 0 && { name },
    ...description !== void 0 && { description },
    ...icon !== void 0 && { icon },
    endpoint: endpoint != null ? endpoint === "" ? "/" : endpoint.startsWith("/") ? endpoint : `/${endpoint}` : void 0,
    ...order !== void 0 && { order },
    ...menu !== void 0 && { menu }
  }));
  const action = (actions ?? []).map((a) => ({
    category: "action",
    id: a.id,
    ...a.description !== void 0 && { description: a.description }
  }));
  return [...ui, ...action];
}

// projects/ng-core-ui/bin/generate-routes.ts
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { pathToFileURL } from "url";
var appRoot = process.cwd();
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
writeFileSync(join(outDir, "routes.yaml"), toRoutesYaml(APP_ROUTES, APP_ACTIONS));
console.log("routes.yaml written to", join(outDir, "routes.yaml"));
