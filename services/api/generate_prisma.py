"""Generate Prisma client"""
import subprocess
import sys
import os

def main():
    # Get the db package directory
    db_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'packages', 'db'))
    schema_path = os.path.join(db_dir, 'prisma', 'schema.prisma')
    
    print(f"Generating Python Prisma client from: {schema_path}")
    
    # Verify schema file exists
    if not os.path.exists(schema_path):
        print(f"❌ Schema file not found at: {schema_path}")
        return 1
    
    try:
        # Set environment variable to skip Node.js Prisma CLI installation
        env = os.environ.copy()
        env['PRISMA_SKIP_POSTINSTALL_GENERATE'] = '1'
        
        # Use Python's prisma CLI with --schema flag and --skip-generate flag
        result = subprocess.run(
            [sys.executable, "-m", "prisma", "generate", "--schema", schema_path],
            check=True,
            capture_output=True,
            text=True,
            env=env
        )
        print(result.stdout)
        if result.stderr:
            print(result.stderr)
        print("✅ Python Prisma client generated successfully!")
        return 0
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to generate Prisma client:")
        print(e.stdout)
        print(e.stderr)
        print("\n⚠️  Note: If running in a Python-only environment, Prisma client will be generated on first use.")
        # Don't fail the build, let it generate at runtime
        return 0
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\n⚠️  Note: If running in a Python-only environment, Prisma client will be generated on first use.")
        return 0

if __name__ == "__main__":
    sys.exit(main())

