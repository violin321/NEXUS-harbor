import { ProfileForm } from '@/components/admin/profile-form';
import { createDbClient } from '@/lib/db';
import { requireAdmin } from '@/modules/auth/server';

function getLocalClient() {
  return createDbClient();
}

export default async function ProfilePage() {
  const { user } = await requireAdmin({ redirectTo: '/admin/login' });

  // Read profile DIRECTLY from local DB on server
  const client = getLocalClient();
  let profileData = { display_name: '', avatar_url: '', github_username: '', preferences: { theme: 'system' } };
  try {
    await client.connect();
    const { rows } = await client.query(
      `SELECT display_name, avatar_url, preferences, github_username FROM user_profiles WHERE user_id = $1`,
      [user.id]
    );
    await client.end();
    if (rows[0]) {
      profileData = {
        display_name: rows[0].display_name || '',
        avatar_url: rows[0].avatar_url || '',
        github_username: rows[0].github_username || '',
        preferences: rows[0].preferences || { theme: 'system' },
      };
    }
  } catch {
    await client.end().catch(() => {});
  }

  return (
    <ProfileForm
      user={user}
      initialDisplayName={profileData.display_name}
      initialTheme={profileData.preferences.theme || 'system'}
      initialAvatar={profileData.avatar_url}
      initialGithub={profileData.github_username}
    />
  );
}
