import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// create a server instance
const server = new McpServer({
    name: "nmap agent",
    description: "A tool for scanning networks",
    version: "1.0.0"
  }
);

server.tool("ifconfig", {}, async () => {
  const command = new Deno.Command("ifconfig", {
    stdout: "piped", // Ensures stdout can be captured
  });
  
  const { stdout } = await command.output(); 
  const output = new TextDecoder().decode(stdout);
  
  return {
    content: [{ type: "text", text: output }]
  };
});

server.tool("curl_tool_for_http_requests",{
  url: z.string().url().nonempty().describe("The URL to curl"),
  method: z.enum(["GET", "POST", "PUT", "DELETE"]).describe("The HTTP method to use, default is GET"),
  headers: z.record(z.string()).optional().describe("The headers to include in the request, it's a key-value pair"),
  data: z.string().optional().describe("The data to include in the request, for POST and PUT requests"),
  timeout: z.number().optional().describe("The timeout for the request in seconds"),
  followRedirects: z.boolean().optional().describe("Whether to follow redirects"),
  }, async (request) => {
    const { url, method, headers, data, timeout, followRedirects } = request;
    const command = new Deno.Command("curl", {
      args: [
        "-X", method,
        "--header", `Content-Type: application/json`,
        ...Object.entries(headers).flatMap(([key, value]) => ["--header", `${key}: ${value}`]),
        ...(data ? ["--data", JSON.stringify(data)] : []),
        ...(timeout ? ["--max-time", timeout.toString()] : []),
        ...(followRedirects ? ["-L"] : []),
        url
      ],
      stdout: "piped",
  });

  const { stdout } = await command.output();
  const output = new TextDecoder().decode(stdout);
  return {
    content: [{ type: "text", text: output }]
  };
 
});

server.tool("scan_live_hosts",
  {
    scanType: z.enum(["-PE", "-PR", "-PS", "-PU"]).describe("The type of  live host discovery scan to perform, -PE for ping scan, -PR for ARP scan, -PS for TCP scan, -PU for UDP scan"),
    target: z.string().cidr().nonempty().describe("The target to scan for example 198.161.0.1/24"),
    speed: z.enum(["-T0", "-T1", "-T2", "-T3", "-T4", "-T5"]).optional().describe("The speed of the scan, -T0 for paranoid, -T1 for sneaky, -T2 for polite, -T3 for normal, -T4 for aggressive, -T5 for insane"),
  },
  async (request) => {
    const { scanType, target, ipRange } = request;
    const command = new Deno.Command("nmap", {
      args: [scanType, "-sn", speed, `${target}`],
      stdout: "piped",
  });
  
  const { stdout } = await command.output(); 
  const output = new TextDecoder().decode(stdout); 

  return {
    content: [{ type: "text", text: output }]
  };
  } 
);

server.tool("scan_ports",
  {
    scanType: z.enum(["-sT", "-sS", "-sU", "-sV"]).describe("The type of port scan to perform, -sT for TCP connect scan, -sS for SYN scan, -sU for UDP scan, -sV for version detection"),
    target: z.string().ip().nonempty().describe("The ip target to scan for example 198.161.0.1"),
    portRange: z.string().optional().describe("The range of ports to scan for example for range -p1-1000, for specific ports -p80,443, for all ports -p-, keep empty for 1,000 most common por which is preferable"),
    speed: z.enum(["-T0", "-T1", "-T2", "-T3", "-T4", "-T5"]).optional().describe("The speed of the scan, -T0 for paranoid, -T1 for sneaky, -T2 for polite, -T3 for normal, -T4 for aggressive, -T5 for insane"),
  },
  async (request) => {
    const { scanType, target, portRange, speed } = request;
    const command = new Deno.Command("nmap", {
      args: [scanType, portRange, speed, target],
      stdout: "piped",
  });
  
  const { stdout } = await command.output(); 
  const output = new TextDecoder().decode(stdout); 
  return {
    content: [{ type: "text", text: output }]
  };
  }
);

//gobuster
server.tool("gobuster_dir",
  {
    url: z.string().url().nonempty().describe("The URL to scan"),
    wordlist: z.string().nonempty().describe("The wordlist to use for the scan"),
    extensions: z.string().optional().describe("The file extensions to include in the scan"),
    timeout: z.number().optional().describe("The timeout for the request in seconds"),
  },
  async (request) => {
    const { url, wordlist, extensions, threads, timeout } = request;
    const command = new Deno.Command("gobuster", {
      args: [
        "dir",
        "-u", url,
        "-w", wordlist,
        ...(extensions ? ["-x", extensions] : []),
        ...(timeout ? ["--timeout", timeout.toString()] : []),
      ],
      stdout: "piped",
  });
  
  const { stdout } = await command.output(); 
  const output = new TextDecoder().decode(stdout); 
  return {
    content: [{ type: "text", text: output }]
  };
  }
);


// Start server
try{
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Secure MCP nmap Server running on stdio");
}
catch (error) {
  console.error("Failed to start server: ", error);
}