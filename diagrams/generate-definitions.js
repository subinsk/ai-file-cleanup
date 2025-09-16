#!/usr/bin/env node

/**
 * Script to generate diagram definitions from centralized mermaid files
 * This ensures both React app and Markdown files use the same source
 */

const fs = require('fs');
const path = require('path');

// Configuration
const MERMAID_DIR = path.join(__dirname, 'mermaid');
const FRONTEND_UTILS_DIR = path.join(__dirname, '..', 'frontend', 'src', 'utils');
const DIAGRAMS_DIR = __dirname;

// Diagram metadata
const diagramMeta = {
  '01_class.mmd': {
    title: 'Class Diagram',
    description: 'Shows the static structure of the system with classes, attributes, methods, and relationships.'
  },
  '02_activity.mmd': {
    title: 'Activity Diagram', 
    description: 'Shows the workflow and decision points in the scan and cleanup processes.'
  },
  '03_component.mmd': {
    title: 'Component Diagram',
    description: 'Shows the system components and their relationships.'
  },
  '04_deployment.mmd': {
    title: 'Deployment Diagram',
    description: 'Shows the deployment architecture and infrastructure components.'
  },
  '05_use_case.mmd': {
    title: 'Use Case Diagram',
    description: 'Shows the interactions between users and the system use cases.'
  },
  '06_sequence.mmd': {
    title: 'Sequence Diagram',
    description: 'Shows the interaction between objects over time during scan and cleanup processes.'
  },
  '07_state.mmd': {
    title: 'State Diagram',
    description: 'Shows the different states of the system and transitions between them.'
  }
};

function readMermaidFile(filename) {
  const filePath = path.join(MERMAID_DIR, filename);
  return fs.readFileSync(filePath, 'utf8').trim();
}

function generateTypeScriptDefinitions() {
  console.log('📝 Generating TypeScript definitions...');
  
  const diagrams = [];
  
  // Read all mermaid files and create diagram definitions
  Object.entries(diagramMeta).forEach(([filename, meta]) => {
    try {
      const mermaidContent = readMermaidFile(filename);
      diagrams.push({
        title: meta.title,
        description: meta.description,
        mermaid: mermaidContent
      });
      console.log(`✅ Loaded ${filename}`);
    } catch (error) {
      console.error(`❌ Failed to load ${filename}:`, error.message);
    }
  });

  // Generate TypeScript file
  const tsContent = `/**
 * Centralized diagram definitions for the AI File Management System
 * This file is auto-generated from mermaid/*.mmd files
 * 
 * To regenerate, run: node diagrams/generate-definitions.js
 */

interface DiagramDefinition {
  title: string;
  description: string;
  mermaid: string;
}

export const diagramDefinitions: DiagramDefinition[] = ${JSON.stringify(diagrams, null, 2)};

export default diagramDefinitions;`;

  const outputPath = path.join(FRONTEND_UTILS_DIR, 'diagramDefinitions.ts');
  fs.writeFileSync(outputPath, tsContent);
  console.log(`✅ Generated TypeScript definitions: ${outputPath}`);
}

function generateMarkdownFiles() {
  console.log('📝 Generating Markdown files...');
  
  Object.entries(diagramMeta).forEach(([filename, meta]) => {
    try {
      const mermaidContent = readMermaidFile(filename);
      const diagramNumber = filename.split('_')[0];
      const markdownFilename = `${diagramNumber}_${filename.replace('.mmd', '_diagram.md')}`;
      
      const markdownContent = `# ${meta.title} - AI File Management System

## Mermaid Diagram

\`\`\`mermaid
${mermaidContent}
\`\`\`

## Description

${meta.description}

## Source

This diagram is maintained in \`diagrams/mermaid/${filename}\`.

To update this diagram:
1. Edit the source file: \`diagrams/mermaid/${filename}\`
2. Run: \`node diagrams/generate-definitions.js\`
3. This will update both the React component and this markdown file

## Usage

### In React Application
The diagram is automatically available in the UML Diagrams component at \`/uml-diagrams\`.

### In Documentation
Include in documentation by referencing the mermaid file:

\`\`\`markdown
\`\`\`mermaid
{{< include "diagrams/mermaid/${filename}" >}}
\`\`\`
\`\`\`

### Direct Mermaid Usage
You can also directly include the mermaid file in any mermaid-compatible renderer:

\`\`\`
${mermaidContent}
\`\`\`
`;

      const outputPath = path.join(DIAGRAMS_DIR, markdownFilename);
      fs.writeFileSync(outputPath, markdownContent);
      console.log(`✅ Generated ${markdownFilename}`);
      
    } catch (error) {
      console.error(`❌ Failed to generate markdown for ${filename}:`, error.message);
    }
  });
}

