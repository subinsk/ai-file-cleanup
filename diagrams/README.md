# AI File Management System - UML Diagrams

This directory contains all UML diagrams for the AI File Management System.

## 📁 Directory Structure

- `mermaid/` - Source mermaid files (single source of truth)
- `*.md` - Generated markdown files with diagrams
- `generate-definitions.js` - Script to regenerate all files

## 🔄 Centralized Diagram System

All diagrams are maintained in the `mermaid/` directory as `.mmd` files. These serve as the single source of truth for:

- React application (`/uml-diagrams` page)
- Documentation markdown files
- Any other mermaid-compatible tools

### Available Diagrams

- **Class Diagram** (`mermaid/01_class.mmd`) - Shows the static structure of the system with classes, attributes, methods, and relationships.
- **Activity Diagram** (`mermaid/02_activity.mmd`) - Shows the workflow and decision points in the scan and cleanup processes.
- **Component Diagram** (`mermaid/03_component.mmd`) - Shows the system components and their relationships.
- **Deployment Diagram** (`mermaid/04_deployment.mmd`) - Shows the deployment architecture and infrastructure components.
- **Use Case Diagram** (`mermaid/05_use_case.mmd`) - Shows the interactions between users and the system use cases.
- **Sequence Diagram** (`mermaid/06_sequence.mmd`) - Shows the interaction between objects over time during scan and cleanup processes.
- **State Diagram** (`mermaid/07_state.mmd`) - Shows the different states of the system and transitions between them.

## 🚀 Usage

### Updating Diagrams

1. Edit the source mermaid file in `mermaid/` directory
2. Run the generation script:
   ```bash
   node diagrams/generate-definitions.js
   ```
3. Both React app and markdown files will be updated automatically

### In React Application

Visit `http://localhost:3000/uml-diagrams` to view all diagrams with:
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

1. Create new `.mmd` file in `mermaid/` directory
2. Add metadata to `generate-definitions.js`
3. Run generation script
4. New diagram appears in both React app and documentation
