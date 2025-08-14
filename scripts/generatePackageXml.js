const fs = require('fs');
const path = require('path');

const folder = process.argv[2] || 'force-app/main/default';

const metadataTypes = {
  classes: 'ApexClass',
  lwc: 'LightningComponentBundle',
  aura: 'AuraDefinitionBundle',
  objects: 'CustomObject',
  triggers: 'ApexTrigger',
  layouts: 'Layout',
  permissionsets: 'PermissionSet',
  staticresources: 'StaticResource',
  workflows: 'Workflow',
};

function scanMetadataTypes(basePath) {
  const typesMap = {};

  for (const dir of Object.keys(metadataTypes)) {
    const fullDir = path.join(basePath, dir);
    if (!fs.existsSync(fullDir)) continue;

    const entries = fs.readdirSync(fullDir, { withFileTypes: true });
    const members = new Set();

    for (const entry of entries) {
      if (entry.isDirectory()) {
        members.add(entry.name); // for lwc, aura, etc.
      } else if (entry.isFile()) {
        const match = entry.name.match(/^(.+?)\.(cls|trigger|xml|page|resource|permissionset|layout|object|workflow)/);
        if (match) {
          members.add(match[1]);
        }
      }
    }

    if (members.size > 0) {
      typesMap[metadataTypes[dir]] = [...members];
    }
  }

  return typesMap;
}

function buildPackageXml(metadataMap, version = '59.0') {
  const lines = ['<?xml version="1.0" encoding="UTF-8"?>',
    '<Package xmlns="http://soap.sforce.com/2006/04/metadata">'];

  for (const [type, members] of Object.entries(metadataMap)) {
    lines.push('  <types>');
    members.sort().forEach(m => lines.push(`    <members>${m}</members>`));
    lines.push(`    <name>${type}</name>`);
    lines.push('  </types>');
  }

  lines.push(`  <version>${version}</version>`);
  lines.push('</Package>');

  return lines.join('\n');
}

const metadata = scanMetadataTypes(folder);
const xml = buildPackageXml(metadata);

fs.writeFileSync('package.xml', xml);
console.log('✅ package.xml generated successfully.');
