#!/usr/bin/env node
/**
 * Generate SQLAlchemy models from Prisma schema
 * Parses schema.prisma and creates Python SQLAlchemy model files
 */
/* eslint-disable @typescript-eslint/no-var-requires, no-console */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const schemaPath = path.join(rootDir, 'packages', 'db', 'prisma', 'schema.prisma');
const modelsDir = path.join(rootDir, 'services', 'api', 'app', 'models');

console.log('🔄 Generating SQLAlchemy models from Prisma schema...');

// Check if schema exists
if (!fs.existsSync(schemaPath)) {
  console.error(`❌ Schema not found at: ${schemaPath}`);
  process.exit(1);
}

// Read schema file
const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

// Parse models from schema
function parseSchema(content) {
  const models = [];
  const enumTypes = [];

  // Parse enums
  const enumRegex = /enum\s+(\w+)\s*\{([^}]+)\}/g;
  let match;
  while ((match = enumRegex.exec(content)) !== null) {
    const enumName = match[1];
    const values = match[2]
      .trim()
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('@@') && !line.startsWith('//'));
    enumTypes.push({ name: enumName, values });
  }

  // Parse models
  const modelRegex = /model\s+(\w+)\s*\{([^}]+)\}/g;
  while ((match = modelRegex.exec(content)) !== null) {
    const modelName = match[1];
    const body = match[2];

    const fields = [];
    const relations = [];
    let tableName = modelName.toLowerCase() + 's';

    // Parse fields
    const lines = body
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('//'));

    for (const line of lines) {
      // Parse @@map
      if (line.startsWith('@@map')) {
        const mapMatch = line.match(/@@map\("([^"]+)"\)/);
        if (mapMatch) tableName = mapMatch[1];
        continue;
      }

      // Skip @@index, @@unique
      if (line.startsWith('@@')) continue;

      // Parse field
      const fieldMatch = line.match(/^(\w+)\s+(\w+(\[\])?(\?)?)\s*(.*)?$/);
      if (!fieldMatch) continue;

      const fieldName = fieldMatch[1];
      const fieldType = fieldMatch[2];
      const attributes = fieldMatch[5] || '';

      // Check if relation
      if (/^[A-Z]/.test(fieldType.replace('[]', '').replace('?', ''))) {
        relations.push({
          name: fieldName,
          type: fieldType,
          attributes,
        });
        continue;
      }

      // Parse field attributes
      const field = {
        name: fieldName,
        type: fieldType,
        isPrimary: attributes.includes('@id'),
        isUnique: attributes.includes('@unique'),
        isOptional: fieldType.includes('?'),
        isArray: fieldType.includes('[]'),
        defaultValue: null,
        dbType: null,
        columnName: fieldName,
      };

      // Parse @map
      const mapMatch = attributes.match(/@map\("([^"]+)"\)/);
      if (mapMatch) field.columnName = mapMatch[1];

      // Parse @default
      const defaultMatch = attributes.match(/@default\(([^)]+)\)/);
      if (defaultMatch) field.defaultValue = defaultMatch[1];

      // Parse @db type
      const dbMatch = attributes.match(/@db\.(\w+(\([^)]*\))?)/);
      if (dbMatch) field.dbType = dbMatch[1];

      // Parse Unsupported type
      const unsupportedMatch = attributes.match(/Unsupported\("([^"]+)"\)/);
      if (unsupportedMatch) field.unsupportedType = unsupportedMatch[1];

      fields.push(field);
    }

    models.push({
      name: modelName,
      tableName,
      fields,
      relations,
    });
  }

  return { models, enums: enumTypes };
}

// Map Prisma types to SQLAlchemy types
function mapType(field) {
  const baseType = field.type.replace('?', '').replace('[]', '');

  // Handle Unsupported (pgvector)
  if (field.unsupportedType) {
    const vectorMatch = field.unsupportedType.match(/vector\((\d+)\)/);
    if (vectorMatch) {
      return `Vector(${vectorMatch[1]})`;
    }
    return 'String';
  }

  // Handle DB-specific types
  if (field.dbType) {
    if (field.dbType.startsWith('Uuid')) return 'UUID(as_uuid=True)';
    if (field.dbType.startsWith('Timestamptz')) return 'DateTime(timezone=True)';
  }

  switch (baseType) {
    case 'String':
      return 'String';
    case 'Int':
      return 'Integer';
    case 'BigInt':
      return 'BigInteger';
    case 'Boolean':
      return 'Boolean';
    case 'DateTime':
      return 'DateTime(timezone=True)';
    case 'Float':
      return 'Float';
    default:
      // Check if it's an enum
      return baseType;
  }
}

