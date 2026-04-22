import bcrypt from "bcryptjs";

const pin = process.argv[2];

if (!pin) {
  console.error("Usage: npm run hash:pin -- <PIN>");
  process.exit(1);
}

if (!/^\d{4,12}$/.test(pin)) {
  console.error("PIN must contain 4 to 12 digits.");
  process.exit(1);
}

const hash = await bcrypt.hash(pin, 12);
console.log(hash);