function createIndexFile() {
  console.log('📝 Creating index file...');
  
  const indexContent = `# AI File Management System - UML Diagrams

This directory contains all UML diagrams for the AI File Management System.

## 📁 Directory Structure

- \`mermaid/\` - Source mermaid files (single source of truth)
- \`*.md\` - Generated markdown files with diagrams
- \`generate-definitions.js\` - Script to regenerate all files

## 🔄 Centralized Diagram System

All diagrams are maintained in the \`mermaid/\` directory as \`.mmd\` files. These serve as the single source of truth for:

- React application (\`/uml-diagrams\` page)
- Documentation markdown files
- Any other mermaid-compatible tools

### Available Diagrams

${Object.entries(diagramMeta).map(([filename, meta]) => 
  `- **${meta.title}** (\`mermaid/${filename}\`) - ${meta.description}`
).join('\n')}

## 🚀 Usage

### Updating Diagrams

1. Edit the source mermaid file in \`mermaid/\` directory
2. Run the generation script:
   \`\`\`bash
   node diagrams/generate-definitions.js
   \`\`\`
3. Both React app and markdown files will be updated automatically

### In React Application

Visit \`http://localhost:3000/uml-diagrams\` to view all diagrams with:
- Interactive tabs
- Export to PNG/PDF functionality
- Responsive design

### In Documentation

All diagrams are available as both:
- Standalone markdown files with embedded mermaid
- Raw mermaid files for inclusion in other documentation

## 🔧 Benefits of This System

- **Single Source of Truth**: No duplication between React and Markdown
- **Consistency**: All diagrams stay in sync automatically
- **Maintainability**: Update once, deploy everywhere
- **Version Control**: Easy to track changes in source mermaid files
- **Tooling**: Works with any mermaid-compatible tool/renderer

## 📝 Adding New Diagrams

1. Create new \`.mmd\` file in \`mermaid/\` directory
2. Add metadata to \`generate-definitions.js\`
3. Run generation script
4. New diagram appears in both React app and documentation
`;

  const outputPath = path.join(DIAGRAMS_DIR, 'README.md');
  fs.writeFileSync(outputPath, indexContent);
  console.log(`✅ Generated README.md`);
}

// Main execution
function main() {
  console.log('🚀 Generating centralized diagram definitions...\n');
  
  try {
    // Ensure output directories exist
    if (!fs.existsSync(FRONTEND_UTILS_DIR)) {
      fs.mkdirSync(FRONTEND_UTILS_DIR, { recursive: true });
    }
    
    generateTypeScriptDefinitions();
    console.log('');
    generateMarkdownFiles();
    console.log('');
    createIndexFile();
    
    console.log('\n✨ All diagram definitions generated successfully!');
    console.log('\n📋 Summary:');
    console.log('- TypeScript definitions for React app');
    console.log('- Updated markdown files with diagrams');
    console.log('- Centralized documentation');
    console.log('\n🎯 Next steps:');
    console.log('- React app will automatically use new definitions');
    console.log('- Markdown files are ready for documentation');
    console.log('- All diagrams are synchronized from single source');
    
  } catch (error) {
    console.error('❌ Error generating definitions:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { generateTypeScriptDefinitions, generateMarkdownFiles, createIndexFile };
