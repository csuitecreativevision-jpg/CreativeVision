-- 1. Create the deployment_folders table
CREATE TABLE deployment_folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL
);

-- Enable RLS for the folders table
ALTER TABLE deployment_folders ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anon users full access (since the app uses custom localStorage Auth)
CREATE POLICY "Allow anon full access on folders" ON deployment_folders
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- 2. Modify the existing deployments table
-- Add the folder_id column (allowing NULL initially if there's existing data)
ALTER TABLE deployments ADD COLUMN folder_id UUID REFERENCES deployment_folders(id) ON DELETE CASCADE;

-- If you have existing records and want to migrate them:
-- You can either delete them or create a default folder and assign them.
-- To delete existing records (Optional, if you don't mind starting fresh):
-- DELETE FROM deployments;

-- Once you are ready, you can enforce that folder_id is NOT NULL (Optional but recommended):
-- ALTER TABLE deployments ALTER COLUMN folder_id SET NOT NULL;

-- 3. Modify the deployments table to drop client_name (since the Folder is now the Client)
ALTER TABLE deployments DROP COLUMN client_name;
