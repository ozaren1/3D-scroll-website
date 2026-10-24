import bcrypt from 'bcryptjs';

// Usage: npm run hash-password -- 'my password'
const password = process.argv[2];
if (!password || password.length < 12) {
  console.error('Pass a password of at least 12 characters as the first argument');
  process.exit(1);
}
console.log(bcrypt.hashSync(password, 12));
