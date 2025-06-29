-- Patch migrating roles and related tables to UUID keys
create extension if not exists "uuid-ossp";

-- Only run migration if roles.id is not already UUID
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='roles' AND column_name='id' AND data_type <> 'uuid'
  ) THEN
    -- Cleanup existing constraints and indexes
    DROP INDEX IF EXISTS idx_users_role;
    DROP INDEX IF EXISTS idx_permissions_role;
    ALTER TABLE IF EXISTS permissions DROP CONSTRAINT IF EXISTS permissions_role_id_fkey;
    ALTER TABLE IF EXISTS users DROP CONSTRAINT IF EXISTS users_role_id_fkey;

    -- Add temporary UUID columns
    ALTER TABLE roles ADD COLUMN IF NOT EXISTS id_uuid uuid;
    UPDATE roles SET id_uuid = uuid_generate_v4() WHERE id_uuid IS NULL;

    ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id_uuid uuid;
    UPDATE users SET role_id_uuid = r.id_uuid FROM roles r WHERE users.role_id = r.id;

    ALTER TABLE permissions ADD COLUMN IF NOT EXISTS role_id_uuid uuid;
    UPDATE permissions SET role_id_uuid = r.id_uuid FROM roles r WHERE permissions.role_id = r.id;

    -- Drop old integer columns
    ALTER TABLE users DROP COLUMN IF EXISTS role_id;
    ALTER TABLE permissions DROP COLUMN IF EXISTS role_id;
    ALTER TABLE roles DROP COLUMN IF EXISTS id;

    -- Rename new columns
    ALTER TABLE roles RENAME COLUMN id_uuid TO id;
    ALTER TABLE users RENAME COLUMN role_id_uuid TO role_id;
    ALTER TABLE permissions RENAME COLUMN role_id_uuid TO role_id;

    -- Recreate constraints
    ALTER TABLE roles ALTER COLUMN id SET DEFAULT uuid_generate_v4();
    ALTER TABLE roles ALTER COLUMN id SET NOT NULL;
    ALTER TABLE roles ADD PRIMARY KEY (id);

    ALTER TABLE users ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES roles(id);
    ALTER TABLE permissions ADD CONSTRAINT permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE;

    -- Recreate indexes
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);
    CREATE INDEX IF NOT EXISTS idx_permissions_role ON permissions(role_id);
  END IF;
END $$;
