import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { LIB } from '../constants';
import { Schema } from '../types';

export function createDockerfile(options: Schema): Rule {
  return (tree: Tree, context: SchematicContext) => {
    if (tree.exists('Dockerfile')) {
      context.logger.info('  ⓘ Dockerfile già presente — skipping');
      return;
    }

    const angularJson = JSON.parse(tree.read('angular.json')!.toString('utf-8'));
    const projectName: string =
      options.project ?? angularJson.defaultProject ?? Object.keys(angularJson.projects)[0];

    const content = `FROM node:22-alpine AS builder

WORKDIR /app
ARG version

RUN apk add --no-cache curl bash python3 make g++ git
ENV BUN_INSTALL=/usr/local/bun
ENV PATH="\${BUN_INSTALL}/bin:\${PATH}"
RUN curl -fsSL https://bun.sh/install | bash

COPY package*.json ./
RUN bun install --ci

COPY src ./src
COPY public ./public
COPY tsconfig*.json ./
COPY angular.json ./
COPY .postcssrc.json ./
COPY .git .

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN git rev-parse HEAD | tr -d '\\n' > SHA
RUN echo  "$version"  | tr -d '\\n' > VERSION
RUN echo  "VERSION : " $(cat VERSION)
RUN echo "Git Sha : " $(cat SHA)

RUN bun ng build --configuration production --define "AppVersion='$version'"  --define "AppSha='$(cat SHA)'"

RUN bun node_modules/${LIB}/bin/generate-routes.mjs

RUN ls dist/

FROM busybox AS final

ENV ASSET_FOLDER=""

WORKDIR /app/

COPY --from=builder /app/dist/${projectName}/browser ./${projectName}
COPY --from=builder /app/dist/caps/ui/routes.yaml ./caps/ui/routes.yaml

RUN ls

ENTRYPOINT echo copy resources into Folder \${ASSETS_FOLDER} - Version \${VERSION} && \\
  mkdir -p \${ASSETS_FOLDER}/${projectName}/\${VERSION} && cp -r /app/${projectName}/* \${ASSETS_FOLDER}/${projectName}/\${VERSION} && \\
  mkdir -p \${ASSETS_FOLDER}/caps/ui && cp /app/caps/ui/routes.yaml \${ASSETS_FOLDER}/caps/ui/routes.yaml && \\
  ls \${ASSETS_FOLDER}
`;

    tree.create('Dockerfile', content);
    context.logger.info(`  ✔ Creato Dockerfile (progetto: ${projectName})`);
  };
}
