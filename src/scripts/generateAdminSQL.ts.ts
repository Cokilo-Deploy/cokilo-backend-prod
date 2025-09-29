import bcrypt from 'bcrypt';

async function generateAdminSQL() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] || 'Admin';
  const role = process.argv[5] || 'admin';

  if (!email || !password) {
    console.log('\n❌ Usage: npm run generate-admin <email> <password> [nom] [role]');
    console.log('Exemple: npm run generate-admin admin@cokilo.com MonMotDePasse123 "Admin CoKilo" super_admin\n');
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 12);
  
  console.log('\n✅ Requête SQL générée:\n');
  console.log(`INSERT INTO "admins" ("email", "password", "name", "role", "isActive", "createdAt", "updatedAt")
VALUES (
  '${email}',
  '${hash}',
  '${name}',
  '${role}',
  true,
  NOW(),
  NOW()
);\n`);
  
  console.log('📋 Copiez cette requête et exécutez-la dans pgAdmin\n');
}

generateAdminSQL();