import { $ } from "bun";

const station = "wlan0";

await $`iwctl station ${station} scan`.text();
const networks = await $`iwctl station ${station} get-networks`.text();
const networkList = networks
  .replace(/\x1B\[[0-9;]*m/g, "")
  .split("\n")
  .slice(4)
  .filter((line) => line.length > 0);

const selected = await $`echo ${networkList.join(
  "\n"
)} | wofi --show dmenu --prompt "Select a network"`
  .quiet()
  .text();

const ssidMatch = selected.trim().match(/^\s*(?:>\s*)?(\S+)\s+psk.*/);
const ssid = ssidMatch ? ssidMatch[1] : null;

if (ssid) {
  const passwordRaw = await $`(
  echo "SETPROMPT Enter the password for ${ssid}:"
  echo "GETPIN" ) | pinentry`
    .quiet()
    .text();

  const password = passwordRaw.split("\n")[1].substring(2);

  if (password) {
    await $`iwctl station ${station} connect ${ssid} --passphrase ${password}`;
    console.log(`Connected to ${ssid}`);
  } else {
    console.log("No password entered, connection aborted.");
  }
}
