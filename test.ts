const command = new Deno.Command("C:\\Program Files (x86)\\Nmap\\nmap.exe", {
    args: ["-PE", "-sn", `198.167.0.0/24`],
    stdout: "piped",
});

// Spawn the process and capture the output
const process = command.spawn();
const { stdout } = await process.output(); // Correct way to get output
const output = new TextDecoder().decode(stdout);
console.log(output);