// Generate Python model file
function generateModel(model, enums) {
  const imports = new Set([
    'from sqlalchemy import Column, String, Integer, BigInteger, Boolean, DateTime, ForeignKey, Index',
    'from sqlalchemy.dialects.postgresql import UUID',
    'from sqlalchemy.orm import relationship',
    'from datetime import datetime',
    'import uuid',
  ]);

  // Check if we need pgvector
  const hasVector = model.fields.some(
    (f) => f.unsupportedType && f.unsupportedType.includes('vector')
  );
  if (hasVector) {
    imports.add('from pgvector.sqlalchemy import Vector');
  }

  // Check if we need Enum
  const hasEnum = model.fields.some((f) => {
    const baseType = f.type.replace('?', '').replace('[]', '');
    return enums.some((e) => e.name === baseType);
  });
  if (hasEnum) {
    imports.add('from sqlalchemy import Enum as SQLEnum');
  }

  imports.add('from app.models.base import Base');

  let code = Array.from(imports).sort().join('\n') + '\n\n';

  code += `\nclass ${model.name}(Base):\n`;
  code += `    __tablename__ = "${model.tableName}"\n\n`;

  // Generate fields
  for (const field of model.fields) {
    const sqlType = mapType(field);
    const nullable = field.isOptional && !field.isPrimary;
    const constraints = [];

    if (field.isPrimary) {
      constraints.push('primary_key=True');
    }
    if (field.isUnique && !field.isPrimary) {
      constraints.push('unique=True');
    }
    if (!nullable && !field.isPrimary) {
      constraints.push('nullable=False');
    }

    // Handle default values
    if (field.defaultValue) {
      if (field.defaultValue === 'uuid()') {
        constraints.push('default=uuid.uuid4');
      } else if (field.defaultValue === 'now()') {
        constraints.push('default=datetime.utcnow');
      } else if (field.defaultValue === 'false') {
        constraints.push('default=False');
      } else if (field.defaultValue === 'true') {
        constraints.push('default=True');
      } else if (!isNaN(field.defaultValue)) {
        constraints.push(`default=${field.defaultValue}`);
      }
    }

    // Check if it's an enum
    const baseType = field.type.replace('?', '').replace('[]', '');
    const enumType = enums.find((e) => e.name === baseType);
    let columnType;
    if (enumType) {
      const enumValues = enumType.values.map((v) => `"${v}"`).join(', ');
      columnType = `SQLEnum(${enumValues}, name="${enumType.name
        .toLowerCase()
        .replace(/([A-Z])/g, '_$1')
        .toLowerCase()}")`;
    } else {
      columnType = sqlType;
    }

    const constraintStr = constraints.length > 0 ? ', ' + constraints.join(', ') : '';
    code += `    ${field.name} = Column("${field.columnName}", ${columnType}${constraintStr})\n`;
  }

  // Generate relationships
  if (model.relations.length > 0) {
    code += '\n    # Relationships\n';
    for (const rel of model.relations) {
      const relType = rel.type.replace('[]', '').replace('?', '');
      const isArray = rel.type.includes('[]');
      const relName = relType.charAt(0).toLowerCase() + relType.slice(1);
      if (isArray) {
        code += `    ${rel.name} = relationship("${relType}", back_populates="${relName}")\n`;
      } else {
        code += `    # ${rel.name} relationship defined in ${relType} model\n`;
      }
    }
  }

  return code + '\n';
}

// Generate base.py
function generateBase() {
  return `"""Base class for all SQLAlchemy models"""
from sqlalchemy.orm import declarative_base

# Base class for all models
Base = declarative_base()
`;
}

// Generate __init__.py
function generateInit() {
  return `"""SQLAlchemy models for database access"""
# Import Base first
from app.models.base import Base

# Import all models (so they're registered with Base)
from app.models.user import User
from app.models.license_key import LicenseKey
from app.models.upload import Upload
from app.models.file import File
from app.models.file_embedding import FileEmbedding
from app.models.dedupe_group import DedupeGroup

__all__ = [
    'Base',
    'User',
    'LicenseKey',
    'Upload',
    'File',
    'FileEmbedding',
    'DedupeGroup',
]
`;
}

// Parse schema
const { models, enums } = parseSchema(schemaContent);

console.log(`✅ Found ${models.length} models and ${enums.length} enums`);

// Create models directory
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

// Generate base.py
fs.writeFileSync(path.join(modelsDir, 'base.py'), generateBase());
console.log('✅ Generated base.py');

// Generate __init__.py
fs.writeFileSync(path.join(modelsDir, '__init__.py'), generateInit());
console.log('✅ Generated __init__.py');

// Generate model files
for (const model of models) {
  const fileName =
    model.name.replace(/([A-Z])/g, (match, p1, offset) => {
      return offset > 0 ? '_' + p1.toLowerCase() : p1.toLowerCase();
    }) + '.py';

  const modelCode = generateModel(model, enums);
  fs.writeFileSync(path.join(modelsDir, fileName), modelCode);
  console.log(`✅ Generated ${fileName}`);
}

console.log('');
console.log('✅ All SQLAlchemy models generated successfully!');
console.log(`📁 Models location: ${path.relative(rootDir, modelsDir)}`);
