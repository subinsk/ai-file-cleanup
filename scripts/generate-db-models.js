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
    const foreignKeys = new Map(); // fieldName -> { refTable, refColumn, onDelete, relationName }
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

      // Check if relation (custom types, not Prisma primitives)
      const baseType = fieldType.replace('[]', '').replace('?', '');
      const isPrismaType = [
        'String',
        'Int',
        'BigInt',
        'Boolean',
        'DateTime',
        'Float',
        'Decimal',
        'Json',
        'Bytes',
      ].includes(baseType);
      const isUnsupportedType = attributes.includes('Unsupported(');

      if (!isPrismaType && !isUnsupportedType && /^[A-Z]/.test(baseType)) {
        // Parse @relation attributes
        const relationMatch = attributes.match(/@relation\s*\(([^)]+)\)/);
        let relationInfo = {
          name: fieldName,
          type: fieldType,
          attributes,
          relationName: null,
          backPopulates: null,
        };

        if (relationMatch) {
          const relationAttrs = relationMatch[1];
          // Parse fields: [fieldName]
          const fieldsMatch = relationAttrs.match(/fields:\s*\[(\w+)\]/);
          // Parse references: [refField]
          const refMatch = relationAttrs.match(/references:\s*\[(\w+)\]/);
          // Parse relation name: "RelationName"
          const nameMatch = relationAttrs.match(/"([^"]+)"/);
          // Parse onDelete
          const onDeleteMatch = relationAttrs.match(/onDelete:\s*(\w+)/);

          if (fieldsMatch && refMatch) {
            const fkField = fieldsMatch[1];
            const refField = refMatch[1];
            // Store reference info - will resolve table name in second pass
            foreignKeys.set(fkField, {
              refModelName: baseType,
              refColumn: refField,
              onDelete: onDeleteMatch ? onDeleteMatch[1] : null,
              relationName: nameMatch ? nameMatch[1] : null,
            });
          }

          if (nameMatch) {
            relationInfo.relationName = nameMatch[1];
          }
        }

        // Determine back_populates name
        // If it's an array relation, the back_populates is the relation name (singular)
        // If it's a single relation, find the corresponding array relation
        if (fieldType.includes('[]')) {
          // Array side: back_populates should be the field name on the other side
          // We'll determine this when generating relationships
          relationInfo.backPopulates = baseType.charAt(0).toLowerCase() + baseType.slice(1);
        } else {
          // Single side: back_populates should match the array relation name on the other side
          relationInfo.backPopulates = null; // Will be set during relationship generation
        }

        relations.push(relationInfo);
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
      foreignKeys,
    });
  }

  // Second pass: resolve foreign key table names
  for (const model of models) {
    for (const [, fkInfo] of model.foreignKeys.entries()) {
      const refModel = models.find((m) => m.name === fkInfo.refModelName);
      if (refModel) {
        fkInfo.refTable = refModel.tableName;
        delete fkInfo.refModelName;
      }
    }
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
function generateModel(model, enums, allModels) {
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
    imports.add('import enum');
  }

  imports.add('from app.models.base import Base');

  let code = Array.from(imports).sort().join('\n') + '\n\n';

  // Generate enum classes if needed (only once per enum type)
  const generatedEnums = new Set();
  for (const field of model.fields) {
    const baseType = field.type.replace('?', '').replace('[]', '');
    const enumType = enums.find((e) => e.name === baseType);
    if (enumType && !generatedEnums.has(enumType.name)) {
      generatedEnums.add(enumType.name);
      const enumValues = enumType.values.map((v) => `    ${v.toUpperCase()} = "${v}"`).join('\n');
      code += `class ${enumType.name}(str, enum.Enum):\n${enumValues}\n\n`;
    }
  }

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

    // Check if this field has a foreign key
    const fkInfo = model.foreignKeys.get(field.name);
    let fkConstraint = '';
    if (fkInfo && fkInfo.refTable) {
      const onDeleteMap = {
        Cascade: 'CASCADE',
        SetNull: 'SET NULL',
        Restrict: 'RESTRICT',
      };
      const onDeleteStr = fkInfo.onDelete
        ? `, ondelete="${onDeleteMap[fkInfo.onDelete] || fkInfo.onDelete}"`
        : '';
      fkConstraint = `, ForeignKey("${fkInfo.refTable}.${fkInfo.refColumn}"${onDeleteStr})`;
    }

    // Check if it's an enum
    const baseType = field.type.replace('?', '').replace('[]', '');
    const enumType = enums.find((e) => e.name === baseType);
    let columnType;
    if (enumType) {
      columnType = `SQLEnum(${enumType.name}, name="${enumType.name
        .toLowerCase()
        .replace(/([A-Z])/g, '_$1')
        .toLowerCase()}")`;
    } else {
      columnType = sqlType;
    }

    const constraintStr = constraints.length > 0 ? ', ' + constraints.join(', ') : '';
    code += `    ${field.name} = Column("${field.columnName}", ${columnType}${fkConstraint}${constraintStr})\n`;
  }

  // Generate relationships
  if (model.relations.length > 0) {
    code += '\n    # Relationships\n';
    for (const rel of model.relations) {
      const relType = rel.type.replace('[]', '').replace('?', '');
      const isArray = rel.type.includes('[]');

      // Determine back_populates
      let backPopulates;
      if (rel.relationName) {
        // Named relation: find the corresponding relation on the other side
        const otherModel = allModels.find((m) => m.name === relType);
        if (otherModel) {
          const reverseRel = otherModel.relations.find((r) => r.relationName === rel.relationName);
          if (reverseRel) {
            backPopulates = reverseRel.name;
          } else {
            backPopulates = rel.name;
          }
        } else {
          backPopulates = rel.name;
        }
      } else if (isArray) {
        // Array side: back_populates is the singular field name on the other side
        const otherModel = allModels.find((m) => m.name === relType);
        if (otherModel) {
          // Find the relation on the other side that points back to this model
          const reverseRel = otherModel.relations.find(
            (r) =>
              r.type.replace('[]', '').replace('?', '') === model.name && !r.type.includes('[]')
          );
          if (reverseRel) {
            backPopulates = reverseRel.name;
          } else {
            // Fallback: use lowercase model name
            backPopulates = model.name.charAt(0).toLowerCase() + model.name.slice(1);
          }
        } else {
          backPopulates = model.name.charAt(0).toLowerCase() + model.name.slice(1);
        }
      } else {
        // Single side: back_populates is the array relation name on the other side
        const otherModel = allModels.find((m) => m.name === relType);
        if (otherModel) {
          const reverseRel = otherModel.relations.find(
            (r) => r.type.replace('[]', '').replace('?', '') === model.name && r.type.includes('[]')
          );
          if (reverseRel) {
            backPopulates = reverseRel.name;
          } else {
            // Fallback: pluralize the model name
            backPopulates = model.name.toLowerCase() + 's';
          }
        } else {
          backPopulates = model.name.toLowerCase() + 's';
        }
      }

      if (isArray) {
        code += `    ${rel.name} = relationship("${relType}", back_populates="${backPopulates}")\n`;
      } else {
        // Single relationship: check if we need uselist=False or foreign_keys
        let relParams = [`back_populates="${backPopulates}"`, 'uselist=False'];
        if (rel.relationName) {
          // For named relations, might need foreign_keys
          const fkField = Array.from(model.foreignKeys.keys()).find(
            (fk) => model.foreignKeys.get(fk)?.relationName === rel.relationName
          );
          if (fkField) {
            relParams.push(`foreign_keys=[${fkField}]`);
          }
        }
        code += `    ${rel.name} = relationship("${relType}", ${relParams.join(', ')})\n`;
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

  const modelCode = generateModel(model, enums, models);
  fs.writeFileSync(path.join(modelsDir, fileName), modelCode);
  console.log(`✅ Generated ${fileName}`);
}

console.log('');
console.log('✅ All SQLAlchemy models generated successfully!');
console.log(`📁 Models location: ${path.relative(rootDir, modelsDir)}`);
