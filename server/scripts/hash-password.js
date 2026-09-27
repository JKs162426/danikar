import bcrypt from "bcryptjs";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

const rl = readline.createInterface({ input: stdin, output: stdout });
const password = await rl.question("Contraseña para el admin: ");
rl.close();

if (password.length < 10) {
  console.error("\nUsa al menos 10 caracteres. Es la única puerta que hay.");
  process.exit(1);
}

console.log(
  "\nADMIN_PASSWORD_HASH=" + (await bcrypt.hash(password, 12)) + "\n"
);
