import bcrypt from 'bcryptjs';

const hashedPassword = '$2a$10$JHYgI3ftlxmYB8TvNCyjR.J19CRUcx2DQbi/4sp5SmgXkqr0bQwLK';

console.log('Testing password hash verification...');

const isValid = bcrypt.compareSync('admin123', hashedPassword);
console.log('Password "admin123" matches hash:', isValid);

const isWrong = bcrypt.compareSync('wrongpassword', hashedPassword);
console.log('Wrong password matches hash:', isWrong);

const isDifferent = bcrypt.compareSync('admin', hashedPassword);
console.log('Password "admin" matches hash:', isDifferent);

process.exit(0);