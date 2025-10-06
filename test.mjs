import bcrypt from 'bcrypt';
const hash = '$2b$10$hu1Ay3grCiXilPQXRcXJT.nKrmwk/7uZPKb8TfZwTIOJsW7mZy3h2';
const plain = 'officer123';
const ok = await bcrypt.compare(plain, hash);
console.log('compare =', ok);

// // make-hash.mjs
// import bcrypt from 'bcryptjs'; 
// const plain = process.argv[2] || 'officer123';
// const hash = bcrypt.hashSync(plain, 10);
// console.log(hash);